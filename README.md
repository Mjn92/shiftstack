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

(Keep your Day 1 – Day 12 progress section here)

---

# Installation

(Keep your existing installation section)

---

# API Documentation

(Keep your existing API routes section)

---

# Security Features

(Keep your existing security section)

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
