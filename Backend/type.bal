import ballerina/constraint;
enum DeliveryStatus {
    PENDING="pending",
    IN_TRANSIT="in_transit",
    DELIVERED="delivered",
    RETURNED="returned"
};

type DeliveryInsert record {|
    @constraint:String{ // String constraints for validation
        minLength: 1,
        maxLength: 10
    }
    string customerId;
    string customerEmail;
    string address;
    decimal weightKg;
    json...;
|};

type Delivery record {|
    *DeliveryInsert; // Inherits all fields from DeliveryInsert
    string trackingCode;
    DeliveryStatus status=PENDING; // Default status is PENDING
    decimal cost;
    string deliveredDate?;
    json...;
|};
