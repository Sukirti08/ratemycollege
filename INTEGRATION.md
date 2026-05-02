# INTEGRATION.md — Developer Integration Guide

> Deep-dive reference for developers extending or debugging RateMyCollege India.
> Read this after completing the README setup.

---

## 1. Service Startup Order

Services must be started in this order to avoid connection errors.

### Production

```
MongoDB Atlas  ──►  Railway (Express backend)  ──►  Vercel (React frontend)
   (always on)           (starts on deploy)            (CDN, always on)
```

MongoDB Atlas is cloud-hosted and always available. Railway will retry the
Mongoose connection on startup. Vercel is statically deployed — it only needs
the backend URL baked into the build via `VITE_API_URL`.

### Local Development

```bash
# Step 1 — MongoDB must be reachable (Atlas or local)
#   Option A: Use Atlas (recommended — no local install needed)
#   Option B: Start local mongod
mongod --dbpath /data/db

# Step 2 — Start the Express backend
cd server
npm run dev
# ✓ Express running on http://localhost:5000
# ✓ Mongoose connected to MongoDB

# Step 3 — Start the React frontend
cd client
npm run dev
# ✓ Vite running on http://localhost:5173
```

> ⚠️ Never start the frontend before the backend — Axios calls on page load
> will fail with network errors and some Zustand hydration logic may break.

---

## 2. Authentication Flow

### Full OAuth + JWT Cookie Flow (ASCII)

```
Browser                    Backend (Express)              Google
   │                             │                           │
   │  GET /api/auth/google       │                           │
   │ ─────────────────────────► │                           │
   │                             │  Redirect 302             │
   │ ◄─────────────────────────  │ ─────────────────────────►│
   │                             │                           │
   │  [User logs in on Google]   │                           │
   │                             │  POST callback + code     │
   │                             │ ◄─────────────────────────│
   │                             │                           │
   │                             │  Exchange code for tokens │
   │                             │  Fetch user profile       │
   │                             │  Upsert user in MongoDB   │
   │                             │  Sign JWT                 │
   │                             │  Set HTTP-only cookie     │
   │  Redirect to CLIENT_URL/    │                           │
   │ ◄─────────────────────────  │                           │
   │                             │                           │
   │  GET /api/auth/me           │                           │
   │  (cookie sent automatically)│                           │
   │ ─────────────────────────► │                           │
   │                             │  Verify JWT from cookie   │
   │                             │  Return user object       │
   │ ◄─────────────────────────  │                           │
```

### Email Domain Validation

After Google OAuth returns the user profile, the backend checks the email
domain against `WHITELISTED_DOMAINS` in `emailValidator.js`. If the domain
does not match, the user is created with `isVerified: false`. They can still
browse but cannot submit reviews or placement data until verified.

### JWT Cookie Properties

```javascript
// server/controllers/authController.js
res.cookie('token', jwt, {
  httpOnly: true,       // Not accessible via document.cookie
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

---

## 3. Oracle SSE Integration

The Oracle feature streams Claude AI responses to the browser in real-time
using Server-Sent Events (SSE) over a `POST` request.

### Why `fetch()` and not `EventSource`

The native `EventSource` browser API only supports `GET` requests. Oracle
requires a `POST` body to send the user's question and college context.
Therefore we use `fetch()` with a `ReadableStream` reader to manually consume
the SSE stream.

### Exact Client-Side Fetch Pattern

```javascript
// client/src/features/oracle/useOracle.js

async function askOracle(question, collegeId) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/oracle/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    credentials: 'include',   // ← REQUIRED: sends the JWT cookie cross-origin
    body: JSON.stringify({ question, collegeId }),
  });

  if (!response.ok) throw new Error(`Oracle error: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by double newline
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // last partial chunk back to buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;   // stream termination signal
        try {
          const parsed = JSON.parse(data);
          // parsed.delta contains the text chunk
          setAnswer(prev => prev + (parsed.delta ?? ''));
        } catch {
          // non-JSON line (e.g. comment) — ignore
        }
      }
    }
  }
}
```

### Server-Side SSE Handler

```javascript
// server/routes/oracle.js

router.post('/ask', oracleLimiter, requireAuth, async (req, res) => {
  const { question, collegeId } = req.body;

  // 1. Set SSE headers BEFORE writing any data
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();  // ← CRITICAL: flush headers to client immediately

  // 2. Stream from Anthropic
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildOraclePrompt(question, collegeId) }],
  });

  stream.on('text', (delta) => {
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  });

  stream.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  stream.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => stream.abort()); // cleanup if client disconnects
});
```

### CORS and Cookie Requirement

For the `credentials: 'include'` fetch to work cross-origin, the backend
must respond with **both**:
- `Access-Control-Allow-Origin: <exact CLIENT_URL>` (not `*`)
- `Access-Control-Allow-Credentials: true`

```javascript
// server/index.js
app.use(cors({
  origin: process.env.CLIENT_URL,   // exact origin, no wildcard
  credentials: true,
}));
```

---

## 4. Cookie Configuration for Cross-Origin

Cross-origin cookies are the most common source of production bugs. Here is
the exact configuration for each environment:

### Development (localhost)

```javascript
res.cookie('token', jwt, {
  httpOnly: true,
  secure: false,          // HTTP allowed on localhost
  sameSite: 'lax',        // Lax works for same-site (localhost:5173 → localhost:5000)
  maxAge: 604800000,
});
```

Works because both Vite and Express run on `localhost` — treated as same-site.

### Production (Vercel → Railway)

```javascript
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,           // HTTPS required (both Vercel and Railway provide it)
  sameSite: 'none',       // REQUIRED for cross-origin cookie sending
  maxAge: 604800000,
});
```

**Why `sameSite: 'none'` + `secure: true`?**

Vercel (`*.vercel.app`) and Railway (`*.railway.app`) are different origins.
Browsers block `SameSite: lax/strict` cookies from being sent cross-origin.
`none` allows cross-origin sending but **requires** `Secure: true` (HTTPS).

- Railway automatically provisions HTTPS via its generated domain.
- Vercel automatically provisions HTTPS for all deployments.

> 🔑 If you set `sameSite: 'none'` without `secure: true`, Chrome will silently
> ignore the cookie. This is the most common production auth failure.

### Toggle Based on Environment

```javascript
// server/config/cookieConfig.js
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
```

---

## 5. `compareStore` ↔ URL Sync

### How the Compare Store Works

```javascript
// client/src/store/compareStore.js  (Zustand)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCompareStore = create(
  persist(
    (set, get) => ({
      colleges: [],      // array of college objects (max 4)

      addCollege: (college) => {
        if (get().colleges.length >= 4) return;
        if (get().colleges.find(c => c._id === college._id)) return;
        set(state => ({ colleges: [...state.colleges, college] }));
      },

      removeCollege: (id) =>
        set(state => ({ colleges: state.colleges.filter(c => c._id !== id) })),

      clearAll: () => set({ colleges: [] }),
    }),
    {
      name: 'rmc-compare-store',  // localStorage key
    }
  )
);
```

### Key Behaviors

**Persistence:** The `persist` middleware automatically serializes the store
to `localStorage` under the key `rmc-compare-store`. The store rehydrates on
page load. Users can close and reopen the browser and their compare list survives.

**No URL Params:** The `/compare` page reads colleges exclusively from the
Zustand store — it does not read from URL query parameters. This is an
intentional design choice to avoid URL length limits with 4 full college
objects and to keep the URL clean.

**Global Updates:** Calling `addCollege()` from the college card, the college
detail page, or the search results all update the same store, which instantly
updates the compare badge count in the navbar.

**Sharing Compares:** To support shareable compare URLs in the future, you
would need to store college IDs in the URL and hydrate from the API on mount.
The current implementation does not do this.

### Accessing the Store in a Component

```javascript
import useCompareStore from '../store/compareStore';

function CollegeCard({ college }) {
  const { colleges, addCollege, removeCollege } = useCompareStore();
  const isInCompare = colleges.some(c => c._id === college._id);

  return (
    <button onClick={() => isInCompare
      ? removeCollege(college._id)
      : addCollege(college)
    }>
      {isInCompare ? 'Remove from Compare' : 'Add to Compare'}
    </button>
  );
}
```

---

## 6. College Ratings Recalculation

### When Recalculation is Triggered

Ratings are recalculated on the backend (not cached) whenever:
- A new review is submitted (`POST /api/reviews`)
- A review is deleted (`DELETE /api/reviews/:id`)

Package data is recalculated when:
- A new placement record is submitted (`POST /api/placements`)

### Ratings Formula

```javascript
// server/utils/recalculateRatings.js

async function recalculateCollegeRatings(collegeId) {
  const reviews = await Review.find({ college: collegeId, isActive: { $ne: false } });

  if (reviews.length === 0) return;

  const dimensions = [
    'overall', 'teaching', 'placements', 'research',
    'hostel', 'infrastructure', 'facultyAccessibility'
  ];

  const newRatings = {};
  for (const dim of dimensions) {
    const sum = reviews.reduce((acc, rv) => acc + (rv.ratings[dim] ?? 0), 0);
    newRatings[dim] = parseFloat((sum / reviews.length).toFixed(1));
  }

  await College.findByIdAndUpdate(collegeId, { ratings: newRatings });
}
```

### Package Recalculation Formula

```javascript
async function recalculateActualAvgPackage(collegeId) {
  const placements = await Placement.find({
    college: collegeId,
    isVerified: true    // only verified placements count
  });

  if (placements.length === 0) return;

  const avgCTC = placements.reduce((sum, p) => sum + p.ctc, 0) / placements.length;

  await College.findByIdAndUpdate(collegeId, {
    actualAvgPackage: parseFloat(avgCTC.toFixed(2))
  });
}
```

**Important:** `claimedAvgPackage` is set only by the seed script or an admin
endpoint. `actualAvgPackage` is crowd-sourced and recalculated dynamically from
verified placement submissions.

---

## 7. Common Issues

| Issue | Cause | Fix |
|---|---|---|
| CORS error on login | `CLIENT_URL` in Railway env doesn't match Vercel URL | Update `CLIENT_URL` to exact Vercel URL without trailing slash. Example: `https://ratemycollege.vercel.app` not `https://ratemycollege.vercel.app/` |
| OAuth callback 400 | `GOOGLE_CALLBACK_URL` doesn't match exactly in Google Console | Copy the Railway domain URL precisely — include `https://`, correct path `/api/auth/google/callback`. Update Google Console Authorized Redirect URIs to match. |
| Cookie not sent cross-origin | `sameSite` misconfigured | Production requires `sameSite: 'none'` AND `secure: true`. Both must be set together. Check `NODE_ENV=production` is set in Railway. |
| Seed fails with MongoNetworkError | IP not whitelisted in Atlas | Go to Atlas → Network Access → Add Current IP. For CI/CD use `0.0.0.0/0` but restrict in production. |
| Oracle returns 429 Too Many Requests | Rate limit on Oracle endpoint hit | Adjust `oracleLimiter` in `middleware/rateLimiter.js` — increase `max` requests or `windowMs`. Anthropic rate limits reset hourly on their side. |
| SSE not streaming (response arrives all at once) | `res.flushHeaders()` not called | The SSE handler must call `res.flushHeaders()` immediately after setting headers, before any async operation. Without this, Express buffers the response. |
| Google OAuth: "redirect_uri_mismatch" | URI mismatch between env and Console | Verify `GOOGLE_CALLBACK_URL` in `.env` and the value in Google Cloud Console OAuth settings are character-for-character identical. |
| JWT invalid after Railway redeploy | `JWT_SECRET` changed | Never regenerate `JWT_SECRET` after launch — store it permanently in Railway Variables. Changing it invalidates all existing user sessions. |
| Cloudinary upload 401 | Wrong Cloudinary credentials | Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Cloud name is NOT the URL — it is the short identifier shown in the dashboard. |
| Compare store not persisting | localStorage blocked | Some browsers in private/incognito mode block localStorage. The store falls back gracefully to in-memory state with no error. |
| Review ratings not updating on college page | Ratings recalculation not triggered | Ensure `recalculateCollegeRatings(collegeId)` is called inside the review submission controller after saving the review document. |
| Professor `reviewCount` always 0 | Atomic increment not wired up | Add `Professor.findByIdAndUpdate(profId, { $inc: { reviewCount: 1 } })` in the professor review submit handler. |

---

## Appendix: API Endpoint Reference

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/colleges` | No | List all colleges with filters |
| `GET` | `/api/colleges/:id` | No | Single college detail |
| `GET` | `/api/colleges/:id/reviews` | No | Paginated reviews for college |
| `POST` | `/api/reviews` | Yes (verified) | Submit a review |
| `DELETE` | `/api/reviews/:id` | Yes (own review) | Delete own review |
| `GET` | `/api/professors` | No | List professors (filter by college) |
| `GET` | `/api/placements` | No | Placement records for college |
| `POST` | `/api/placements` | Yes (verified) | Submit placement data |
| `GET` | `/api/questions` | No | Q&A for a college |
| `POST` | `/api/questions` | Yes | Post a question |
| `POST` | `/api/questions/:id/answer` | Yes | Answer a question |
| `POST` | `/api/oracle/ask` | Yes | Ask Oracle (SSE stream) |
| `GET` | `/api/auth/google` | No | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | No | Google OAuth callback |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `POST` | `/api/auth/logout` | Yes | Clear session cookie |
| `GET` | `/api/health` | No | Health check |

---

*Last updated: May 2026*
