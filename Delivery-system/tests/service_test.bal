import ballerina/http;
import ballerina/test;

// NOTE: the service listens at /delivery-tracking on port 9090
http:Client client = checkpanic new ("http://localhost:9090/delivery-tracking");

// ----------------- Suite Hooks -----------------
@test:BeforeSuite
function beforeSuiteFunc() {
    // If you want, seed test data here (we create via the first test anyway).
}

// ----------------- Tests -----------------

// Create a delivery and verify the response
@test:Config {}
function testCreateDelivery() returns error? {
    json payload = {
        customerId: "cust-001",
        customerEmail: "customer@example.com",
        weightKg: 2.5,
        origin: "Warehouse A",
        destination: "City B",
        description: "Books"
    };

    http:Response res = check client->post("/deliveries", payload);
    test:assertEquals(res.statusCode, 200);

    json created = check res.getJsonPayload();
    test:assertTrue(created.trackingCode is string, msg = "trackingCode missing");
    test:assertEquals(created.customerId.toString(), "cust-001");
    test:assertTrue(created.cost is decimal|int);
    // store tracking code in a module-level var if you want to reuse it later
}

// List deliveries (unfiltered and filtered)
@test:Config {}
function testListDeliveries() returns error? {
    http:Response resAll = check client->get("/deliveries");
    test:assertEquals(resAll.statusCode, 200);

    json listAll = check resAll.getJsonPayload();
    test:assertTrue(listAll is json[], msg = "Expected an array");

    http:Response resByCustomer = check client->get("/deliveries?customerId=cust-001");
    test:assertEquals(resByCustomer.statusCode, 200);

    json listByCustomer = check resByCustomer.getJsonPayload();
    test:assertTrue(listByCustomer is json[]);
    test:assertTrue((<json[]>listByCustomer).length() >= 1, msg = "Expected at least one item for cust-001");
}

// Summary KPIs
@test:Config {}
function testSummary() returns error? {
    http:Response res = check client->get("/summary");
    test:assertEquals(res.statusCode, 200);

    json summary = check res.getJsonPayload();
    test:assertTrue(summary.totalDeliveries is int);
    test:assertTrue(summary.averageCost is decimal|int);

    json sb = <json>summary["statusBreakdown"];
    test:assertTrue(sb.pending is int);
    test:assertTrue(sb.inTransit is int);
    test:assertTrue(sb.delivered is int);
}

// Monitor endpoint (merges JSON + XML resources)
@test:Config {}
function testMonitor() returns error? {
    http:Response res = check client->get("/monitor");
    test:assertEquals(res.statusCode, 200);

    json items = check res.getJsonPayload();
    test:assertTrue(items is json[]);
    test:assertTrue((<json[]>items).length() >= 2, msg = "Expected merged tracking feed to have items");
}

// ----------------- Suite Teardown -----------------
@test:AfterSuite
function afterSuiteFunc() {
    // no-op
}
