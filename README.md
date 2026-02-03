# 🚀 TaskFlow

TaskFlow is a modern task and project management platform built with **Next.js** and **Supabase**, designed to help students and developers organize their work, visualize task dependencies, and sync assignments directly from **Moodle**.

> Organize. Sync. Flow.

---

## ✨ Features

- ✅ User authentication (login & signup)
- 👤 User profiles with usernames
- 📁 Project-based task management
- 🧠 Task dependency graph (cycle-safe)
- 🔄 Moodle integration (courses & assignments sync)
- 🔐 Encrypted Moodle token storage
- 🟠 Visual distinction for Moodle-synced projects
- ⚡ Real-time UI updates
- 📱 Responsive, modern UI

---

## 🧱 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Database:** PostgreSQL
- **Styling:** CSS Modules / Custom styles
- **Auth:** Supabase Auth
- **Security:** AES-256-GCM token encryption
- **Deployment:** Vercel (recommended)

---

## 📂 Project Structure

```txt
taskflow/
├─ app/
│  ├─ dashboard/        # Main app UI
│  ├─ login/            # Login page
│  ├─ signup/           # Signup page
│  ├─ security/         # Security & token explanation
│  ├─ layout.js         # Root layout
│  └─ page.jsx          # Entry redirect logic
│
├─ lib/
│  └─ supabase/         # Supabase client setup
│
├─ public/
│  ├─ favicon.png
│  └─ assets/
│
├─ supabase/
│  └─ functions/
│     ├─ connect-moodle/
│     ├─ sync-moodle/
│     └─ _shared/
│        └─ crypto.ts   # Encryption utilities
│
├─ package.json
└─ README.md
🛠 Getting Started
1️⃣ Install dependencies
npm install
2️⃣ Run development server
npm run dev
Open:
👉 http://localhost:3000

🔐 Environment Variables
Create a .env.local file:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
Supabase Edge Function Secrets:

MOODLE_TOKEN_SECRET=your_strong_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
🔄 Moodle Integration
Log in to Moodle

Click your profile (top-right)

Go to Preferences

Open Security keys

Copy Moodle mobile web service

Paste it into TaskFlow → Connect Moodle

🔒 Tokens are encrypted and can be refreshed anytime from Moodle.

🧠 Task Dependencies
Declare dependencies between tasks

Automatic cycle detection

Visual dependency graph

Tasks can’t be completed before prerequisites

🚀 Deployment
Recommended deployment via Vercel:

vercel
Or follow:
👉 https://nextjs.org/docs/app/building-your-application/deploying

🧑‍💻 Author
Built with focus, frustration, and flow 💥
by Adham

