import ballerina/http;
import ballerina/io;
import ballerina/uuid;
import ballerina/time;
import ballerina/data.jsondata;
import ballerina/data.xmldata;
import ballerinax/googleapis.gmail;

import ballerina/lang.runtime; // for panic stack traces if needed

// ---------- Configurables (declare in Config.toml) ----------
configurable decimal basePrice = ?;
configurable decimal perKg = ?;
configurable string refreshToken = ?;
configurable string clientId = ?;
configurable string clientSecret = ?;

// ---------- Data store ----------
table<Delivery> key(trackingCode) deliveryTable = table [];

// ---------- Gmail client ----------
final gmail:Client gmailClient = check new gmail:Client(
    config = { auth: {
        refreshToken,
        clientId,
        clientSecret
    }}
);

// ---------- Service ----------
service /delivery\-tracking on new http:Listener(9090) {

    // Create a delivery
    resource function post deliveries(DeliveryInsert deliveryInsert) returns Delivery|error {
        string trackingCode = uuid:createRandomUuid();
        decimal cost = basePrice + perKg * deliveryInsert.weightKg;

        Delivery delivery = {
            trackingCode,
            cost,
            // defaults & spread
            status: PENDING,
            createdDate: time:toString(time:utcNow()),
            ...deliveryInsert
        };

        deliveryTable.put(delivery);
        return delivery;
    }

    // List deliveries with optional filters
    resource function get deliveries(string? status, string? customerId) returns Delivery[] {
        return deliveryTable
            .filter(d => status is () || status == d.status)
            .filter(d => customerId is () || customerId == d.customerId)
            .toArray();
    }

    // Update a delivery's status (and delivered date if set)
    resource function patch deliveries/[string trackingCode](DeliveryUpdate deliveryUpdate)
            returns Delivery|http:NotFound|error {
        Delivery? delivery = deliveryTable[trackingCode];
        if delivery is () {
            return http:NOT_FOUND;
        }

        delivery.status = deliveryUpdate.status;
        if deliveryUpdate.status == DELIVERED && deliveryUpdate.deliveredDate is string {
            delivery.deliveredDate = deliveryUpdate.deliveredDate;
        }

        // send notification on status change
        check notifyCustomer(delivery);
        return delivery;
    }

    // Basic KPIs
    resource function get summary() returns Summary {
        int totalDeliveries = deliveryTable.length();
        decimal averageCost = from var {cost} in deliveryTable
            collect avg(cost) ?: 0d;

        int pendingCount = from var {trackingCode, status} in deliveryTable
            where status == PENDING
            collect count(trackingCode);

        int inTransitCount = from var {trackingCode, status} in deliveryTable
            where status == IN_TRANSIT
            collect count(trackingCode);

        int deliveredCount = from var {trackingCode, status} in deliveryTable
            where status == DELIVERED
            collect count(trackingCode);

        return {
            totalDeliveries,
            averageCost,
            statusBreakdown: {
                pending: pendingCount,
                inTransit: inTransitCount,
                delivered: deliveredCount
            }
        };
    }

    // Aggregate live tracking data from JSON (Carrier A) and XML (Carrier B)
    resource function get monitor() returns Tracking[]|error {
        json carrierAJson = check io:fileReadJson("./resources/carrier-a.json");
        Tracking[] trackings = check jsondata:parseAsType(carrierAJson);

        xml carrierBXml = check io:fileReadXml("./resources/carrier-b.xml");
        Trackings xmlTrackings = check xmldata:parseAsType(carrierBXml);

        // merge
        trackings.push(...xmlTrackings.Tracking);
        return trackings;
    }
}

// ---------- Email helper ----------
function notifyCustomer(Delivery delivery) returns error? {
    gmail:MessageRequest message = {
        to: [delivery.customerEmail],
        subject: "Delivery Status Update",
        bodyInHtml: string `<html>
            <head><title>Delivery Update</title></head>
            <body>
                <p>Hello ${delivery.customerId},</p>
                <p>The status of your delivery <b>${delivery.trackingCode}</b>
                has been updated to <b>${delivery.status}</b>.</p>
                ${delivery.deliveredDate is string ? 
                    string `<p>Delivered on: ${delivery.deliveredDate}</p>` : ""}
            </body>
        </html>`
    };
    // Gmail API: POST /users/me/messages/send
    gmail:Message _ = check gmailClient->/users/me/messages/send.post(message);
}
