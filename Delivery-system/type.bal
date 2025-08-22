import ballerina/time;

// Enum-like string constants
public const PENDING = "PENDING";
public const IN_TRANSIT = "IN_TRANSIT";
public const DELIVERED = "DELIVERED";
public type Status PENDING|IN_TRANSIT|DELIVERED;

// Core record stored in the in-memory table
public type Delivery record {|
    // key
    readonly string trackingCode;

    // customer details
    string customerId;
    string customerEmail;

    // parcel meta
    decimal weightKg;
    string? origin;
    string? destination;
    string? description;

    // lifecycle
    Status status;
    string createdDate;
    string? deliveredDate;

    // pricing
    decimal cost;
|};

// POST /deliveries payload (server derives trackingCode, cost, createdDate, default status)
public type DeliveryInsert record {|
    string customerId;
    string customerEmail;
    decimal weightKg;
    string? origin;
    string? destination;
    string? description;
|};

// PATCH /deliveries/{trackingCode} payload
public type DeliveryUpdate record {|
    Status status;
    string? deliveredDate;
|};

// GET /summary response
public type Summary record {|
    int totalDeliveries;
    decimal averageCost;
    record {|
        int pending;
        int inTransit;
        int delivered;
    |} statusBreakdown;
|};

// Monitoring feed item
public type Tracking record {|
    string trackingCode;
    string carrier;
    string location;
    string timestamp; // ISO-8601 string
    Status status;
|};

// XML mapping root for Carrier B
public type Trackings record {|
    Tracking[] Tracking;
|};
