import React, { useState } from "react";

function DeliveryForm() {
  const [form, setForm] = useState({
    customerId: "",
    customerEmail: "",
    address: "",
    weightKg: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.customerId.length < 1 || form.customerId.length > 10) {
      alert("Customer ID must be between 1 and 10 characters.");
      return;
    }

    try {
      const response = await fetch("http://localhost:9090/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      alert("Delivery created! Tracking Code: " + data.trackingCode);
    } catch (error) {
      alert("Failed to create delivery.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>New Delivery</h2>
      <input
        type="text"
        name="customerId"
        placeholder="Customer ID"
        value={form.customerId}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="customerEmail"
        placeholder="Customer Email"
        value={form.customerEmail}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="address"
        placeholder="Delivery Address"
        value={form.address}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        step="0.1"
        name="weightKg"
        placeholder="Weight (kg)"
        value={form.weightKg}
        onChange={handleChange}
        required
      />
      <button type="submit">Create Delivery</button>
    </form>
  );
}

export default DeliveryForm;
