# Heritage Campus Nav — Secured Smart Campus Navigation System

A full-stack wayfinding system for Heritage Polytechnic: an interactive schematic
campus map, shortest-path route planning between buildings, and a secured admin
console for maintaining the map data.

## Stack

- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose), JWT auth
- **Frontend:** HTML/CSS/vanilla JS (no build step), SVG-based interactive map
- **Security:** bcrypt password hashing, JWT with expiry, account lockout after
  repeated failed logins, helmet, CORS whitelist, rate limiting, NoSQL-injection
  sanitization, XSS sanitization, HTTP parameter pollution protection, centralized
  error handling with no stack traces in production.

## Project structure

```
heritage-campus-nav/
├── backend/
│   ├── server.js              # Express app entry point + security middleware
│   ├── config/db.js           # MongoDB Atlas connection
│   ├── models/                # User, Location, Edge (Mongoose schemas)
│   ├── middleware/             # JWT auth guard, role authorization, error handler
│   ├── controllers/            # Route handler logic
│   ├── routes/                 # Express routers + input validation
│   └── utils/
│       ├── dijkstra.js         # Shortest-path graph algorithm
│       └── seed.js             # Seeds an admin account + sample campus map
└── frontend/
    ├── index.html               # Interactive map + route planner
    ├── login.html / register.html
    ├── admin.html                # Manage locations & paths (admin only)
    ├── css/style.css
    └── js/
        ├── api.js                # Fetch wrapper for the backend API
        ├── map.js                 # SVG map rendering + route drawing
        ├── auth.js                # Login/register/session/logout
        └── admin.js               # Admin CRUD for locations & edges
```

## How the navigation works

Every location (building, hostel, gate, etc.) is a **node** with `x`/`y`
percentage coordinates on a schematic map (0–100). Every walkable connection
between two locations is an **edge** with a distance in meters. When a user
picks a start and destination, the backend runs **Dijkstra's algorithm**
(`backend/utils/dijkstra.js`) over the graph to find the shortest walking
path, then returns the stop-by-stop route, total distance, and an estimated
walk time. The frontend draws that path as an animated dashed line on the map
and lists turn-by-turn directions.

An `accessible=true` flag on the route request restricts pathfinding to edges
marked as wheelchair/mobility accessible — useful for users who need step-free
routes.

## Local setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB Atlas connection string (create a free cluster at
  mongodb.com/atlas if you don't have one; whitelist your IP or `0.0.0.0/0`
  for development).
- `JWT_SECRET` — any long random string.
- `FRONTEND_URL` — where your frontend will be served from, e.g.
  `http://127.0.0.1:5500` if using VS Code's Live Server extension.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the seeded admin account.

Seed the database with an admin account and a sample Heritage Polytechnic
campus layout (16 locations, 25 connecting paths):

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default. Check `GET /api/health`
to confirm it's up.

### 2. Frontend

The frontend is static — no build step. Easiest options:

- **VS Code:** install the "Live Server" extension, right-click
  `frontend/index.html` → "Open with Live Server".
- **Node:** `npx serve frontend` from the project root.

If your frontend runs on a different port than `http://localhost:5500` or
`http://127.0.0.1:5500`, update `FRONTEND_URL` in the backend `.env` to match
(comma-separate multiple origins), and update `window.CAMPUS_NAV_API_BASE` in
each HTML file's inline `<script>` tag if your backend isn't on
`http://localhost:5000`.

### 3. Try it out

1. Open `index.html` — the map loads automatically with the seeded campus.
2. Click two locations (or use the search box / From-To fields) to see the
   shortest route drawn on the map, with distance, walk time, and directions.
3. Register a student account, or log in with the seeded admin account, to
   access `admin.html` and add/edit/remove locations and paths.

## Deploying (Vercel/Render + MongoDB Atlas)

1. **Database:** Use your existing MongoDB Atlas cluster (or create one) and
   set `MONGO_URI` accordingly. Make sure your cluster's network access
   allows connections from your deployment platform (or `0.0.0.0/0`).
2. **Backend (Render):** Create a new Web Service pointing at `backend/`.
   - Build command: `npm install`
   - Start command: `npm start`
   - Add all `.env` variables in Render's Environment tab.
   - Run `npm run seed` once via Render's shell (or locally against the Atlas
     URI) to populate the sample campus data.
3. **Frontend (Vercel):** Deploy the `frontend/` folder as a static site.
   - After deploying the backend, update `window.CAMPUS_NAV_API_BASE` in each
     HTML file to your Render backend URL (e.g.
     `https://heritage-campus-nav-api.onrender.com/api`).
   - Update `FRONTEND_URL` in the backend's environment variables to your
     Vercel domain so CORS allows it.

## Security notes

- Passwords are hashed with bcrypt (12 salt rounds) and never returned by the API.
- JWTs expire (`JWT_EXPIRES_IN`, default 7 days) and are required for all
  write operations (creating/editing/deleting locations and paths).
- Only the `admin` role can create, edit, or delete locations/paths. Public
  registration always creates a `student` account — promote a user to
  `admin`/`staff` directly in the database if needed.
- Accounts lock for 15 minutes after 5 failed login attempts.
- All API input is validated (`express-validator`) and sanitized against
  NoSQL injection and XSS before touching the database.
- CORS is restricted to the origins listed in `FRONTEND_URL` — update this
  for your deployed frontend domain.

## Extending this project

- Add floor plans by extending `Location` with a `buildingId` + floor-level
  sub-map, and filter the graph per floor.
- Add "you are here" QR codes at physical campus locations that deep-link to
  `index.html?from=<locationId>`.
- Add a `favorites` field on `User` so students can bookmark frequent destinations.
