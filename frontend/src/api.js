// frontend/src/api.js
//
// Centralized axios instance.
//
// In development, VITE_API_URL is left unset, so baseURL is '' and
// requests like axios.post('/api/upload') still go through the Vite
// dev server proxy defined in vite.config.js (which forwards to
// http://localhost:8080).
//
// In production (Vercel), there is no dev server proxy — the built
// static files are served as-is. So we point requests directly at
// the deployed backend (Render) using an environment variable set in
// the Vercel project settings:
//
//   VITE_API_URL=https://your-backend.onrender.com
//
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL })

export default api
