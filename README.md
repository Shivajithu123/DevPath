# DevPath — Escape Tutorial Hell

A full-stack AI-powered learning roadmap app. Stop watching tutorials. Start building real projects.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL
- **AI:** Claude API (claude-sonnet-4)
- **Auth:** JWT (email + password)
- **Hosting:** Vercel (frontend) + VPS (backend)

---

## Project Structure
```
devpath/
├── frontend/          # React app (deploy to Vercel)
│   └── src/
│       ├── pages/     # Login, Register, Dashboard, Generate, RoadmapView, SharedRoadmap
│       ├── context/   # AuthContext (JWT state)
│       └── utils/     # Axios API client
└── backend/           # Express API (deploy to VPS)
    ├── routes/        # auth.js, roadmaps.js, progress.js
    ├── middleware/    # auth.js (JWT verify)
    └── db/            # MySQL pool + schema.sql
```

---

## Setup Instructions

### 1. Database (MySQL)
```bash
mysql -u root -p < backend/db/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in .env with your values
npm start
```

**Required .env values:**
```
PORT=5000
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=devpath
JWT_SECRET=your_random_secret_key_min_32_chars
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=https://your-backend-api-url.com
```

Update `frontend/vite.config.js` proxy to point to your deployed backend URL for production, or keep as-is for local dev.

```bash
npm run dev      # development
npm run build    # production build
```

### 4. Deploy to Vercel (Frontend)
1. Push the `frontend/` folder to a GitHub repo
2. Import into Vercel
3. Set environment variable: `VITE_API_URL=https://your-backend.com`
4. Deploy

### 5. Deploy Backend to VPS
```bash
# On your VPS
git clone your-repo
cd devpath/backend
npm install
# Set up .env
npm install -g pm2
pm2 start server.js --name devpath-api
pm2 save
```

Use Nginx as a reverse proxy to expose port 5000 on your domain.

---

## Features
- AI-generated roadmaps for any technology (3 levels: Beginner → Intermediate → Advanced)
- 4–6 learning steps + 2–3 real projects per level
- Mark steps & projects complete with progress tracking
- Per-step notes (auto-saved with debounce)
- Dashboard with all your roadmaps
- Rename & delete roadmaps
- Export roadmap as PDF
- Share roadmap via public link
- Full JWT auth (register / login / logout)
- MySQL persistence for all data

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | ❌ | Create account |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/roadmaps | ✅ | All user roadmaps |
| POST | /api/roadmaps | ✅ | Save new roadmap |
| GET | /api/roadmaps/:id | ✅ | Single roadmap + progress |
| PATCH | /api/roadmaps/:id | ✅ | Rename roadmap |
| DELETE | /api/roadmaps/:id | ✅ | Delete roadmap |
| POST | /api/roadmaps/:id/share | ✅ | Generate share link |
| DELETE | /api/roadmaps/:id/share | ✅ | Unshare |
| GET | /api/roadmaps/shared/:token | ❌ | Public shared view |
| PUT | /api/progress/:roadmapId/items/:itemId | ✅ | Update step/project progress |
| GET | /api/progress/:roadmapId | ✅ | Get all progress |
