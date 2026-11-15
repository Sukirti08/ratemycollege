# RateMyCollege India 🎓

> Honest, student-verified ratings for IITs, NITs, IIITs, and top Indian engineering colleges.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                          │
├─────────────────────────────────────────────────────────┤
│  Browser → Vercel CDN → React App (Vite)                │
│                ↓ Axios (withCredentials)                 │
│  Railway → Express.js API Server                        │
│       ├── MongoDB Atlas (Mongoose ODM)                  │
│       ├── Google Gemini API (Oracle feature)         │
│       ├── Cloudinary (offer letter storage)             │
│       └── Google OAuth 2.0 (passport.js)               │
└─────────────────────────────────────────────────────────┘
```

---

## Features

- **College Ratings** — Multi-dimensional ratings: teaching, placements, research, hostel, infrastructure, faculty accessibility
- **Verified Reviews** — Students verify reviews via institutional email (`.ac.in` domain check)
- **Professor Ratings** — Rate and tag individual professors per college
- **Placement Data** — Crowdsourced CTC data with offer letter verification via Cloudinary
- **Compare Colleges** — Side-by-side comparison of up to 4 colleges (persisted in localStorage)
- **Oracle AI** — Ask any college question; get an AI answer powered by Google Gemini with real-time SSE streaming
- **Google OAuth** — Passwordless login via Google, restricted to verified `.ac.in` email holders
- **Q&A Board** — College-specific community Q&A with upvoting
- **Package Truth Index** — Claimed vs actual average packages exposed per college

---

## Prerequisites

Before you begin, ensure you have the following installed and available:

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Comes with Node 18 |
| MongoDB Atlas account | — | Free tier works fine |
| Google Cloud Console project | — | For OAuth credentials |
| Gemini API key | — | For Oracle AI feature |
| Cloudinary account | — | For offer letter storage |

---

## Local Setup

Follow these steps in order:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sukirti08/ratemycollege.git
   cd ratemycollege
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Create environment files**

   Copy the example files and fill in your values:
   ```bash
   # In /server
   cp .env.example .env

   # In /client
   cp .env.example .env
   ```

5. **Configure server environment variables** — see the Environment Variables table below.

6. **Configure client environment variables**
   ```
   VITE_API_URL=http://localhost:5000
   ```

7. **Whitelist your IP in MongoDB Atlas**

   Go to Atlas → Network Access → Add IP Address → Add Current IP (or use `0.0.0.0/0` for development).

8. **Seed the database**
   ```bash
   cd server
   node seed.js
   ```

9. **Start both servers** (see Running the App below).

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | Full MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.abc.mongodb.net/ratemycollege` |
| `PORT` | ❌ | Port for Express server (default: 5000) | `5000` |
| `NODE_ENV` | ✅ | Environment name | `development` or `production` |
| `CLIENT_URL` | ✅ | Exact frontend URL (no trailing slash) | `http://localhost:5173` |
| `SESSION_SECRET` | ✅ | Random string for express-session | `my-super-secret-key-32chars+` |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens | `another-long-random-string` |
| `JWT_EXPIRES_IN` | ❌ | JWT expiry duration | `7d` |
| `GOOGLE_CLIENT_ID` | ✅ | From Google Cloud Console | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | From Google Cloud Console | `GOCSPX-abcdefghijk` |
| `GOOGLE_CALLBACK_URL` | ✅ | Must match exactly in Google Console | `http://localhost:5000/api/auth/google/callback` |
| `GEMINI_API_KEY` | ✅ | From console.anthropic.com | `sk-ant-api03-...` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | From Cloudinary dashboard | `my-cloud-name` |
| `CLOUDINARY_API_KEY` | ✅ | From Cloudinary dashboard | `123456789012345` |
| `CLOUDINARY_API_SECRET` | ✅ | From Cloudinary dashboard | `abcdefghijklmnopqrstuvwxyz` |
| `ALLOWED_EMAIL_DOMAINS` | ❌ | Comma-separated extra domains to whitelist | `iitb.ac.in,bits-pilani.ac.in` |

### Client (`client/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL | `http://localhost:5000` |

---

## Running the App

Open two terminal windows:

**Terminal 1 — Backend server:**
```bash
cd server
npm run dev
# Starts Express on http://localhost:5000
# Uses nodemon for hot-reload
```

**Terminal 2 — Frontend client:**
```bash
cd client
npm run dev
# Starts Vite on http://localhost:5173
```

Visit `http://localhost:5173` in your browser.

---

## Seeding the Database

Run the seed script to populate all colleges, professors, reviews, placement data, and Q&A:

```bash
cd server
node seed.js
```

Expected output:
```
╔══════════════════════════════════════════╗
║     RateMyCollege India — DB Seed        ║
╚══════════════════════════════════════════╝

► Connecting to MongoDB…
✓ Connected to MongoDB

► Dropping existing collections…
  ✓ Dropped: colleges
  ✓ Dropped: professors
  ...

╔══════════════════════════════════════════╗
║              Seed Summary                ║
╠══════════════════════════════════════════╣
║  Colleges   : 10                         ║
║  Professors : 40                         ║
║  Reviews    : 50                         ║
║  Placements : 30                         ║
║  Questions  : 30                         ║
╚══════════════════════════════════════════╝

✅  Database seeded successfully!
```

> Run the idempotent sample-data seed against a dedicated demo database.

---

## Google OAuth Setup

Follow these steps carefully — any mismatch will cause a 400 or redirect loop:

1. **Go to Google Cloud Console**
   - Navigate to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project (or select an existing one)

2. **Enable the Google+ API**
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it
   - Also enable "People API"

3. **Create OAuth Credentials**
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `RateMyCollege India (Dev)`

4. **Set Authorized Redirect URIs**

   Add the following URIs (one per line):
   ```
   http://localhost:5000/api/auth/google/callback
   ```
   For production, also add:
   ```
   https://your-railway-app.railway.app/api/auth/google/callback
   ```

   > 📸 *Screenshot reference: The redirect URI field is the second input box in the "Authorized redirect URIs" section. It must match `GOOGLE_CALLBACK_URL` in your `.env` exactly — including the protocol and path.*

5. **Copy your credentials**
   - Copy the `Client ID` → paste into `GOOGLE_CLIENT_ID`
   - Copy the `Client Secret` → paste into `GOOGLE_CLIENT_SECRET`

6. **Configure OAuth Consent Screen**
   - Go to APIs & Services → OAuth consent screen
   - User Type: **External**
   - App name: `RateMyCollege India`
   - Add your domain under "Authorized domains" when in production
   - Scopes needed: `email`, `profile`, `openid`

   > 📸 *Screenshot reference: Under "Scopes", click "Add or Remove Scopes" and check the first three scopes in the list (email, profile, openid).*

7. **Test the flow**
   - Start the server, visit `http://localhost:5000/api/auth/google`
   - You should be redirected to Google's login page
   - After login, you should be redirected back to `CLIENT_URL` with a cookie set

---

## Adding a New College

To add a college to the seed data:

1. Open `server/seed.js`

2. Add a new entry to the `COLLEGES_DATA` array:
   ```javascript
   {
     name: 'Your College Full Name',
     shortName: 'SHORT',
     type: 'IIT', // one of: 'IIT', 'NIT', 'BITS', 'IIIT', 'Other'
     location: { city: 'City Name', state: 'State Name' },
     website: 'https://college.ac.in',
     establishedYear: 1970,
     branches: ['CSE', 'ECE', 'ME'],
     ratings: {
       overall: 4.0, teaching: 4.0, placements: 4.0,
       research: 3.8, hostel: 3.5, infrastructure: 3.9,
       facultyAccessibility: 4.0
     },
     claimedAvgPackage: 15,
     actualAvgPackage: 12,
     topRecruiters: ['TCS', 'Infosys', 'Wipro'],
     emailDomains: ['yourcollege.ac.in'],
   }
   ```

3. Add the corresponding entry to `PROFESSORS_TEMPLATE`, `REVIEWS_DATA`, `PLACEMENTS_TEMPLATE`, and `QUESTIONS_TEMPLATE` arrays at the same index position.

4. Re-run `node seed.js`.

---

## Whitelisting a New Email Domain

When a student from a college not in the default list tries to verify:

1. Open `server/utils/emailValidator.js`

2. Add the domain to the `WHITELISTED_DOMAINS` array:
   ```javascript
   const WHITELISTED_DOMAINS = [
     'iitb.ac.in',
     'cse.iitb.ac.in',
     // ... existing domains ...
     'yournewcollege.ac.in', // ← add here
   ];
   ```

3. Alternatively, set the `ALLOWED_EMAIL_DOMAINS` environment variable on Railway (comma-separated) to add domains without redeploying:
   ```
   ALLOWED_EMAIL_DOMAINS=newcollege1.ac.in,newcollege2.ac.in
   ```

---

## Deployment: Vercel (Frontend)

1. **Push your code to GitHub**

2. **Import project on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Set the **Root Directory** to `client`
   - Framework Preset: **Vite**

3. **Set environment variables on Vercel**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-railway-app.railway.app/api`

4. **Configure `vercel.json`** in the `client` directory for SPA routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

5. **Deploy**
   - Click Deploy — Vercel will build and deploy automatically
   - Every push to `main` triggers a new deployment

6. **Note your Vercel URL** — you will need it for `CLIENT_URL` on Railway.

---

## Deployment: Railway (Backend)

1. **Go to [railway.app](https://railway.app) and create a new project**

2. **Connect your GitHub repository**
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set the **Root Directory** to `server`

3. **Set environment variables on Railway**

   In the Railway service → Variables tab, add all server environment variables from the table above. Key ones:
   ```
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app
   GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback
   MONGODB_URI=mongodb+srv://...
   GEMINI_API_KEY=sk-ant-...
   ```

4. **Set the start command**

   In Settings → Deploy → Start Command:
   ```bash
   node server.js
   ```

5. **Generate a Railway domain**
   - Go to Settings → Networking → Generate Domain
   - Copy this URL and use it in Vercel's `VITE_API_URL` and Google Console's redirect URIs

6. **Update Google Console**
   - Add `https://your-app.railway.app/api/auth/google/callback` to Authorized Redirect URIs

7. **Verify deployment**
   - Visit `https://your-app.railway.app/api/health` — should return `{ status: 'ok' }`

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| CORS error on login / API calls | `CLIENT_URL` in backend env doesn't match Vercel URL | Update `CLIENT_URL` in Railway Variables to exact Vercel URL (no trailing slash) |
| OAuth callback returns 400 | `GOOGLE_CALLBACK_URL` doesn't match Google Console exactly | Must match protocol, host, port, and path exactly — copy-paste from Railway domain |
| Cookie not sent to backend | `sameSite` misconfigured for cross-origin | Set `sameSite: 'none'` and `secure: true` in production cookie config |
| Seed script fails immediately | MongoDB not reachable | Check `MONGODB_URI` format and whitelist your IP in Atlas Network Access |
| Oracle feature returns 429 | Anthropic rate limit hit | Increase `oracleLimiter` window in `middleware/rateLimiter.js` or wait 1 hour |
| Oracle SSE not streaming | `res.flushHeaders()` missing | Ensure `flushHeaders()` is called before writing any SSE chunks |
| Auth loop after Google login | Session secret changed between restarts | Keep `SESSION_SECRET` stable — store in env, don't regenerate |
| Images not uploading | Cloudinary env vars missing or wrong | Double-check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Branch change not reflected | Browser cache stale | Hard-refresh (`Ctrl+Shift+R`) or clear site data |
| Mongoose validation error on seed | Schema mismatch | Ensure `type` field in college data matches enum: `'IIT' \| 'NIT' \| 'BITS' \| 'IIIT' \| 'Other'` |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI framework and build tool |
| Styling | Tailwind CSS | Utility-first CSS |
| State Management | Zustand | Lightweight global state (compare store) |
| HTTP Client | Axios | API requests with credential support |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB Atlas | Cloud-hosted NoSQL database |
| ODM | Mongoose | Schema modelling and validation |
| Auth | Passport.js + Google OAuth 2.0 | Social login |
| Sessions | express-session | Server-side session store |
| Auth Tokens | JSON Web Tokens (JWT) | Stateless auth via HTTP-only cookie |
| AI Feature | Google Gemini API | Oracle AI Q&A with streaming |
| File Storage | Cloudinary | Offer letter PDF/image upload and CDN |
| Rate Limiting | express-rate-limit | API and Oracle endpoint protection |
| Deployment (FE) | Vercel | CDN + serverless hosting for React |
| Deployment (BE) | Railway | Container hosting for Express |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes with clear messages: `git commit -m "feat: add X feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request against `main` with a description of what you changed and why

Please ensure:
- New college data follows the exact schema structure in `seed.js`
- API endpoints have corresponding rate limiting
- All new env variables are documented in `.env.example` and this README
- Code follows the existing ESLint configuration

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built for Indian students, by Indian students. Honest reviews only.*

## Portfolio demo on Render

The root `render.yaml` builds the frontend and serves it from the Express
service. Set `MONGODB_URI` to a dedicated demo database such as
`ratemycollege_demo`. The service runs the idempotent seed on startup.
The seed inserts labelled examples and does not drop collections.

Guest browsing and the Oracle sample-data guide work without third-party
keys. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` to enable live
Gemini replies. Configure Google OAuth and Cloudinary only if you want to
enable those integrations. Uploading an offer letter stores authenticated
evidence and leaves the submission pending review.
