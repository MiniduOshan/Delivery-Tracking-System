import ballerina/http;

# A service representing a network-accessible API
# bound to port `9090`.
service /Delivery\-Tracking on new http:Listener(9090) {

    # A resource for generating greetings
    # + name - name as a string or nil
    # + return - string name with hello message or error
    resource function post deliveries(DeliveryInsert deliveryInsert) {
        

       // TODO (Add all the functions from type.bal and email module)
       //Add config.toml and declare for undefined


    }
}
