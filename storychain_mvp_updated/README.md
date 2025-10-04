# StoryChain MVP

Minimal StoryChain starter: simple backend (Express + OpenAI) + static frontend (HTML/JS).
Includes a MetaMask-based "Donate" button so you can monetize via crypto wallets (on client-side).

> ⚠️ THIS IS A STARTER TEMPLATE. Replace placeholders in `.env` and follow the security notes below.

## Project Structure

- backend/
  - package.json
  - server.js
  - .env.example (copy to .env and fill)
- frontend/
  - index.html
  - app.js
  - styles.css

## Quick start (local)

1. **Backend**
   - Copy `.env.example` to `backend/.env` and fill `OPENAI_API_KEY` and `RECEIVER_ADDRESS`.
   - From the `backend/` folder:
     ```bash
     npm install
     node server.js
     ```
   - Server will run on `http://localhost:3000` by default.

2. **Frontend**
   - Open `frontend/index.html` in your browser (or serve it via a static host).
   - The frontend expects the backend API at the same origin; if serving separately, edit `app.js` `API_BASE` variable.

## Deployment hints

### GitHub
- Create a repository and push code.
- Do NOT push `.env` or secrets. Add `.env` to `.gitignore`.

### Vercel (frontend)
- You can deploy the `frontend/` static site easily on Vercel; just connect your GitHub repo.
- For an SPA or Next.js, configure accordingly.

### Railway (backend)
- Railway / Render / Heroku can run the `backend/` service. Use the `start` script in `package.json`.
- Set environment variables in Railway dashboard: `OPENAI_API_KEY`, `RECEIVER_ADDRESS`, `DATABASE_URL` (optional).

## Crypto monetization (client-side)
This template includes a simple MetaMask-triggered donation flow:
- The frontend `Donate` button will prompt the user's Web3 wallet to send ETH to the `RECEIVER_ADDRESS`.
- **Pros:** No server-side payment integration required; user pays directly to your wallet.
- **Cons:** Google Play in-app purchases requirement applies if you make a native mobile app that sells digital goods. For web, client-side crypto payments are OK but check local regulations and tax rules.

## Important security notes
- **Never** expose `OPENAI_API_KEY` in the frontend. Keep it on the server.
- Do not commit `.env` to Git.
- Consider using a proper DB, authentication, and moderation for production.

## Files included
This repo is minimal and intended to get you running quickly. Extend it with auth, moderation, better UI, and payment flows when ready.


---

## Deployment: Vercel (frontend) + Railway (backend) — step-by-step

### Backend (Railway)
1. Create a Railway project and link your GitHub repo (select the backend/ directory).
2. In Railway dashboard, set the following environment variables for the service:

```
OPENAI_API_KEY=sk-REPLACE_WITH_YOUR_OPENAI_KEY
RECEIVER_ADDRESS=0xYOUR_ETHEREUM_ADDRESS
DATABASE_URL=./db.sqlite   # optional
PORT=3000
THRESHOLD=6                # how many contributions per chain
```

_Example (Railway environment variables panel)_
```
+--------------------------------+----------------------------------------+
| Variable                       | Value                                  |
+--------------------------------+----------------------------------------+
| OPENAI_API_KEY                 | sk-REPLACE_WITH_YOUR_OPENAI_KEY         |
| RECEIVER_ADDRESS               | 0xAbC123...                             |
| DATABASE_URL                   | ./db.sqlite                             |
| PORT                           | 3000                                    |
+--------------------------------+----------------------------------------+
```

3. Deploy the service. Railway will set a public URL like `https://your-backend.up.railway.app`.

### Frontend (Vercel)
1. Go to Vercel and import your GitHub repo. Set the Root Directory to `frontend/` for a static site.
2. In Vercel project settings, add an environment variable (if your backend is on a different domain) or you can keep `API_BASE` blank to use the same origin.

If your backend URL is `https://your-backend.up.railway.app`, set in Vercel's **Environment Variables**:

```
API_BASE=https://your-backend.up.railway.app
```

_Example (Vercel environment variables panel)_
```
+------------+--------------------------------------------+
| Name       | Value                                      |
+------------+--------------------------------------------+
| API_BASE   | https://your-backend.up.railway.app        |
+------------+--------------------------------------------+
```

3. Deploy. After deployment, the frontend will fetch `/api/config` from your backend to get the `receiverAddress`, so you do not need to hardcode your wallet address into the client.

### Notes on environment variables 'screenshots'
I cannot provide real GUI screenshots here, but the text boxes you should fill in look like the ASCII tables above. On Railway and Vercel dashboards you'll find a form to add "Environment Variables" (Name / Value); paste the exact variable names and values as shown.

---

## GitHub Actions CI

A basic GitHub Actions workflow is included at `.github/workflows/ci.yml`. It:
- Installs backend dependencies (Node 18)
- Runs a basic check to ensure dependencies installed

You can extend this workflow to run tests, linters, or build steps for frontend.

