# Deploy ManufactureHub

## One-Click Deploy (Railway)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template?referralCode=&template=https://github.com/nicomaggioli/ManufactureHub)

Click the button above. Railway will provision PostgreSQL automatically and prompt you for the required environment variables.

---

## Manual Deploy (3 steps)

**1. Run the deploy script**

```bash
./scripts/setup-railway.sh
```

**2. Copy your backend URL from the Railway dashboard**

Run `railway open` to get it.

**3. Deploy the frontend to GitHub Pages**

Set the `VITE_API_URL` secret in your GitHub repo settings (`Settings > Secrets > Actions`) to the Railway backend URL, then push to `main`.

---

## Required Environment Variables

| Variable | Description | Set by |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Railway (auto) |
| `JWT_SECRET` | Signing key for auth tokens (min 32 chars) | You |
| `NODE_ENV` | `production` | Deploy script |
| `PORT` | API port (default `3001`) | Deploy script |
| `CORS_ORIGINS` | Allowed frontend origins, comma-separated | You |

All other variables (Clerk, Stripe, S3, etc.) are optional. See `apps/api/.env.production.example` for the full list.

---

## Connecting Frontend to Backend

After the backend is deployed on Railway:

1. Copy the deployment URL from Railway (e.g., `https://manufacturehub-api-production.up.railway.app`)
2. In your GitHub repo, go to **Settings > Secrets and variables > Actions**
3. Add a secret: `VITE_API_URL` = your Railway backend URL
4. Push to `main` or manually trigger the deploy workflow
5. Update `CORS_ORIGINS` on Railway to match your GitHub Pages URL:
   ```bash
   railway variables set CORS_ORIGINS=https://nicomaggioli.github.io
   ```
