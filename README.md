# ShiftStack

A full-stack employee clock-in and clock-out system built with React Native, React, RabbitMQ, PostgreSQL, and Node.js.

ShiftStack is designed as a portfolio project to demonstrate:

- Full-stack application development
- Secure authentication and authorization
- Employee time tracking
- Message queue architecture
- PostgreSQL database design
- Dockerized development environments
- Mobile and web application integration

---

# Project Status

## Day 1 — Project Setup

- [x] Project architecture planned
- [x] GitHub repository initialized
- [x] React Native mobile app initialized
- [x] React web dashboard initialized
- [x] Backend structure planned
- [x] Docker environment configured
- [x] PostgreSQL planned
- [x] RabbitMQ planned
- [x] Database schema drafted
- [x] API routes planned

---

## Day 2 — Backend Foundation

- [x] Express backend server created
- [x] PostgreSQL database connected
- [x] Docker services configured and running
- [x] Initial database tables created
- [x] API route structure created
- [x] Health check endpoint created
- [x] Employee API endpoint created
- [x] PostgreSQL schema initialized
- [x] Environment variables configured
- [x] Postman testing setup completed

---

## Day 3 — Authentication System

- [x] Employee registration endpoint created
- [x] Employee login endpoint created
- [x] Password hashing with bcrypt implemented
- [x] JWT authentication implemented
- [x] Authentication middleware created
- [x] Protected routes implemented
- [x] Role-based access control implemented
- [x] Current user endpoint created
- [x] Admin routes protected
- [x] Token validation working
- [x] Authentication testing completed

---

## Day 4 — Clock In / Clock Out Logic

- [x] Clock-in endpoint created
- [x] Clock-out endpoint created
- [x] Current shift status endpoint created
- [x] Personal time history endpoint created
- [x] Double clock-in prevention implemented
- [x] Clock-out validation implemented
- [x] Total worked minutes calculation added
- [x] JWT protection added to time routes
- [x] Employee shift tracking implemented
- [x] Postman workflow testing completed

---

## Upcoming Development

### Day 5 — RabbitMQ Messaging

- [ ] RabbitMQ producer service
- [ ] RabbitMQ consumer service
- [ ] Queue-based clock-in processing
- [ ] Queue-based clock-out processing
- [ ] Database worker integration

### Day 6 — React Native Mobile App

- [ ] Login screen
- [ ] Dashboard screen
- [ ] Clock In / Clock Out screen
- [ ] Current shift status
- [ ] Time history screen

### Day 7 — React Web Dashboard

- [ ] Admin dashboard
- [ ] Employee management page
- [ ] Time entries page
- [ ] Filtering and reporting

### Day 8 — Security & Audit Logs

- [ ] Audit logging
- [ ] Rate limiting
- [ ] Validation improvements
- [ ] Error handling improvements

### Day 9 — Reports

- [ ] Weekly reports
- [ ] Employee timesheets
- [ ] CSV exports
- [ ] Manager approvals

### Day 10 — Deployment

- [ ] Backend deployment
- [ ] Web dashboard deployment
- [ ] Database hosting
- [ ] RabbitMQ deployment

### Day 11 — Portfolio Polish

- [ ] Screenshots
- [ ] Demo video
- [ ] Architecture diagrams
- [ ] Resume project description

### Day 12 — Advanced Features

- [ ] GPS clock-in verification
- [ ] QR code clock-in
- [ ] Manager approval workflow

---

# Features

## Employee Features

- Secure login
- Clock in
- Clock out
- View shift history
- View current shift status
- Mobile access

## Manager Features

- View employee records
- Weekly reports
- Filter time entries
- Approve timesheets

## Admin Features

- Manage employees
- Role-based access control
- View system activity
- Audit logging
- Manage reports

---

# Architecture

```text
React Native Mobile App
          |
          |
React Web Dashboard
          |
          v
Node.js / Express API
          |
          v
RabbitMQ Message Broker
          |
          v
Worker Services
          |
          v
PostgreSQL Database
```

---

# Tech Stack

## Frontend

- React Native
- Expo
- React
- Next.js
- Tailwind CSS

## Backend

- Node.js
- Express.js
- PostgreSQL
- RabbitMQ

## DevOps & Tools

- Docker
- Docker Compose
- GitHub
- Postman
- pgAdmin

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

# Docker Setup

Start services:

```bash
docker compose up -d
```

Services:

- PostgreSQL
- RabbitMQ
- pgAdmin

---

# Running The Project

## Backend

```bash
cd backend
npm run dev
```

Runs on:

```text
http://localhost:5000
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

Scan the QR code using Expo Go.

---

# Environment Variables

Create:

```text
backend/.env
```

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

# Database Design

## employees

Stores employee account information.

- id
- first_name
- last_name
- email
- password_hash
- role
- active
- created_at

## time_entries

Stores employee shift records.

- id
- employee_id
- clock_in
- clock_out
- total_minutes
- status
- note
- created_at

## sessions

Stores authentication sessions.

- id
- employee_id
- token
- expires_at
- created_at

## audit_logs

Stores important system actions.

- id
- employee_id
- action
- details
- created_at

---

# API Documentation

## Health

```http
GET /api/health
```

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Admin

```http
GET /api/admin/employees
```

## Time Tracking

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

---

# Security Features

## Current

- Password hashing (bcrypt)
- JWT authentication
- Protected routes
- Role-based authorization
- Token validation
- Environment variable configuration
- PostgreSQL database isolation

## Planned

- Audit logging
- Refresh tokens
- Rate limiting
- Input validation
- MFA support
- Account lockout protection

---

# Planned RabbitMQ Queues

- auth_queue
- clock_in_queue
- clock_out_queue
- timesheet_queue
- admin_report_queue
- audit_log_queue

---

# Future Enhancements

- GPS clock-in verification
- QR code clock-in
- Payroll integration
- Push notifications
- Real-time dashboards
- Analytics and charts
- Multi-company support

---

# Author

**Matthew J. Nicol**

GitHub: https://github.com/Mjn92

LinkedIn: https://www.linkedin.com/in/matthew-nicol-56b089b0/
