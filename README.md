# ShiftStack

> Modern workforce management platform built to demonstrate
> enterprise-grade full-stack software engineering.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/Database-Supabase-blue)
![RabbitMQ](https://img.shields.io/badge/Messaging-RabbitMQ-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

ShiftStack is a modern workforce management platform built to demonstrate
production-ready full-stack software engineering. It includes a React Native
mobile application, a Next.js administrative dashboard, an Express.js API,
RabbitMQ background workers, and a PostgreSQL database hosted on Supabase.

The project showcases secure authentication, role-based authorization,
employee management, audit logging, asynchronous messaging, reporting,
Dockerized development, and cloud deployment.

---

# Features

## Employee

- Secure authentication
- Clock In / Clock Out
- Live shift status
- View personal time history
- JWT authentication
- Refresh token authentication
- Mobile application

---

## Manager

- Employee oversight
- View employee time entries
- Weekly reports
- CSV report exports
- Employee management
- Activate / Deactivate employees
- Edit employee profiles
- Department management

---

## Administrator

- Complete employee management
- Manager management
- Administrator management
- Create employees
- Edit employees
- Activate / Deactivate accounts
- Reset employee passwords (planned)
- Role management
- Audit logs
- System reports
- Dashboard statistics

---

# Architecture

```text
React Native App           Next.js Dashboard
        │                        │
        └──────────────┬─────────┘
                       │
                  HTTPS REST API
                       │
                Express.js Backend
                       │
          ┌────────────┴────────────┐
          │                         │
      RabbitMQ                 PostgreSQL
      Message Broker            (Supabase)
          │
          ▼
   Background Workers
```

---

# Tech Stack

## Frontend

- React Native
- Expo
- Next.js 16
- Axios

---

## Backend

- Node.js
- Express.js
- PostgreSQL
- RabbitMQ
- JWT Authentication
- bcrypt
- Express Validator
- Helmet
- Express Rate Limit
- Express Slow Down

---

## Cloud Services

- Vercel
- Render
- Supabase
- CloudAMQP

---

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# Security

ShiftStack follows security best practices including:

- JWT Access Tokens
- JWT Refresh Tokens
- Password hashing with bcrypt
- Helmet security headers
- Express Rate Limiting
- Express Slow Down
- Role-based authorization
- Protected API routes
- Environment variable management
- Audit logging
- Session management
- Refresh token storage
- Secure password validation

---

# Current Functionality

## Authentication

- User Registration
- Secure Login
- JWT Authentication
- Refresh Tokens
- Protected Routes
- Role-based Access Control

---

## Time Tracking

- Clock In
- Clock Out
- Live Shift Status
- Employee Time History
- Manager Time Review

---

## Employee Management

- Create Employees
- Edit Employees
- Activate Employees
- Deactivate Employees
- Search Employees
- Filter by Role
- Filter by Status
- Dashboard Statistics

---

## Reporting

- Weekly Reports
- CSV Export
- Employee Filtering
- Date Filtering

---

## Administration

- Audit Logs
- Dashboard
- Employee Dashboard
- User Management
- Role Management
- System Statistics

---

## Infrastructure

- RabbitMQ Background Workers
- Docker Development Environment
- Supabase PostgreSQL
- Render Backend Deployment
- Vercel Frontend Deployment
- CloudAMQP Integration

---

# Project Structure

```text
shiftstack/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── workers/
│   ├── services/
│   ├── config/
│   └── utils/
│
├── web-dashboard/
│
├── mobile-app/
│
├── docs/
│
├── docker-compose.yml
│
└── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/Mjn92/shiftstack.git

cd shiftstack
```

Install dependencies

```bash
cd backend
npm install

cd ../web-dashboard
npm install

cd ../mobile-app
npm install
```

Start Docker services

```bash
docker compose up -d
```

Run Backend

```bash
cd backend

npm run dev
```

Run Web Dashboard

```bash
cd web-dashboard

npm run dev
```

Run Mobile App

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

FRONTEND_URL=http://localhost:3000

NODE_ENV=development
```

---

# REST API

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

---

## Time Tracking

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

---

## Employee Management

```http
GET    /api/admin/employees
GET    /api/admin/employees/:id
POST   /api/admin/employees
PUT    /api/admin/employees/:id
PATCH  /api/admin/employees/:id/activate
PATCH  /api/admin/employees/:id/deactivate
```

---

## Reports

```http
GET /api/reports/weekly
GET /api/reports/weekly/export
```

---

## Audit Logs

```http
GET /api/admin/audit-logs
```

---

# Deployment

| Component | Service |
|------------|----------|
| Web Dashboard | Vercel |
| Backend API | Render |
| Database | Supabase PostgreSQL |
| RabbitMQ | CloudAMQP |
| Mobile | Expo |

---

# Development Roadmap

## Completed

- Secure Authentication
- JWT Refresh Tokens
- Employee Management
- Role-based Authorization
- RabbitMQ Workers
- Audit Logging
- Reports
- CSV Export
- Docker Environment
- Cloud Deployment
- User Dashboard
- Admin Dashboard

---

## In Progress

- Password Reset
- Employee Profiles
- Department Management
- Manager Permissions

---

## Planned

- Shift Scheduling
- PTO Requests
- GPS Clock Verification
- QR Code Clock In
- Push Notifications
- Payroll Integration
- Analytics Dashboard
- Multi-company Support

---

# Why ShiftStack?

ShiftStack demonstrates modern enterprise software development concepts including:

- Full-stack JavaScript development
- Mobile application development
- Enterprise REST APIs
- Secure authentication
- Role-based authorization
- RabbitMQ asynchronous messaging
- PostgreSQL database design
- Cloud deployment
- Docker containerization
- Production-ready architecture
- Scalable application design

---

# Author

**Matthew J. Nicol**

GitHub:
https://github.com/Mjn92

LinkedIn:
https://www.linkedin.com/in/matthew-nicol-56b089b0/
