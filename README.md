# ⚡ ABRJobsApplier
**Find. Match. Apply.** — Built by NightDreamer

> A full-stack job search dashboard that aggregates jobs from 5 platforms, matches them to your resume using AI, and tracks every application — completely free.

🔗 **Live App** → [abrjobsapplier.netlify.app](https://abrjobsapplier.netlify.app)
🖥️ **Backend API** → [absjobsapplier.onrender.com](https://absjobsapplier.onrender.com)

---

## 📁 Project Structure

```
ABRJobsApplier/
│
├── frontend/
│   └── index.html          # Complete single-file frontend app
│
├── routes/
│   ├── jobs.js             # JSearch API integration + mock fallback
│   └── gmail.js            # Gmail OAuth2 read-only integration
│
├── server.js               # Express server entry point
├── package.json            # Node.js dependencies
├── railway.json            # Railway deployment config
├── Procfile                # Render deployment config
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| | Technology |
|---|---|
| **Frontend** | HTML · CSS · Vanilla JavaScript (single file) |
| **Backend** | Node.js · Express |
| **Job Data** | JSearch API via RapidAPI |
| **AI Tools** | Google Gemini API (free tier) |
| **Email** | Gmail OAuth2 (read-only) |
| **Frontend Hosting** | Netlify |
| **Backend Hosting** | Render |
| **Storage** | Browser localStorage — no database needed |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 Smart Matching | Resume-based job ranking with visual match score per card |
| 🤖 AI Cover Letters | Gemini AI writes unique cover letters per job |
| 📊 ATS Resume Score | Score how well your resume passes ATS filters |
| 🎤 Interview Prep | 15 AI-generated questions per role (technical + HR) |
| 📬 Gmail Alerts | Auto-detects interviews, offers and rejections |
| 📋 Kanban Tracker | Applied → Screening → Interview → Offer board |
| 💡 Skills Lookup | Must-have skills for 25+ roles (tech + non-tech) |
| 💰 Salary Data | Market salary ranges by role and city |
| 📊 Analytics | Response rate, funnel, platform performance |
| 🎨 10 Themes | Dark, Midnight, Cyberpunk, Amber, Light + 5 more |
| 🛡️ Safe Apply | Licensed APIs only — no scraping, no platform logins |

---

## 🚀 Deployment

### Frontend — Netlify
```
1. Drag frontend/index.html to netlify.com
   OR
   Link this GitHub repo → set publish directory to "frontend"
```

### Backend — Render
```
1. Connect this repo at render.com → New Web Service
2. Build Command:  npm install
3. Start Command:  node server.js
4. Instance Type:  Free
5. Add environment variables (see below)
```

---

## 🔑 Environment Variables

Add these in your **Render dashboard → Environment tab**:

```env
RAPIDAPI_KEY          =   # JSearch key from rapidapi.com (free, 500/month)
GMAIL_CLIENT_ID       =   # From Google Cloud Console
GMAIL_CLIENT_SECRET   =   # From Google Cloud Console
GMAIL_REDIRECT_URI    =   # https://your-backend.onrender.com/auth/gmail/callback
GMAIL_REFRESH_TOKEN   =   # Auto-generated after first Gmail auth flow
```

---

## 🤖 Free AI Tools Setup

```
1. Go to → aistudio.google.com/apikey
2. Sign in with Gmail → Create API Key → Copy it
3. In the app → Settings tab → paste key → Save
4. All 6 AI tools now work free (1M tokens/day, no card needed)
```

---

## 📬 Gmail Setup

```
1. Google Cloud Console → New Project → Enable Gmail API
2. Create OAuth2 credentials (Web Application type)
3. Add redirect URI: https://your-backend.onrender.com/auth/gmail/callback
4. Add GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET to Render
5. Visit: https://your-backend.onrender.com/auth/gmail/login
6. Authorize → copy Refresh Token → add to Render as GMAIL_REFRESH_TOKEN
```

---

## 🔄 Keep Backend Awake (Free)

Render free tier sleeps after 15 min of inactivity.

```
1. Go to cron-job.org → free account
2. New cronjob → URL: https://absjobsapplier.onrender.com
3. Interval: every 10 minutes → Save
```

---

## 🛡️ Safety

| What | How |
|---|---|
| Job fetching | JSearch API (licensed data) — no scraping ever |
| Platform login | Never — your LinkedIn/Naukri/Indeed never touched |
| Form automation | Disabled — manual copy-paste only (zero ban risk) |
| Gmail | Read-only OAuth2 — cannot send, delete or modify |
| User data | Browser localStorage only — nothing stored on server |

---

## 💰 Total Cost

| Service | Plan | Cost |
|---|---|---|
| Netlify | Free forever | ₹0 |
| Render | Free tier | ₹0 |
| JSearch API | 500 requests/month free | ₹0 |
| Google Gemini AI | 1M tokens/day free | ₹0 |
| Gmail API | Free | ₹0 |
| cron-job.org | Free | ₹0 |
| **Total** | | **₹0/month** |

---

## 🔗 API Endpoints

```
GET  /                                          → Health check
GET  /api/jobs/search?q=ml+engineer&location=India  → Search jobs
GET  /auth/gmail/login                          → Start Gmail OAuth
GET  /api/gmail/emails                          → Get detected emails
GET  /api/gmail/status                          → Gmail connection status
```

---

*Built with ❤️ by NightDreamer · Hyderabad, India · 2026*
