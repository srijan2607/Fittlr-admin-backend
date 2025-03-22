# Fittlr Admin Backend

## Introduction

Fittlr Admin Backend is the administrative panel for the Fittlr application. It provides a backend service for managing gyms, machines, tickets, and other administrative tasks. This backend is built using Node.js, Express, and Prisma ORM.

## Folder Structure

```
Fittlr-admin-backend/
├── Controllers/
│   ├── Admin/
│   │   └── admin.js
│   ├── auth/
│   │   ├── login.js
│   │   └── logout.js
│   ├── Dasboard/
│   │   └── dashboard.js
│   ├── Gym/
│   │   └── gym.js
│   ├── Machine/
│   │   └── machine.js
│   └── tickets/
│       └── tickets.js
├── db/
│   └── connect.js
├── errors/
│   ├── bad-request.js
│   ├── custom-api.js
│   ├── index.js
│   ├── not-found.js
│   └── unauthenticated.js
├── middleware/
│   ├── authentication.js
│   ├── error-handler.js
│   ├── logger.js
│   ├── not-found.js
│   └── upload.js
├── prisma/
│   ├── migrations/
│   │   ├── 20250320053553_init/
│   │   │   └── migration.sql
│   │   ├── 20250321183015_init_models/
│   │   │   └── migration.sql
│   │   ├── 20250321190437_init_models/
│   │   │   └── migration.sql
│   │   ├── 20250321192113_init_models/
│   │   │   └── migration.sql
│   │   ├── 20250322064642_init_models/
│   │   │   └── migration.sql
│   │   ├── 20250322095847_add_machine_status_tickets_update/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── routers/
│   ├── admin.js
│   ├── auth.js
│   ├── dashbord.js
│   ├── gym.js
│   ├── machine.js
│   └── tickets.js
├── services/
│   ├── cache.js
│   ├── cachePreloader.js
│   ├── cloudflare.js
│   ├── jwt_create.js
│   ├── password_auth.js
├── .gitignore
├── app.js
├── package.json
└── README.md
```

## API Documentation

### Authentication

- **POST /api/v1/admin/auth/login**
  - Description: Admin login
  - Request Body: `{ "email": "admin@example.com", "password": "password" }`
  - Response: `{ "message": "Admin logged in successfully", "token": "jwt_token", "admin": { ... } }`

- **POST /api/v1/admin/auth/logout**
  - Description: Admin logout
  - Response: `{ "message": "Logout successful" }`

### Admin Management

- **POST /api/v1/admin/admin/register**
  - Description: Register a new admin
  - Request Body: `{ "name": "Admin Name", "email": "admin@example.com", "password": "password" }`
  - Response: `{ "message": "Admin registered successfully", "token": "jwt_token", "newadmin": { ... } }`

- **GET /api/v1/admin/admin/all**
  - Description: Get all admins
  - Response: `{ "admin": [ ... ], "count": number }`

- **PATCH /api/v1/admin/admin/update/:id**
  - Description: Update an admin
  - Request Body: `{ "name": "New Name", "email": "newemail@example.com", "password": "newpassword" }`
  - Response: `{ "message": "Admin updated successfully", "updated_admin": { ... } }`

- **DELETE /api/v1/admin/admin/delete/:id**
  - Description: Delete an admin
  - Response: `{ "message": "Admin deleted successfully", "deleted_admin": { ... } }`

### Gym Management

- **POST /api/v1/admin/gym/create**
  - Description: Create a new gym
  - Request Body: `{ "name": "Gym Name", "location": "Location", "MaxCapacity": 100, "openingHours": [ ... ], "userId": "user_id" }`
  - Response: `{ "success": true, "message": "Gym created successfully", "data": { ... } }`

- **GET /api/v1/admin/gym/all**
  - Description: Get all gyms
  - Response: `{ "success": true, "data": [ ... ], "pagination": { ... } }`

- **GET /api/v1/admin/gym/single**
  - Description: Get a single gym by ID
  - Request Body: `{ "id": gym_id }`
  - Response: `{ "success": true, "data": { ... } }`

- **PATCH /api/v1/admin/gym/update**
  - Description: Update a gym
  - Request Body: `{ "id": gym_id, "name": "New Name", "location": "New Location", "MaxCapacity": 200, "openingHours": [ ... ], "userId": "new_user_id" }`
  - Response: `{ "success": true, "message": "Gym updated successfully", "data": { ... } }`

- **DELETE /api/v1/admin/gym/delete**
  - Description: Delete a gym
  - Request Body: `{ "id": gym_id }`
  - Response: `{ "success": true, "message": "Gym and related data deleted successfully" }`

- **PATCH /api/v1/admin/gym/update-users**
  - Description: Update current users count
  - Request Body: `{ "id": gym_id, "count": 50 }`
  - Response: `{ "success": true, "message": "Current users count updated successfully", "data": { ... } }`

### Machine Management

- **POST /api/v1/admin/machines/create**
  - Description: Create a new machine
  - Request Body: `{ "name": "Machine Name", "description": "Description", "imageUrl": "image_url", "No_Of_Uses": 0, "gymId": gym_id, "status": "active" }`
  - Response: `{ "success": true, "message": "Machine created successfully", "data": { ... } }`

- **GET /api/v1/admin/machines/all**
  - Description: Get all machines
  - Response: `{ "success": true, "data": [ ... ], "pagination": { ... } }`

- **GET /api/v1/admin/machines/:id**
  - Description: Get a single machine by ID
  - Response: `{ "success": true, "data": { ... } }`

- **PUT /api/v1/admin/machines/:id**
  - Description: Update a machine
  - Request Body: `{ "name": "New Name", "description": "New Description", "imageUrl": "new_image_url", "No_Of_Uses": 10, "needService": false, "status": "inactive", "gymId": new_gym_id }`
  - Response: `{ "success": true, "message": "Machine updated successfully", "data": { ... } }`

- **DELETE /api/v1/admin/machines/:id**
  - Description: Delete a machine
  - Response: `{ "success": true, "message": "Machine and related data deleted successfully" }`

- **PUT /api/v1/admin/machines/status/:id**
  - Description: Update machine status
  - Request Body: `{ "status": "maintenance" }`
  - Response: `{ "success": true, "message": "Machine status updated successfully", "data": { ... } }`

- **PUT /api/v1/admin/machines/service/:id**
  - Description: Toggle service needs flag
  - Request Body: `{ "needService": true }`
  - Response: `{ "success": true, "message": "Machine service needs updated successfully", "data": { ... } }`

- **PUT /api/v1/admin/machines/increment/:id**
  - Description: Increment machine uses
  - Request Body: `{ "increment": 1 }`
  - Response: `{ "success": true, "message": "Machine uses incremented successfully", "data": { ... } }`

### Ticket Management

- **POST /api/v1/admin/tickets/create**
  - Description: Create a new ticket
  - Request Body: `{ "userId": "user_id", "title": "Ticket Title", "description": "Description", "machineId": machine_id, "ticketType": "service" }`
  - Response: `{ "success": true, "ticket": { ... } }`

- **GET /api/v1/admin/tickets/user/:userId**
  - Description: Get tickets for a specific user
  - Response: `{ "success": true, "count": number, "tickets": [ ... ] }`

- **GET /api/v1/admin/tickets/service**
  - Description: Get all service tickets
  - Response: `{ "success": true, "count": number, "tickets": [ ... ] }`

- **PUT /api/v1/admin/tickets/:ticketId**
  - Description: Update a ticket
  - Request Body: `{ "title": "New Title", "description": "New Description", "status": "closed" }`
  - Response: `{ "success": true, "ticket": { ... } }`

- **DELETE /api/v1/admin/tickets/:ticketId**
  - Description: Delete a ticket
  - Response: `{ "success": true, "message": "Ticket deleted successfully" }`

### Dashboard

- **GET /api/v1/admin/dashboard/stats**
  - Description: Get all dashboard statistics
  - Response: `{ "users": { ... }, "equipment": { ... }, "tickets": { ... }, "recentTickets": [ ... ] }`

- **GET /api/v1/admin/dashboard/user**
  - Description: Get user statistics
  - Response: `{ "total": number, "members": number, "admins": number }`

- **GET /api/v1/admin/dashboard/equipment**
  - Description: Get equipment statistics
  - Response: `{ "total": number, "working": number, "maintenance": number }`

- **GET /api/v1/admin/dashboard/ticket**
  - Description: Get ticket statistics
  - Response: `{ "total": number, "open": number, "closed": number }`

- **GET /api/v1/admin/dashboard/tickets/details**
  - Description: Get detailed ticket information
  - Response: `{ "tickets": [ ... ], "pagination": { ... } }`

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL (v12 or higher)
- Prisma CLI

## Usage Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/srijan2607/Fittlr-admin-backend.git
   cd Fittlr-admin-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:
   ```
   DATABASE_URL=your_postgresql_database_url
   JWT_SECRET=your_jwt_secret
   PORT=your_port_number
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the server:
   ```bash
   npm start
   ```

6. Access the API at `http://localhost:your_port_number/api/v1/admin`

