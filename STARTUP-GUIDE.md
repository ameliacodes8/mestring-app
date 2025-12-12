# Starting the Mestring App - Quick Guide

## Prerequisites

- Make sure you're in the project root: `cd ~/repos/mestring-app`

## Step 1: Start the API Server (Backend)

Open a terminal (Terminal 1):

```bash
cd ~/repos/mestring-app/apps/api
npm run dev
```

✅ Wait for: "API listening on http://localhost:3001"
❌ If it fails, check that your .env file exists in apps/api/

Keep this terminal open!

## Step 2: Start the Web Server (Frontend)

Open a NEW terminal (Terminal 2):

```bash
cd ~/repos/mestring-app/apps/web
npm run dev
```

✅ Wait for: "Local: http://localhost:5173/"
Keep this terminal open!

## Step 3: Open in Browser

Go to: http://localhost:5173

## Troubleshooting

### API won't start

- Check if port 3001 is already in use
- Verify your DATABASE_URL in apps/api/.env is correct

### Web app shows "Connection refused"

- Make sure BOTH terminals are running
- API must be on http://localhost:3001
- Web must be on http://localhost:5173

### Database connection errors

- Verify your Supabase connection string is correct
- Make sure you're using the Session Pooler (port 5432 or 6543)

## Quick Test

Once both servers are running:

1. Open http://localhost:5173 in browser
2. You should see "Mestring" header with tabs
3. Click "Templates" tab
4. Try creating a new chore template

## Stopping the Servers

In each terminal:

- Press `Ctrl+C` to stop the server
- Or just close the terminal windows

## Notes

- Auth is currently DISABLED for testing (commented out in apps/api/src/index.js)
- Remember to re-enable it later: uncomment `app.use(authMiddleware);`
- Both servers auto-restart when you save code changes (nodemon/vite)

---

Last updated: December 12, 2025
