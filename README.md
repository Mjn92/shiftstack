# ShiftStack

A full-stack employee time tracking platform built with React Native, Node.js, RabbitMQ, PostgreSQL, and Docker.

ShiftStack was developed as a portfolio project to demonstrate modern full-stack software engineering practices, including secure authentication, mobile development, asynchronous message processing, API design, database architecture, and scalable backend systems.

---

# Project Summary

ShiftStack allows employees to securely clock in and clock out using a mobile application while managers and administrators monitor time records through a centralized system.

The platform demonstrates:

- React Native mobile application development
- REST API development using Express.js
- JWT authentication and authorization
- RabbitMQ message queue architecture
- PostgreSQL database design
- Dockerized development environments
- Secure token storage using Expo SecureStore
- Role-based access control
- Asynchronous backend processing

---

# Key Highlights

- Full-stack employee time tracking application
- React Native mobile application
- JWT authentication and protected API routes
- RabbitMQ message-driven architecture
- PostgreSQL relational database
- Dockerized infrastructure
- Secure mobile token storage
- Role-based authorization system
- Real-time clock-in and clock-out workflow

---

# Skills Demonstrated

### Frontend

- React Native
- Expo
- React Navigation
- Axios
- Context API

### Backend

- Node.js
- Express.js
- REST APIs
- Authentication Systems
- Middleware Design

### Database

- PostgreSQL
- Relational Database Design
- SQL Queries
- Data Validation

### Architecture

- RabbitMQ
- Message Queues
- Worker Services
- Asynchronous Processing
- Decoupled System Design

### DevOps

- Docker
- Docker Compose
- Git
- GitHub
- Postman

---

# System Architecture

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

# RabbitMQ Message Queue Architecture

One of the primary goals of ShiftStack is to demonstrate scalable backend architecture.

Rather than allowing API requests to directly update the database, requests are published to RabbitMQ queues and processed asynchronously by worker services.

Benefits include:

- Separation of concerns
- Improved scalability
- Reduced API workload
- Better fault tolerance
- Easier future expansion
- Support for background processing

Current workflow:

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

---

# Features

## Employee Features

- Secure authentication
- Clock in / clock out
- View current shift status
- View personal time history
- Mobile application access
- Secure JWT session management

## Manager Features

- View employee records
- Filter employee time entries
- Review weekly reports
- Approve timesheets

## Administrator Features

- Employee management
- Role-based access control
- Audit log monitoring
- System administration

---

# Screenshots

## Mobile Login Screen

(Add screenshot)

## Employee Dashboard

(Add screenshot)

## Clock In / Clock Out Screen

(Add screenshot)

## Time History Screen

(Add screenshot)

## RabbitMQ Dashboard

(Add screenshot)

---

# Tech Stack

## Frontend

- React Native
- Expo
- React
- Next.js

## Backend

- Node.js
- Express.js
- RabbitMQ
- PostgreSQL

## Infrastructure

- Docker
- Docker Compose

## Development Tools

- Git
- GitHub
- Postman
- pgAdmin

---

# Development Progress

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

### Day 7

- Mobile API networking issues resolved
- Backend connection troubleshooting completed
- Axios API service improved
- Environment-based API configuration added
- Android emulator networking configured
- Physical device backend connectivity tested
- Backend timeout handling improved
- Authentication request debugging added
- Login error handling improved
- Backend health testing endpoints added
- API request logging implemented
- Cross-device mobile testing completed
- Mobile authentication flow stabilized
- Session persistence improvements implemented

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

# API Documentation

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

# Future Enhancements

- Audit logs
- CSV exports
- GPS clock-in verification
- QR code clock-in
- Push notifications
- Payroll integration
- Analytics dashboards
- Multi-company support

---

# Author

**Matthew J. Nicol**

GitHub: https://github.com/Mjn92

LinkedIn: https://www.linkedin.com/in/matthew-nicol-56b089b0/
