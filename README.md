# DIU FIFA World Cup Election Platform

A production-ready university election platform for Daffodil International University students to vote for FIFA World Cup committee members.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd "DIU FIFA ELECTION"
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Firestore** (Native mode) and **Authentication**
3. In Authentication → Sign-in methods → Enable:
   - **Google** (set authorized domain to `diu.edu.bd`)
   - **Email/Password**
4. Copy your project config from **Project Settings → Your apps → Web**

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗️ First-Time Admin Setup

1. Sign in with your Google `@diu.edu.bd` account
2. In Firebase Console → Firestore → `users` collection
3. Find your document, change `role` from `"student"` to `"superAdmin"`
4. Refresh the app — you'll see the Admin panel in the nav

---

## 📋 Admin Workflow

1. **Teams** → Add FIFA World Cup national teams with flag emoji + name
2. **Positions** → Add committee positions (President, VP, Secretary, etc.)
3. **Candidates** → Add candidates manually (name, photo URL, manifesto)
4. **Election Control** → Set voting window → Click "Start Voting"
5. **Results** → View live-updating results with rankings

---

## 🖼️ Free Image Hosting (for candidate photos)

Since Firebase Storage is not used, upload photos to:

- **ImgBB**: https://imgbb.com (free, direct links)
- **Imgur**: https://imgur.com (free, direct links)
- **Cloudinary**: https://cloudinary.com (free tier, 25GB)

Copy the **direct image URL** and paste into the candidate photo URL field.

---

## 🔐 Security

- Only `@diu.edu.bd` email accounts can sign in
- Google OAuth domain-hints to DIU workspace
- Email/password requires `@diu.edu.bd` format + email verification
- Votes are Firestore transaction-protected (no double voting)
- Firestore rules enforce role-based access
- Audit logs track every admin action

---

## 🚀 Deployment (Vercel)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add all `NEXT_PUBLIC_FIREBASE_*` env vars in Vercel settings
4. Deploy — done!

---

## 📁 Project Structure

```
app/
├── page.tsx              ← Landing (SSG)
├── login/                ← Auth page
├── (main)/
│   ├── dashboard/        ← Student home
│   ├── vote/[teamId]/    ← Voting page
│   ├── results/          ← Live results (polling)
│   └── profile/          ← Student profile
└── admin/
    ├── page.tsx           ← Overview
    ├── election/          ← Control panel
    ├── candidates/        ← Approval + CRUD
    ├── teams/             ← Team management
    ├── positions/         ← Position management
    ├── users/             ← User/role management
    └── logs/              ← Audit logs
lib/
├── firebase/             ← Firebase config + helpers
├── context/              ← Auth context
├── types/                ← TypeScript types
└── utils/                ← Helpers
```

---

## 🎨 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Vanilla CSS (no Tailwind) |
| Auth | Firebase Authentication |
| Database | Firestore (Spark plan) |
| Deployment | Vercel (free tier) |

---

## ⚡ Firebase Cost Optimization

- `results/{team_position}` aggregated doc = **1 read** for results (not N candidate reads)
- Voting uses Firestore **Transaction** for atomic safety
- Results page polls every **5 seconds** (not continuous listener)
- `electionSettings` is publicly readable (no auth read cost for landing page)
- No Firebase Storage used — external image URLs only

# DIU-Fifa-WC-2026-Election
