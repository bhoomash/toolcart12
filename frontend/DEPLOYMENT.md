# 🚀 Frontend Deployment Guide (Vercel)

## Prerequisites
- Backend already deployed to Vercel
- Backend URL available
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`

## Deployment Steps

### 1. Update API Configuration
Before deploying, update the API URL in `.env.production`:
```bash
# Replace with your actual backend URL
REACT_APP_BASE_URL=https://your-backend-app.vercel.app
```

### 2. Deploy Frontend to Vercel
```bash
cd frontend
vercel login
vercel --prod
```

### 3. Update Backend CORS Settings
After frontend deployment, update the backend's ORIGIN environment variable:
1. Go to your backend project in Vercel Dashboard
2. Settings → Environment Variables
3. Update `ORIGIN` to your frontend URL: `https://your-frontend-app.vercel.app`
4. Redeploy the backend

## Build Configuration
The frontend is configured with:
- ESLint warnings disabled for production builds
- Source maps disabled for smaller bundle size
- Static build optimization

## Environment Variables
No environment variables needed for frontend deployment (API URL is in .env.production)

## Troubleshooting
- If build fails due to ESLint errors, they're already disabled in the build script
- Check that REACT_APP_BASE_URL is correctly set
- Verify the backend URL is accessible

## Post-Deployment
1. Test the login flow
2. Verify API calls work correctly
3. Check that role-based redirection works (admin → dashboard, user → home)