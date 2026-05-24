# University Lab Slot Booking & Equipment Reservation System

A full-stack university lab reservation platform. Students reserve lab slots and equipment; lab assistants manage reservation status; admins manage labs, slots, and inventory.

**Stack:** React (Vite) + TailwindCSS · Node.js + Express · SQLite (built-in `node:sqlite`, zero native deps) · JWT auth

---

## Requirements
- **Node.js 22.5+ or 24+** (uses built-in `node:sqlite`, no C++ build tools needed)
- npm 10+

## 1. Quick start

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run seed       # creates SQLite DB at backend/data/app.db + seed users/labs
npm run dev        # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Open http://localhost:5173.

### Demo credentials

| Role          | Email                  | Password   |
|---------------|------------------------|------------|
| Admin         | admin@uni.edu          | admin123   |
| Lab Assistant | assistant@uni.edu      | assist123  |
| Student       | student@uni.edu        | student123 |

---

## 2. Project structure

```
labres/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express bootstrap
│   │   ├── db/
│   │   │   ├── connection.js        # node:sqlite connection (pure Node, no compile)
│   │   │   ├── schema.sql           # tables + indexes
│   │   │   └── seed.js              # demo data
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT + role guards
│   │   │   └── error.js             # central error handler
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── labs.js
│   │   │   ├── equipment.js
│   │   │   ├── slots.js
│   │   │   ├── reservations.js
│   │   │   └── dashboard.js
│   │   └── utils/validate.js        # zod schemas
│   ├── data/                        # SQLite file lives here (gitignored)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx, App.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/api.js
│   │   ├── components/              # Navbar, LabCard, Table, Pagination, ...
│   │   └── pages/                   # Login, Labs, Reserve, History, Assistant, Admin, Analytics
│   ├── index.html, vite.config.js, tailwind.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 3. Environment variables

`backend/.env`

```
PORT=4000
JWT_SECRET=9b594440e792c0d0a37029deddc32e2cb1bf1210ebdb1cf9e5bee5884d6716978d98b16bef31dd76f219158112288c428ae68532a16c2226e4188a90ddb94a40
DB_PATH=./data/app.db
CORS_ORIGIN=http://localhost:5173
```

`frontend/.env` (optional, defaults to `/api` proxy)

```
VITE_API_URL=http://localhost:4000/api
```

---

## 4. API summary

All non-auth endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint                              | Role            | Purpose                           |
|--------|---------------------------------------|-----------------|-----------------------------------|
| POST   | /api/auth/register                    | public          | Create user (default: student)    |
| POST   | /api/auth/login                       | public          | Login, returns JWT                |
| GET    | /api/auth/me                          | any             | Current user                      |
| POST   | /api/labs                             | admin           | Create laboratory                 |
| GET    | /api/labs                             | any             | List labs (filterable)            |
| GET    | /api/labs/:id                         | any             | Lab detail                        |
| GET    | /api/labs/availability                | any             | Available slots by date/subject   |
| POST   | /api/equipment                        | admin           | Add equipment                     |
| GET    | /api/equipment                        | any             | List equipment (filter by lab/cat)|
| POST   | /api/equipment/allocate               | assistant/admin | Allocate equipment to reservation |
| POST   | /api/slots                            | admin           | Create lab slot                   |
| GET    | /api/slots                            | any             | List slots (filterable)           |
| POST   | /api/reservations                     | student         | Create reservation                |
| GET    | /api/reservations                     | any             | List (own for student, all else)  |
| GET    | /api/reservations/:id                 | any             | Detail with logs                  |
| PUT    | /api/reservations/:id/status          | assistant/admin | Update status                     |
| GET    | /api/dashboard/labs                   | assistant/admin | Lab metrics + utilization         |

---

## 5. Database

SQLite via Node.js built-in `node:sqlite` module (requires Node 22.5+ or 24+, no native compilation). Schema in `backend/src/db/schema.sql`:

- `users` (role: student | assistant | admin)
- `laboratories`
- `lab_equipment`
- `lab_slots`
- `reservations`
- `equipment_allocations`
- `reservation_status_logs`

Overlap prevention is enforced both via unique partial indexes and by transactional checks in `POST /api/reservations` and `POST /api/equipment/allocate`.

Run `npm run seed` (idempotent — drops and recreates).

---

## 6. Features

- Role-based JWT auth, protected routes on frontend & backend.
- Lab/equipment search and filtering by date, subject, equipment type.
- Slot reservation with project details, required equipment, and overlap prevention.
- Status workflow: Pending → Approved → Active → Completed (or Cancelled), with audit log.
- Assistant dashboard: active reservations, lab occupancy, equipment utilization charts.
- Lab analytics dashboard with timeline view per lab.
- Reservation history with pagination.
- Reusable React components (`LabCard`, `DataTable`, `Pagination`, `StatusBadge`).
- Responsive Tailwind UI, loading / empty / error states throughout.

---

## 7. Production build

```bash
cd frontend && npm run build         # outputs to frontend/dist
cd ../backend && NODE_ENV=production npm start
```

The backend can serve the built frontend statically if `frontend/dist` exists (see `backend/src/index.js`).

### Docker

```bash
docker compose up --build
```

Exposes the app on http://localhost:4000.

---

## 8. License

MIT
