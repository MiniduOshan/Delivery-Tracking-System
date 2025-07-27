import React from "react";
import DeliveryForm from "./components/DeliveryForm";
import DeliveryTracker from "./components/DeliveryTracker";
import "./App.css";

function App() {
  return (
    <div className="container">
      <h1>Delivery Tracking System</h1>
      <DeliveryForm />
      <hr />
      <DeliveryTracker />
    </div>
  );
}

export default App;
