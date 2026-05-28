# ShiftStack

A full-stack employee clock-in and clock-out system built with React Native, React, RabbitMQ, PostgreSQL, and Node.js.

ShiftStack is designed as a portfolio project to demonstrate modern full-stack application development, secure authentication, message queue architecture, database design, and mobile/web application integration.

---

# Features

## Employee Features

* Secure login authentication
* Clock in / clock out
* View personal time history
* View current shift status
* Mobile-friendly experience

## Manager Features

* View employee time entries
* View weekly reports
* Filter records by employee/date
* Approve employee timesheets

## Admin Features

* Manage employees
* Role-based access control
* Audit logging
* View system activity
* Manage reports

---

# Tech Stack

## Frontend

* React Native + Expo
* React / Next.js
* Tailwind CSS

## Backend

* Node.js
* Express.js
* RabbitMQ
* PostgreSQL

## DevOps / Tools

* Docker
* Docker Compose
* GitHub
* Postman
* pgAdmin

---

# Architecture

```text
Mobile App / Web Dashboard
        |
        | HTTPS Requests
        v
Backend API Server
        |
        | Publishes Messages
        v
RabbitMQ Message Broker
        |
        | Consumes Jobs
        v
Worker Services
        |
        | SQL Queries
        v
PostgreSQL Database
```

---

# Planned Features

* JWT Authentication
* Secure password hashing
* Audit logs
* CSV exports
* Manager approval workflow
* GPS clock-in verification
* QR code clock-in
* Overtime calculations
* Shift scheduling
* Mobile notifications

---

# Project Structure

```text
shiftstack/
├── mobile-app/
├── web-dashboard/
├── backend/
├── docs/
├── docker-compose.yml
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/shiftstack.git
cd shiftstack
```

---

# Install Dependencies

## Mobile App

```bash
cd mobile-app
npm install
```

## Web Dashboard

```bash
cd ../web-dashboard
npm install
```

## Backend

```bash
cd ../backend
npm install
```

---

# Start Docker Services

From project root:

```bash
docker compose up -d
```

Services included:

* PostgreSQL
* RabbitMQ
* pgAdmin

---

# Run Applications

## Backend

```bash
cd backend
npm run dev
```

Runs on:

```text
http://localhost:5000
```

---

## Web Dashboard

```bash
cd web-dashboard
npm run dev
```

Runs on:

```text
http://localhost:3000
```

---

## Mobile App

```bash
cd mobile-app
npm start
```

Scan QR code with Expo Go.

---

# Environment Variables

Create `.env` inside backend folder:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=shiftstack

RABBITMQ_URL=amqp://localhost

JWT_SECRET=supersecretkey
```

---

# Database Tables

## Planned Tables

* employees
* time_entries
* sessions
* audit_logs
* timesheet_approvals

---

# RabbitMQ Queues

## Planned Queues

* auth_queue
* clock_in_queue
* clock_out_queue
* timesheet_queue
* admin_report_queue
* audit_log_queue

---

# Security Features

* Password hashing with bcrypt
* JWT authentication
* Role-based access control
* Secure API validation
* Audit logging
* Session expiration
* Protected routes

---

# Screens

## Mobile App

* Login Screen
* Dashboard
* Clock In / Clock Out
* Time History
* Profile

## Web Dashboard

* Admin Dashboard
* Employees Page
* Reports Page
* Audit Logs
* Settings

---

# Goals of This Project

This project is intended to demonstrate:

* Full-stack development
* Mobile application development
* Secure authentication systems
* Message queue architecture
* SQL database design
* Backend API development
* Dockerized environments
* Real-world scalable architecture

---

# Future Improvements

* Payroll integration
* Facial recognition clock-in
* Push notifications
* Multi-company support
* Real-time dashboard updates
* Analytics and charts

---

# Author

**Matthew J. Nicol**
GitHub: [Mjn92 GitHub](https://github.com/Mjn92?utm_source=chatgpt.com)
LinkedIn: [Matthew Nicol LinkedIn](https://www.linkedin.com/in/matthew-nicol-56b089b0/)
