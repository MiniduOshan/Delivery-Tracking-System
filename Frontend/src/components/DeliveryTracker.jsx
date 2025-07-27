import React, { useState } from "react";

function DeliveryTracker() {
  const [trackingCode, setTrackingCode] = useState("");
  const [delivery, setDelivery] = useState(null);

  const handleTrack = async () => {
    try {
      const res = await fetch(`http://localhost:9090/api/deliveries/${trackingCode}`);
      const data = await res.json();
      setDelivery(data);
    } catch (err) {
      alert("Tracking code not found.");
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Track Delivery</h2>
      <input
        type="text"
        placeholder="Enter Tracking Code"
        value={trackingCode}
        onChange={(e) => setTrackingCode(e.target.value)}
      />
      <button onClick={handleTrack}>Track</button>

      {delivery && (
        <div className="delivery-info">
          <p><strong>Customer ID:</strong> {delivery.customerId}</p>
          <p><strong>Email:</strong> {delivery.customerEmail}</p>
          <p><strong>Address:</strong> {delivery.address}</p>
          <p><strong>Status:</strong> {delivery.status}</p>
          <p><strong>Cost:</strong> {delivery.cost}</p>
          <p><strong>Delivered Date:</strong> {delivery.deliveredDate || "N/A"}</p>
        </div>
      )}
    </div>
  );
}

export default DeliveryTracker;
