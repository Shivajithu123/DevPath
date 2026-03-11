# DevPath 🚀
### AI-Powered Learning Roadmaps for Developers

> Stop watching tutorials. Start building. DevPath generates personalized learning roadmaps, quizzes, and resources for any technology — so you always know what to learn next.

---

## 🌐 Live Demo

**link:** [https://dev-path-eight.vercel.app](https://dev-path-eight.vercel.app)  


---

## ✨ Features

- 🗺️ **AI-Generated Roadmaps** — Enter any technology and get a structured learning roadmap with Beginner, Intermediate, and Advanced levels
- 🧠 **Quizzes** — Test your understanding at every step with AI-generated multiple choice questions
- 📚 **Curated Resources** — Get free learning resources (docs, GitHub repos, articles) for every topic
- 📊 **Progress Tracking** — Track your learning journey and see your quiz analytics
- 🔗 **Shareable Roadmaps** — Share your roadmap with others via a unique link
- 🔐 **Authentication** — Secure JWT-based login and registration

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React + Vite | UI Framework |
| Axios | HTTP Client |
| Vercel | Hosting |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API |
| Supabase (PostgreSQL) | Database |
| JWT | Authentication |
| Gemini API | AI Generation |
| Render | Hosting |

---

## 📁 Project Structure

```
devpath/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   │       └── client.js
│   └── .env
│
└── backend/           # Node.js + Express API
    ├── routes/
    │   ├── auth.js
    │   ├── roadmaps.js
    │   ├── ai.js
    │   ├── quiz.js
    │   └── progress.js
    ├── middleware/
    │   └── auth.js
    ├── db/
    ├── utils/
    └── index.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Supabase account
- Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/devpath.git
cd devpath
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
node index.js
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Roadmaps
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roadmaps` | Get all roadmaps |
| POST | `/api/roadmaps` | Create a roadmap |
| GET | `/api/roadmaps/:id` | Get a roadmap |
| PATCH | `/api/roadmaps/:id` | Rename a roadmap |
| DELETE | `/api/roadmaps/:id` | Delete a roadmap |
| POST | `/api/roadmaps/:id/share` | Toggle share |
| POST | `/api/roadmaps/:id/progress` | Save progress |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Generate a roadmap |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/generate` | Generate quiz questions |
| POST | `/api/quiz/result` | Save quiz result |
| GET | `/api/quiz/results/:roadmapId` | Get results |
| GET | `/api/quiz/analytics` | Get analytics |
| POST | `/api/quiz/generate-resources` | Get resources for a step |

---

## 🌍 Deployment

### Backend (Render)
1. Connect your GitHub repo to Render
2. Set **Root Directory** to `backend`
3. Set **Start Command** to `node index.js`
4. Add all environment variables from `.env`

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   ```

---



## 📄 License

MIT License — feel free to use and modify.

---

> *"Build apps. Not watch hours."* 💻
