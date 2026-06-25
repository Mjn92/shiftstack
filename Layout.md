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

### Authentication Routes

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Security Improvements

- Passwords are securely hashed before storage
- JWT tokens used for authentication
- Protected routes require valid authentication token
- Role-based authorization implemented
- Admin routes restricted to manager/admin roles
- Session expiration configured through JWT

## Day 4 - Clock In / Clock Out Logic

- Clock-in endpoint created
- Clock-out endpoint created
- Current clock status endpoint created
- Personal time entries endpoint created
- Double clock-in prevention added
- Clock-out without active shift prevention added
- Total worked minutes calculation added
- Time routes protected with JWT authentication
- Employee shift status tracking implemented
- Postman testing completed for clock-in/clock-out workflow

### Time Tracking Routes

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

### Time Tracking Features

- Employees can clock in once per active shift
- Employees cannot clock in twice without clocking out
- Employees cannot clock out without an active shift
- Total worked minutes are automatically calculated
- Employees can view their complete shift history
- Current shift status can be checked in real time
- All time tracking routes require authentication

## Day 5 - RabbitMQ Messaging Integration

- RabbitMQ connection configured
- RabbitMQ channel management service created
- Queue publishing service created
- Clock worker service created
- Clock-in queue implemented
- Clock-out queue implemented
- API server now publishes clock requests to RabbitMQ
- Worker consumes clock requests and updates PostgreSQL
- Clock-in and clock-out workflow migrated to message queues
- RabbitMQ dashboard configured for queue monitoring

### RabbitMQ Integration Features

- Decoupled API and database operations
- Asynchronous processing for clock events
- Persistent queue messages
- Worker-based database updates
- Scalable architecture for future services
- Foundation created for reporting and notification queues

### Current Message Flow

```text
Employee Request
       |
       v
API Server
       |
       v
RabbitMQ Queue
       |
       v
Worker Service
       |
       v
PostgreSQL Database
```

## Day 6 - React Native Mobile App UI

- React Native navigation installed
- Secure token storage configured with Expo SecureStore
- Axios API helper created
- Authentication context created
- Login screen implemented
- Employee dashboard screen implemented
- Clock in/out screen implemented
- Time history screen implemented
- Logout functionality implemented
- Mobile app connected to backend API

### Mobile App Features

- Employee login
- Secure JWT token storage
- Dashboard navigation
- Clock in / clock out functionality
- Current shift status display
- Time history viewing
- Logout functionality

### Mobile App Architecture

```text
React Native App
        |
        v
Auth Context
        |
        v
Axios API Service
        |
        v
Backend API
        |
        v
RabbitMQ
        |
        v
PostgreSQL
```

---

# Features

## Employee Features

- Secure login authentication
- Clock in / clock out
- View personal time history
- View current shift status
- Mobile-friendly experience
- Mobile application access
- Secure session storage
- Real-time shift status

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
│   ├── src/
│   │   ├── api/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   └── components/
│   └── App.js
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

## Install Dependencies

### Mobile App

```bash
cd mobile-app
npm install
```

### Web Dashboard

```bash
cd ../web-dashboard
npm install
```

### Backend

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

## RabbitMQ Worker

```bash
cd backend
npm run worker:clock
```

## Web Dashboard

```bash
cd web-dashboard
npm run dev
```

Runs on:

```text
http://localhost:3000
```

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

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Time Tracking

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

### Admin

```http
GET /api/admin/employees
```

---

# RabbitMQ Queues

## Current Queues

- clock_in_queue
- clock_out_queue

## Planned Queues

- auth_queue
- timesheet_queue
- admin_report_queue
- audit_log_queue
- notification_queue

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
- Message queue isolation
- Worker-based database processing
- Decoupled API/database architecture

## Planned

- Audit logging
- Session expiration table integration
- Refresh tokens
- Rate limiting
- Secure API validation
- Multi-factor authentication
- Account lockout protection

---

# Frontend Progress

## Mobile App

### Completed Features

#### Day 6

- Login screen created
- Dashboard screen created
- Clock screen created
- Time history screen created
- Navigation stack configured
- Auth context connected
- Secure token storage added
- API helper configured
- Backend integration completed

### Mobile Screens

- Login Screen
- Dashboard Screen
- Clock In / Clock Out Screen
- Time History Screen

### Mobile Technologies

- React Native
- Expo
- React Navigation
- Axios
- Expo SecureStore

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

### Day 4

- Clock-in endpoint implemented
- Clock-out endpoint implemented
- Time tracking controller created
- Time routes created
- Shift status endpoint implemented
- Employee time history endpoint implemented
- Double clock-in prevention implemented
- Automatic worked time calculations added
- JWT protection added to time tracking routes

### Day 5

- RabbitMQ connection service implemented
- Queue publishing service created
- Clock worker service implemented
- Clock-in queue integrated
- Clock-out queue integrated
- API server publishing messages to RabbitMQ
- Worker consuming queue messages
- PostgreSQL updates performed by worker
- Queue monitoring configured
- Message-driven architecture established

### Day 6

- React Native mobile application initialized
- Navigation system implemented
- Authentication context implemented
- Secure token storage implemented
- Login screen connected to backend
- Dashboard screen created
- Clock tracking screen created
- Time history screen created
- Mobile application connected to API

## Working Endpoints

```http
GET  /api/health

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET  /api/admin/employees

POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
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

- Audit logs
- CSV exports
- Manager approval workflow
- GPS clock-in verification
- QR code clock-in
- Overtime calculations
- Shift scheduling
- Push notifications

---

# Future Improvements

- Payroll integration
- Facial recognition clock-in
- Push notifications
- Multi-company support
- Real-time dashboard updates
- Analytics and charts
- Offline clock-in support
- Biometric authentication
- Dark mode support
- GPS location verification

---

# Author

**Matthew J. Nicol**

GitHub: https://github.com/Mjn92

LinkedIn: https://www.linkedin.com/in/matthew-nicol-56b089b0/
