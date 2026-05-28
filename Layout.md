# ShiftStack Development Roadmap

## Day-by-Day Deliverables: ShiftStack

---

## Day 1 — Project Setup

### Deliverables

- GitHub repo created
- README started
- Figma wireframes
- App architecture diagram
- Database schema draft
- Final tech stack chosen

---

## Day 2 — Backend Foundation

### Deliverables

- Backend server running
- Database connected
- Employee table created
- Basic API routes created
- Postman collection started

---

## Day 3 — Authentication

### Deliverables

- Login system working
- Password hashing added
- JWT/session token created
- Employee roles added: employee, manager, admin
- Protected routes working

---

## Day 4 — Clock In / Clock Out Logic

### Deliverables

- Clock-in endpoint
- Clock-out endpoint
- Time entries table
- Prevent double clock-in
- Prevent clock-out without clock-in
- Total hours calculation

---

## Day 5 — RabbitMQ Messaging

### Deliverables

- RabbitMQ installed/configured
- Producer sends clock requests
- Worker consumes messages
- Worker writes to database
- Reply/response system working

---

## Day 6 — React Native Mobile App

### Deliverables

- Mobile login screen
- Employee dashboard
- Clock in/out button
- Current shift status
- Recent time entries screen

---

## Day 7 — React Web Dashboard

### Deliverables

- Web login screen
- Admin dashboard layout
- Employee list page
- Time entries page
- Filter by employee/date

---

## Day 8 — Security + Audit Logs

### Deliverables

- Role-based access control
- Audit log table
- Login attempt protection
- Input validation
- Secure environment variables
- Error handling improved

---

## Day 9 — Reports

### Deliverables

- Weekly hours report
- Employee timesheet view
- CSV export
- Manager approval status
- Basic payroll-ready summary

---

## Day 10 — Deployment

### Deliverables

- Backend deployed
- Web dashboard deployed
- Database hosted
- RabbitMQ worker running
- Mobile app tested through Expo
- Deployment notes added to README

---

## Day 11 — Portfolio Polish

### Deliverables

- Screenshots added to README
- Demo video recorded
- Architecture diagram cleaned up
- Resume bullet points written
- GitHub repo organized
- Final bug fixes

---

## Day 12 — Advanced Feature

Choose one advanced feature to implement.

### Option A — GPS Verification

- Capture clock-in location
- Store latitude/longitude
- Show location in admin view

### Option B — QR Code Clock-In

- Generate workplace QR code
- Mobile app scans QR
- Clock-in only works with valid QR

### Option C — Manager Approval

- Manager approves/rejects weekly timesheets
- Add approval status
- Add audit trail

---

## Recommended Feature Order

1. Manager Approval
2. GPS Verification
3. QR Code Clock-In
