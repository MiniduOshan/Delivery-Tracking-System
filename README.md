# Delivery Tracking System 🚚📦

A **Delivery Tracking System** built with **Ballerina** as the backend and (optional) **React frontend**.
This system allows customers to track their orders, delivery personnel to update status, and admins to manage the delivery process.

---

## 📌 Features

* **Order Management** – Place and view delivery orders.
* **Tracking System** – Track delivery status in real-time.
* **Delivery Updates** – Delivery personnel can update progress (e.g., *Processing → Out for Delivery → Delivered*).
* **RESTful API** built with **Ballerina**.
* **Database Integration** – Store orders, users, and delivery info.
* **Optional React Frontend** for a user-friendly interface.

---

## 🏗️ Project Structure

```
delivery-tracking-system/
│── backend/ (Ballerina Services)
│   ├── delivery_service.bal
│   ├── order_service.bal
│   ├── user_service.bal
│   ├── Config.toml
│   └── Ballerina.toml
│
│── frontend/ (React App - optional)
│   ├── src/
│   └── package.json
│
│── README.md
```

---

## ⚙️ Requirements

* [Ballerina](https://ballerina.io/downloads/) (v2201.x or later)
* Node.js (if using React frontend)
* A Database (e.g., MySQL, PostgreSQL, MongoDB)

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/delivery-tracking-system.git
cd delivery-tracking-system
```

### 2️⃣ Setup Backend (Ballerina)

Navigate to backend folder:

```bash
cd backend
```

Run the service:

```bash
bal run
```

The service will start at:
👉 `http://localhost:9090`

### 3️⃣ API Endpoints

#### Orders

* `POST /orders` → Create new order
* `GET /orders/{id}` → Get order by ID
* `GET /orders` → List all orders

#### Tracking

* `PUT /orders/{id}/status` → Update delivery status
* `GET /orders/{id}/status` → Check current status

#### Users

* `POST /users` → Register new user
* `GET /users/{id}` → Get user details

---

### 4️⃣ Setup Frontend (Optional - React)

```bash
cd frontend
npm install
npm start
```

App runs on 👉 `http://localhost:3000`

---

## 🛢️ Database Schema (Example)

**orders table**

| id | customer\_id | item   | status           | created\_at      |
| -- | ------------ | ------ | ---------------- | ---------------- |
| 1  | 101          | Laptop | Out for Delivery | 2025-08-30 10:00 |

**users table**

| id  | name     | email                                               | role     |
| --- | -------- | --------------------------------------------------- | -------- |
| 101 | Riva     | [riva@example.com](mailto:riva@example.com)         | customer |
| 201 | John Doe | [delivery@company.com](mailto:delivery@company.com) | delivery |

---

## 🛠️ Tech Stack

* **Backend:** Ballerina
* **Frontend (optional):** React + Tailwind CSS
* **Database:** MySQL / PostgreSQL

---

## 📖 Future Enhancements

* ✅ Authentication & Authorization (JWT)
* ✅ Push Notifications for delivery updates
* ✅ Mobile App support
* ✅ Analytics Dashboard for Admins

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss any major changes.

---
