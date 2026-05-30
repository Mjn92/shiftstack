# ShiftStack

A full-stack employee clock-in and clock-out system built with React Native, React, RabbitMQ, PostgreSQL, and Node.js.

ShiftStack is designed as a portfolio project to demonstrate modern full-stack application development, secure authentication, message queue architecture, database design, and mobile/web application integration.

---

# Current Project Status

## Day 1 - Project Planning & Setup

- Project architecture planned
- GitHub repository initialized
- React Native mobile app initialized
- React web dashboard initialized
- Backend structure planned
- Docker environment configured
- PostgreSQL and RabbitMQ planned
- Database schema drafted
- API routes planned

## Day 2 - Backend Foundation

- Backend Express server created
- PostgreSQL database connected
- Docker services configured and running
- Initial database tables created
- API route structure created
- Health check endpoint created
- Employee API endpoint created
- PostgreSQL schema initialized
- Environment variables configured
- Postman API testing setup started

## Day 3 - Authentication System

- Employee registration endpoint created
- Employee login endpoint created
- Password hashing implemented with bcrypt
- JWT authentication implemented
- Authentication middleware created
- Protected route system created
- Role-based access control middleware created
- Current user endpoint created
- Admin routes protected
- Token validation working
- Authentication testing completed in Postman

### New API Routes

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

````

### Security Improvements

- Passwords are securely hashed before storage
- JWT tokens used for authentication
- Protected routes require valid authentication token
- Role-based authorization implemented
- Admin routes restricted to manager/admin roles
- Session expiration configured through JWT

---

# Features

## Employee Features

- Secure login authentication
- Clock in / clock out
- View personal time history
- View current shift status
- Mobile-friendly experience

## Manager Features

- View employee time entries
- View weekly reports
- Filter records by employee/date
- Approve employee timesheets

## Admin Features

- Manage employees
- Role-based access control
- Audit logging
- View system activity
- Manage reports

---

# Tech Stack

## Frontend

- React Native + Expo
- React / Next.js
- Tailwind CSS

## Backend

- Node.js
- Express.js
- RabbitMQ
- PostgreSQL

## DevOps / Tools

- Docker
- Docker Compose
- GitHub
- Postman
- pgAdmin

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

# Project Structure

```text
shiftstack/
├── mobile-app/
├── web-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── workers/
│   │   ├── utils/
│   │   ├── db/
│   │   ├── models/
│   │   └── server.js
│   └── .env
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

- PostgreSQL
- RabbitMQ
- pgAdmin

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

## Current Tables

### employees

Stores employee account information.

Fields:

- id
- first_name
- last_name
- email
- password_hash
- role
- active
- created_at

### time_entries

Stores employee clock-in and clock-out records.

Fields:

- id
- employee_id
- clock_in
- clock_out
- total_minutes
- status
- note
- created_at

### sessions

Stores user authentication sessions.

Fields:

- id
- employee_id
- token
- expires_at
- created_at

### audit_logs

Stores important system actions and events.

Fields:

- id
- employee_id
- action
- details
- created_at

---

# API Routes

## Current Routes

### Health Check

```http
GET /api/health
```

Returns API status.

### Authentication Routes

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Admin Routes

```http
GET /api/admin/employees
```

Returns employee list.

---

# RabbitMQ Queues

## Planned Queues

- auth_queue
- clock_in_queue
- clock_out_queue
- timesheet_queue
- admin_report_queue
- audit_log_queue

---

# Security Features

## Current

- Environment variable configuration
- Backend/server separation
- PostgreSQL database isolation
- Structured API architecture
- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Role-based access control
- Token validation

## Planned

- Audit logging
- Session expiration table integration
- Refresh tokens
- Rate limiting
- Secure API validation
- Multi-factor authentication
- Account lockout protection

---

# Screens

## Mobile App

- Login Screen
- Dashboard
- Clock In / Clock Out
- Time History
- Profile

## Web Dashboard

- Admin Dashboard
- Employees Page
- Reports Page
- Audit Logs
- Settings

---

# Backend Progress

## Completed Features

### Day 1

- Project planning
- Architecture design
- Database planning

### Day 2

- Express server configured
- PostgreSQL database connection established
- Dockerized PostgreSQL instance running
- RabbitMQ service configured
- pgAdmin service configured
- API route system created
- Health endpoint operational
- Employee API endpoint operational
- SQL schema initialized

### Day 3

- User registration system
- Login system
- Password hashing
- JWT token generation
- Authentication middleware
- Protected routes
- Role-based authorization
- Current user endpoint

## Working Endpoints

```http
GET  /api/health

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/admin/employees
```

---

# Goals of This Project

This project is intended to demonstrate:

- Full-stack development
- Mobile application development
- Secure authentication systems
- Message queue architecture
- SQL database design
- Backend API development
- Dockerized environments
- Real-world scalable architecture

---

# Planned Features

- JWT Authentication
- Audit logs
- CSV exports
- Manager approval workflow
- GPS clock-in verification
- QR code clock-in
- Overtime calculations
- Shift scheduling
- Mobile notifications

---

# Future Improvements

- Payroll integration
- Facial recognition clock-in
- Push notifications
- Multi-company support
- Real-time dashboard updates
- Analytics and charts

---

# Author

**Matthew J. Nicol**

GitHub: [https://github.com/Mjn92](https://github.com/Mjn92)

LinkedIn: [https://www.linkedin.com/in/matthew-nicol-56b089b0/](https://www.linkedin.com/in/matthew-nicol-56b089b0/)
````
