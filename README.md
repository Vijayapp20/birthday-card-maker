# 🎉 Celebration Wishes — Full Stack
*(formerly Birthday Card Maker)*

**React + Vite** frontend · **Spring Boot + Spring AI + Groq** backend

🔗 **Live app:** [celebration-wishes.vercel.app](https://celebration-wishes.vercel.app/)

---

## 📁 Project Structure

```
birthday-card-maker/
├── frontend/         ← React + Vite app
└── backend/          ← Spring Boot + Spring AI API
```

---

## 🚀 Quick Start

### 1. Backend Setup

```
cd backend
```

Set these environment variables (a local `.env` file is **not** read automatically — export them in your shell or set them in your IDE run configuration):

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `GROQ_API_KEY` | yes | Free key from <https://console.groq.com> |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | yes | MySQL connection (e.g. Aiven) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | yes | Photo storage |
| `CORS_ALLOWED_ORIGINS` | in production | Comma-separated frontend origins, e.g. `https://celebration-wishes.vercel.app` (default: `http://localhost:5173`) |
| `GROQ_MODEL` | no | Default `llama-3.1-8b-instant` |
| `DDL_AUTO` | no | Default `update`. Set to `validate` in production once tables match `backend/schema.sql` |
| `RATE_LIMIT_ENABLED` | no | Default `true` |

**Windows:**

```
set GROQ_API_KEY=your_groq_api_key_here
mvn spring-boot:run
```

**Mac/Linux:**

```
export GROQ_API_KEY=your_groq_api_key_here
./mvnw spring-boot:run
```

Backend runs at → `http://localhost:8080`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 🔑 Getting Groq API Key (Free)

1. Go to https://console.groq.com
2. Sign up / Login
3. Click **API Keys** → **Create API Key**
4. Copy the key and set it as `GROQ_API_KEY` env variable

---

## 📡 API Endpoints

| Method | Endpoint                | Description                                        |
| ------ | ----------------------- | -------------------------------------------------- |
| POST   | `/api/generate-message` | AI-generated wish message via Groq                 |
| POST   | `/api/upload`           | Upload a photo (JPG/PNG/WebP, max 5 MB) → Cloudinary |
| POST   | `/api/cards`            | Save a finished card, returns its shareable `id`   |
| GET    | `/api/cards/{id}`       | Load a saved card (id is a UUID)                   |
| GET    | `/api/health`           | Health check                                       |

### POST /api/generate-message

```
// Request
{
  "recipientName": "Priya",
  "senderName": "Rahul",
  "relationship": "Lover",
  "occasionType": "birthday"
}

// Response
{
  "message": "Every day with you feels like a celebration..."
}
```

### POST /api/upload

```
Content-Type: multipart/form-data
file: <image file>

// Response
{
  "url": "https://res.cloudinary.com/<cloud-name>/image/upload/.../birthday-cards/<uuid>.jpg",
  "filename": "birthday-cards/<uuid>"
}
```

### POST /api/cards

```
// Request
{
  "recipientName": "Priya",
  "senderName": "Rahul",
  "relationship": "Lover",
  "message": "Every day with you feels like a celebration...",
  "photoUrl": "https://res.cloudinary.com/<cloud-name>/...",   // optional, must be your Cloudinary URL
  "characterGif": "g5",
  "occasionType": "birthday",
  "template": "photo"                                          // photo | giftbox
}

// Response: the saved card, including its "id" used in the share link (?card=<id>)
```

### Errors and limits

- Validation problems return `400` with `{ "error": "..." }`.
- Photos over 5 MB return `413`.
- Too many requests return `429` with a `Retry-After` header. Limits are per IP (e.g. 10 AI messages / 10 min, 10 uploads / 10 min) plus a global hourly cap per endpoint. They live in memory, so they reset when the server restarts.

---

## ✨ Features

- 🎉 **Multi-occasion support** — birthday, anniversary, wedding, graduation, new job, new home / housewarming, baby shower, engagement
- 🎂 **Dynamic Form** — recipient name, sender name, relationship picker
- 🤖 **AI Message** — Groq (Llama 3.1) generates a personalised wish
- ✏️ **Custom Message** — write your own message instead
- 📸 **Photo Upload** — face-aware cropping, photo becomes part of the card
- 💖 **Animated Card** — confetti, pop-up open animation, handwriting-style text reveal, falling sparkles
- 🔗 **Shareable Link** — every card gets a unique, shareable UUID link
- 🔎 **SEO landing pages** — one page per occasion with 30+ ready-to-copy wishes, sitemap and per-page meta tags
- 📱 **Responsive** — works on mobile & desktop

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Axios, Framer Motion, GSAP |
| Animations | canvas-confetti, SweetAlert2 |
| Backend | Spring Boot 3.3, Java 21 |
| AI           | Spring AI + Groq (Llama 3.1 8B Instant)    |
| Database | MySQL (hosted on Aiven) |
| File Storage | Cloudinary |
| Deployment | Vercel (frontend) · Render (backend) |
