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

```bash
cd backend
```

**Set your Groq API Key** (free at https://console.groq.com):

**Windows:**
```cmd
set GROQ_API_KEY=your_groq_api_key_here
mvn spring-boot:run
```

**Mac/Linux:**
```bash
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-message` | AI-generated wish message via Groq |
| POST | `/api/upload` | Upload photo (multipart, stored via Cloudinary) |
| GET  | `/api/health` | Health check |

### POST /api/generate-message
```json
// Request
{
  "recipientName": "Priya",
  "senderName": "Rahul",
  "relationship": "Lover"
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
  "url": "/uploads/uuid-filename.jpg",
  "filename": "uuid-filename.jpg"
}
```

---

## ✨ Features

- 🎉 **Multi-occasion support** — birthday, anniversary, graduation, new job, new home, baby shower, engagement
- 🎂 **Dynamic Form** — recipient name, sender name, relationship picker
- 🤖 **AI Message** — Groq (Llama 3.1) generates a personalised wish
- ✏️ **Custom Message** — write your own message instead
- 📸 **Photo Upload** — face-aware cropping, photo becomes part of the card
- 💖 **Animated Card** — confetti, pop-up open animation, handwriting-style text reveal, falling sparkles
- 🔗 **Shareable Link** — every card gets a unique, shareable UUID link
- 📱 **Responsive** — works on mobile & desktop

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Axios, Framer Motion, GSAP |
| Animations | canvas-confetti, SweetAlert2 |
| Backend | Spring Boot 3.3, Java 21 |
| AI | Spring AI 1.0 + Groq (Llama 3.1) |
| Database | MySQL (hosted on Aiven) |
| File Storage | Cloudinary |
| Deployment | Vercel (frontend) · Render (backend) |
