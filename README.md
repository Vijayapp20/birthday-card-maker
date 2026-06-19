# 🎉 Birthday Card Maker — Full Stack

**React + Vite** frontend · **Spring Boot + Spring AI + Groq** backend

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
| POST | `/api/generate-message` | AI birthday message via Groq |
| POST | `/api/upload` | Upload photo (multipart) |
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

- 🎂 **Dynamic Form** — recipient name, sender name, relationship picker
- 🤖 **AI Message** — Groq (Llama3) generates personalised birthday message
- ✏️ **Custom Message** — write your own message
- 📸 **Photo Upload** — user's photo replaces background
- 💖 **Animated Card** — confetti, slider, SweetAlert2 popup, TypeIt typing, falling hearts
- 📱 **Responsive** — works on mobile & desktop

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Axios |
| Animations | canvas-confetti, TypeIt, SweetAlert2 |
| Backend | Spring Boot 3.3, Java 21 |
| AI | Spring AI 1.0 + Groq (Llama3-8b) |
| File Upload | Spring Multipart → local `/uploads` folder |
