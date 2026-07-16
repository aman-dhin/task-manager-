# Taskrail — Task Management Web Application

A full-stack task management app built for the Full Stack Developer Round 1 assessment.

- **Frontend:** React (Vite) + React Router + Axios, plain CSS design system
- **Backend:** Node.js + Express
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing

---

## 1. Features

- User registration, login, and logout (JWT-based, stateless)
- Add, edit, delete tasks
- Mark tasks completed / pending (checkbox toggle)
- View pending vs. completed tasks (tab filter)
- Task fields: title, description, due date, priority (High/Medium/Low), status (Pending/Completed)
- Server-side validation: required fields, unique email, minimum 6-character password
- Search tasks by title/description
- Filter by priority and status
- Pagination
- Responsive, mobile-friendly UI with loading indicators, empty states, and toasts
- Docker support for one-command startup

---

## 2. Project structure

```
task-manager/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # Mongoose User schema
│   │   └── Task.js             # Mongoose Task schema
│   ├── routes/
│   │   ├── auth.js             # /register /login /logout /me
│   │   └── tasks.js            # /tasks CRUD
│   ├── server.js               # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Axios instance + JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/         # Navbar, TaskCard, TaskFormModal, etc.
│   │   ├── pages/               # Login, Register, Dashboard
│   │   ├── App.jsx
│   │   └── index.css           # Design system / global styles
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── docs/
│   └── SCHEMA.md                # Database schema documentation
├── docker-compose.yml
└── README.md
```

---

## 3. Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — one of:
  - A local MongoDB installation (`mongod` running on `localhost:27017`), **or**
  - A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (no local install needed), **or**
  - Docker (see [Docker section](#6-run-with-docker))

---

## 4. Local setup (without Docker)

### 4.1 Backend

```bash
cd backend
cp .env.example .env
# Edit .env if needed — set MONGO_URI to your Atlas connection string
# if you are not running MongoDB locally, and set a strong JWT_SECRET.
npm install
npm run dev        # starts on http://localhost:5000 with nodemon
# or: npm start     # plain node, no auto-reload
```

`.env` variables:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_manager
JWT_SECRET=replace-this-with-a-long-random-secret
```

If you're using Atlas, `MONGO_URI` looks like:
```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/task_manager?retryWrites=true&w=majority
```

You should see:
```
MongoDB connected: <host>/task_manager
Task Manager API listening on http://localhost:5000
```

### 4.2 Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
# VITE_API_URL should point at your running backend (default is fine locally)
npm install
npm run dev         # starts on http://localhost:5173
```

Open **http://localhost:5173**, register a new account, and start adding tasks.

### 4.3 Production build (frontend)

```bash
cd frontend
npm run build        # outputs to dist/
npm run preview       # serve the production build locally
```

---

## 5. Running both at once (optional convenience)

From the repo root, in two terminals:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

(Or install `concurrently` at the root and add a script if you prefer a single command — omitted here to keep dependencies minimal.)

---

## 6. Run with Docker

The included `docker-compose.yml` spins up MongoDB, the backend, and the frontend (served via nginx) together.

```bash
# From the repository root
docker compose up --build
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:5000/api**
- MongoDB: `mongodb://localhost:27017/task_manager` (data persisted in a named Docker volume)

Set a custom JWT secret before starting (recommended):

```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

To stop:

```bash
docker compose down          # keep data
docker compose down -v       # also remove the Mongo volume
```

---

## 7. REST API reference

Base URL: `http://localhost:5000/api`

All task endpoints require an `Authorization: Bearer <token>` header, obtained from `/register` or `/login`.

| Method | Endpoint         | Auth | Description                              |
|--------|------------------|------|--------------------------------------------|
| POST   | `/register`      | No   | Create a new account                        |
| POST   | `/login`         | No   | Log in, returns a JWT                       |
| POST   | `/logout`        | Yes  | Stateless logout (client discards token)     |
| GET    | `/me`            | Yes  | Get the current logged-in user               |
| GET    | `/tasks`         | Yes  | List tasks (supports filters below)          |
| POST   | `/tasks`         | Yes  | Create a task                                |
| PUT    | `/tasks/:id`     | Yes  | Update a task (partial updates supported)     |
| DELETE | `/tasks/:id`     | Yes  | Delete a task                                |

### `GET /tasks` query parameters

| Param      | Example            | Description                                  |
|------------|--------------------|-----------------------------------------------|
| `status`   | `Pending`           | Filter by `Pending` or `Completed`             |
| `priority` | `High`              | Filter by `High`, `Medium`, or `Low`           |
| `search`   | `report`            | Case-insensitive match on title/description     |
| `page`     | `1`                 | Page number (default `1`)                       |
| `limit`    | `10`                | Items per page (default `10`, max `100`)         |
| `sort`     | `dueDate`           | `dueDate` \| `priority` \| `createdAt` \| `title`|

### Example: register

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

### Example: create a task

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Finish report","priority":"High","dueDate":"2026-07-20"}'
```

### Validation rules

- `name`, `email`, `password` required on register
- `email` must be unique and a valid email format
- `password` must be at least 6 characters
- `title` required on task create; cannot be emptied on update
- `priority` must be one of `High` / `Medium` / `Low`
- `status` must be one of `Pending` / `Completed`
- `dueDate`, if provided, must be a valid ISO date

---

## 8. Database schema

See [`docs/SCHEMA.md`](docs/SCHEMA.md) for full collection definitions, indexes, and the entity relationship diagram.

---

## 9. Deployment guide

A simple, free-tier-friendly deployment path:

### 9.1 Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a database user and allow network access from anywhere (`0.0.0.0/0`) for simplicity, or restrict to your host's IP.
3. Copy the connection string — this becomes `MONGO_URI`.

### 9.2 Backend — Render / Railway
1. Push this repository to GitHub.
2. Create a new Web Service on [Render](https://render.com) (or [Railway](https://railway.app)) pointing at the `backend/` folder.
3. Build command: `npm install`. Start command: `npm start`.
4. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT` (Render sets `PORT` automatically).
5. Deploy — note the resulting URL, e.g. `https://taskrail-api.onrender.com`.

### 9.3 Frontend — Vercel / Netlify
1. Import the repository, set the project root to `frontend/`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set environment variable `VITE_API_URL` to your deployed backend, e.g. `https://taskrail-api.onrender.com/api`.
4. Deploy.

### 9.4 Docker-based deployment
Any host that runs Docker (a VPS, Render's Docker runtime, Railway, Fly.io, etc.) can run `docker compose up --build` directly using the provided `docker-compose.yml`, pointed at a managed MongoDB instance via `MONGO_URI` instead of the bundled `mongo` service if preferred.

---

## 10. Screenshots

Run the app locally (see Section 4) and add screenshots here, for example:

- `docs/screenshots/login.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/add-task-modal.png`
- `docs/screenshots/mobile-view.png`

---

## 11. Tech decisions & notes

- **JWT over sessions**: keeps the backend stateless and simple to deploy/scale; the token is stored in `localStorage` and attached via an Axios request interceptor, with a response interceptor that clears it and redirects to `/login` on a `401`.
- **Mongoose over the raw MongoDB driver**: schema validation (required fields, enums), timestamps, and cleaner query code.
- **Design system**: a small CSS custom-property token system (`frontend/src/index.css`) drives color, spacing, and type consistently across the app — no CSS framework dependency.
- **Search**: implemented as a case-insensitive regex match on `title`/`description` rather than `$text` search, so it works correctly without any special index setup or minimum-word-length quirks.
