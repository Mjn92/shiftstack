# ShiftStack

> Modern workforce management platform built to demonstrate
> enterprise-grade full-stack software engineering.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![RabbitMQ](https://img.shields.io/badge/Messaging-RabbitMQ-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

ShiftStack is a full-stack employee time tracking and workforce
management application featuring a React Native mobile app, Next.js
administrative dashboard, Express.js backend, RabbitMQ messaging, and
PostgreSQL. It demonstrates secure authentication, role-based access
control, asynchronous processing, reporting, audit logging, Dockerized
development, and cloud deployment.

---

# Features

## Employee

- Secure login
- Clock in / clock out
- Live shift status
- Time history
- JWT authentication
- Mobile experience

## Manager

- View employee time entries
- Weekly reports
- Date filtering
- CSV exports
- Employee oversight

## Administrator

- Employee management
- Manager/Admin management (planned)
- Audit logs
- Reports
- Role management
- System administration

---

# Architecture

```text
React Native App        Next.js Dashboard
        │                     │
        └────────────┬────────┘
                     │ HTTPS
              Express.js API
                     │
         ┌───────────┴────────────┐
         │                        │
     RabbitMQ                 PostgreSQL
         │
         ▼
   Background Workers
```

---

# Tech Stack

## Frontend

- React Native
- Expo
- Next.js
- Tailwind CSS
- Axios

## Backend

- Node.js
- Express.js
- RabbitMQ
- PostgreSQL
- JWT
- bcrypt

## DevOps

- Docker
- Docker Compose
- Render
- Vercel
- Supabase
- CloudAMQP

---

# Security

- JWT access & refresh tokens
- bcrypt password hashing
- Helmet security headers
- Express Rate Limit
- Express Slow Down
- Express Validator
- Role-based authorization
- Audit logging
- Environment variable management

---

# Current Functionality

- Authentication
- Clock In / Clock Out
- RabbitMQ worker processing
- Employee dashboard
- Admin dashboard
- Reports
- CSV export
- Audit logging
- Docker development
- Render deployment
- Vercel deployment
- Supabase integration

---

# Project Structure

```text
shiftstack/
├── backend/
├── mobile-app/
├── web-dashboard/
├── docs/
├── docker-compose.yml
└── README.md
```

---

# Installation

```bash
git clone https://github.com/Mjn92/shiftstack.git
cd shiftstack
```

Install dependencies:

```bash
cd backend && npm install
cd ../web-dashboard && npm install
cd ../mobile-app && npm install
```

Run Docker:

```bash
docker compose up -d
```

Run backend:

```bash
cd backend
npm run dev
```

Run dashboard:

```bash
cd web-dashboard
npm run dev
```

Run mobile:

```bash
cd mobile-app
npm start
```

---

# Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
RABBITMQ_URL=
NODE_ENV=development
```

---

# API

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

## Time

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

## Admin

```http
GET /api/admin/employees
GET /api/admin/audit-logs
```

## Reports

```http
GET /api/reports/weekly
GET /api/reports/weekly/export
```

---

# Deployment

Component Service

---

Frontend Vercel
Backend Render
Database Supabase PostgreSQL
Message Broker CloudAMQP
Mobile Expo

---

# Roadmap

- User management
- Employee editing
- Manager permissions
- Scheduling
- PTO requests
- GPS verification
- Push notifications
- Payroll integration
- Multi-company support
- Analytics dashboard

---

# Why This Project?

ShiftStack demonstrates:

- Enterprise architecture
- Secure authentication
- Mobile development
- REST APIs
- Asynchronous messaging
- SQL database design
- Cloud deployment
- Docker
- CI/CD readiness
- Scalable application design

---

# Author

**Matthew J. Nicol**

GitHub: https://github.com/Mjn92

LinkedIn: https://www.linkedin.com/in/matthew-nicol-56b089b0/
