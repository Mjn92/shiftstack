# ShiftStack

> Workforce management platform built to demonstrate production-ready full-stack software engineering.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/Database-Supabase-blue)
![RabbitMQ](https://img.shields.io/badge/Messaging-RabbitMQ-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

ShiftStack is a full-stack workforce management application for employee time tracking, user administration, reporting, and operational auditing.

The project combines a React Native mobile app, Next.js web dashboard, Express.js REST API, RabbitMQ background processing, and PostgreSQL hosted on Supabase.

It was built as a portfolio project to demonstrate real-world application architecture, secure authentication, role-based authorization, asynchronous messaging, cloud deployment, and maintainable full-stack development practices.

---

# Highlights

- Full-stack mobile and web application
- Secure JWT access and refresh token authentication
- Role-based access for employees, managers, and administrators
- Employee clock-in and clock-out workflow
- RabbitMQ asynchronous background processing
- Employee account administration
- Weekly reporting and CSV exports
- Audit logging
- Rate limiting and security middleware
- Dockerized local development
- Cloud deployment across Vercel, Render, Supabase, and CloudAMQP

---

# Architecture

```text
React Native Mobile App            Next.js Web Dashboard
          │                                │
          └───────────────┬────────────────┘
                          │
                     HTTPS REST API
                          │
                   Express.js Backend
                          │
             ┌────────────┴────────────┐
             │                         │
         RabbitMQ                  PostgreSQL
       Message Broker               Supabase
             │                         │
             ▼                         │
      Background Workers ──────────────┘
```

## Request Flow

```text
Client
  │
  ▼
Express API
  │
  ├── Authentication / Authorization
  ├── Validation
  ├── Rate Limiting
  │
  ▼
RabbitMQ
  │
  ▼
Worker Service
  │
  ▼
PostgreSQL
```

RabbitMQ is used for background clock-event processing, keeping the API layer separated from worker-side database operations.

---

# Features

## Employee

- Secure login
- JWT authentication
- Refresh token support
- Clock in
- Clock out
- Live shift status
- Personal time history
- React Native mobile interface

## Manager

- View employee records
- View employee time entries
- Weekly reporting
- CSV report export
- Employee account management
- Activate and deactivate employee accounts
- Edit employee information

## Administrator

- Full employee management
- Manager and administrator account management
- Create user accounts
- Edit user accounts
- Activate and deactivate accounts
- Role-based account administration
- Audit log access
- Reporting
- Administrative dashboard

---

# Tech Stack

## Mobile

- React Native
- Expo
- Axios
- Expo SecureStore

## Web

- Next.js 16
- React
- Axios

## Backend

- Node.js
- Express.js
- PostgreSQL
- RabbitMQ
- `pg`
- `amqplib`

## Authentication & Security

- JSON Web Tokens
- Refresh tokens
- bcrypt
- Express Validator
- Helmet
- Express Rate Limit
- Express Slow Down
- Role-based authorization
- Audit logging

## Infrastructure

- Docker
- Docker Compose
- Vercel
- Render
- Supabase PostgreSQL
- CloudAMQP
- GitHub

---

# Security

ShiftStack includes multiple application-level security controls.

## Authentication

- Password hashing with bcrypt
- JWT access tokens
- JWT refresh tokens
- Refresh token persistence
- Protected API routes
- Token expiration
- Logout and token invalidation workflow

## Authorization

Three application roles are supported:

```text
Employee
Manager
Administrator
```

Access to protected functionality is enforced on the backend rather than relying only on frontend visibility.

## API Protection

- Helmet HTTP security headers
- Request rate limiting
- Request slowdown protection
- Request validation with Express Validator
- CORS configuration
- Environment-based secret configuration

## Auditing

Important events can be written to the audit log, including authentication and time-tracking activity.

---

# Current Functionality

## Authentication

- Registration
- Login
- Logout
- Access tokens
- Refresh tokens
- Current-user endpoint
- Protected routes
- Role-based authorization
- Login protection

## Time Tracking

- Clock in
- Clock out
- Current clock status
- Personal time-entry history
- Worked-time calculation
- Prevention of duplicate clock-ins
- RabbitMQ-based clock event processing

## Employee Management

- List employees
- View employee information
- Create employee accounts
- Edit accounts
- Activate accounts
- Deactivate accounts
- Role-based management permissions

## Reporting

- Weekly reports
- Employee filtering
- Date filtering
- Total shift calculation
- Total hours calculation
- CSV export

## Administration

- Administrative dashboard
- Employee management
- Time-entry review
- Audit logs
- Reporting
- Role management

## Infrastructure

- RabbitMQ background worker
- Local Docker environment
- Hosted PostgreSQL with Supabase
- Backend deployment with Render
- Web deployment with Vercel
- Hosted RabbitMQ with CloudAMQP

---

# Role Model

| Capability                 | Employee | Manager | Administrator |
| -------------------------- | :------: | :-----: | :-----------: |
| Clock in / out             |   Yes    |   Yes   |      Yes      |
| View own time history      |   Yes    |   Yes   |      Yes      |
| View employee records      |    No    |   Yes   |      Yes      |
| View employee time entries |    No    |   Yes   |      Yes      |
| Create employees           |    No    |   Yes   |      Yes      |
| Edit employees             |    No    |   Yes   |      Yes      |
| Manage managers            |    No    |   No    |      Yes      |
| Manage administrators      |    No    |   No    |      Yes      |
| View weekly reports        |    No    |   Yes   |      Yes      |
| Export reports             |    No    |   Yes   |      Yes      |
| View audit logs            |    No    |   No    |      Yes      |

---

# Project Structure

```text
shiftstack/
│
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── workers/
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

# REST API

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

## Time Tracking

```http
POST /api/time/clock-in
POST /api/time/clock-out
GET  /api/time/status
GET  /api/time/my-entries
```

## Employee Management

```http
GET    /api/admin/employees
GET    /api/admin/employees/:id
POST   /api/admin/employees
PUT    /api/admin/employees/:id
PATCH  /api/admin/employees/:id/activate
PATCH  /api/admin/employees/:id/deactivate
```

## Reporting

```http
GET /api/reports/weekly
GET /api/reports/weekly/export
```

## Audit Logs

```http
GET /api/admin/audit-logs
```

---

# Local Development

## Requirements

- Node.js
- npm
- Docker Desktop
- Git

## Clone

```bash
git clone https://github.com/Mjn92/shiftstack.git
cd shiftstack
```

## Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Web Dashboard

```bash
cd ../web-dashboard
npm install
```

### Mobile App

```bash
cd ../mobile-app
npm install
```

---

# Environment Variables

Create the backend `.env` file with values similar to:

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

RABBITMQ_URL=

NODE_ENV=development
```

Do not commit production secrets to the repository.

---

# Start Local Infrastructure

From the repository root:

```bash
docker compose up -d
```

This starts the local development services defined in Docker Compose.

---

# Run the Backend

```bash
cd backend
npm run dev
```

Run the RabbitMQ clock worker separately:

```bash
npm run worker:clock
```

---

# Run the Web Dashboard

```bash
cd web-dashboard
npm run dev
```

The development dashboard is available at:

```text
http://localhost:3000
```

---

# Run the Mobile App

```bash
cd mobile-app
npm start
```

Use Expo Go or an appropriate Expo development build to launch the app.

---

# Deployment

| Component      | Platform            |
| -------------- | ------------------- |
| Web Dashboard  | Vercel              |
| Backend API    | Render              |
| Database       | Supabase PostgreSQL |
| Message Broker | CloudAMQP           |
| Mobile         | Expo                |

Production configuration is stored through deployment-platform environment variables rather than committed `.env` files.

---

# Development Roadmap

## Completed

- Project architecture
- Express backend
- PostgreSQL integration
- JWT authentication
- Refresh token authentication
- Role-based authorization
- Employee time tracking
- RabbitMQ worker processing
- Employee management
- Audit logging
- Weekly reports
- CSV export
- Security middleware
- React Native mobile workflow
- Administrative web dashboard
- Docker development environment
- Cloud deployment

## In Progress

- Employee-focused web dashboard
- Employee profile improvements
- Manager permission refinement
- Password reset workflow

## Planned

- Shift scheduling
- PTO requests
- Department management
- GPS clock verification
- QR-code clock in
- Push notifications
- Payroll integration
- Analytics dashboard
- Multi-company support
- Automated operational maintenance

---

# Portfolio Goals

ShiftStack is designed to demonstrate experience with:

- Full-stack JavaScript development
- React and React Native development
- REST API design
- Authentication architecture
- Role-based authorization
- Relational database design
- RabbitMQ messaging
- Background workers
- API security
- Audit logging
- Reporting systems
- Docker
- Cloud deployment
- Production troubleshooting

---

# Future Architecture Goals

Potential future improvements include:

```text
Load Balancer
     │
     ▼
Multiple API Instances
     │
     ▼
RabbitMQ Cluster
     │
     ▼
Worker Pool
     │
     ▼
PostgreSQL
```

Other planned improvements include:

- Centralized application monitoring
- CI/CD validation
- Automated tests
- Health monitoring
- Scheduled maintenance tasks
- Improved secret rotation processes

---

# Author

**Matthew J. Nicol**

GitHub:
https://github.com/Mjn92

LinkedIn:
https://www.linkedin.com/in/matthew-nicol-56b089b0/
