# 🚀 Complete Deployment Guide - Separate Frontend & Backend

## Overview
This guide will help you deploy your MERN e-commerce application with separate Vercel deployments for frontend and backend.

## Deployment Order
**Important:** Deploy in this exact order to avoid CORS issues.

### Step 1: Deploy Backend First 🔧

```bash
cd backend
vercel login
vercel --prod
```

**Backend Environment Variables (Set in Vercel Dashboard):**
```env
MONGO_URI=mongodb+srv://bhoomashr_db_user:Bhoo%402006@cluster0.xjeiqej.mongodb.net/toolcart?retryWrites=true&w=majority&appName=Cluster0
SECRET_KEY=807c61c9804428e3c4fbfc558645ff499de035d72ed953024fd854c0d507f89ad7e7ba734ac12f19097b280dbb915aeb7e9fb89377092ffe31dd31b2d5844d1f
EMAIL=bhoomashr@gmail.com
PASSWORD=xxql petv jalb taqx
RAZORPAY_KEY_ID=rzp_test_R5uZgmenogCy4j
RAZORPAY_KEY_SECRET=iou4q509iexeJOlJNCpq7gBd
RAZORPAY_WEBHOOK_SECRET=webhook_secret_123
NODE_ENV=production
PRODUCTION=true
ORIGIN=https://your-frontend-app.vercel.app
PORT=8001
LOGIN_TOKEN_EXPIRATION=30d
OTP_EXPIRATION_TIME=120000
PASSWORD_RESET_TOKEN_EXPIRATION=2m
COOKIE_EXPIRATION_DAYS=30
```

### Step 2: Update Frontend Configuration 🎨

Update `frontend/.env.production`:
```env
# Replace with your actual backend URL from Step 1
REACT_APP_BASE_URL=https://your-backend-app.vercel.app
```

### Step 3: Deploy Frontend 🌐

```bash
cd frontend
vercel --prod
```

### Step 4: Update Backend CORS ⚙️

After frontend deployment:
1. Go to backend project in Vercel Dashboard
2. Settings → Environment Variables
3. Update `ORIGIN` to: `https://your-frontend-app.vercel.app`
4. Redeploy backend: `vercel --prod`

## Configuration Files Created

### Backend (`backend/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Frontend (`frontend/vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Root (`vercel.json`) - For Frontend Only:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Benefits of Separate Deployments

✅ **Independent Scaling**: Scale frontend and backend separately
✅ **Faster Deployments**: Deploy only what changed
✅ **Better Error Isolation**: Issues in one don't affect the other
✅ **Different Domains**: Can use different custom domains
✅ **Independent Teams**: Frontend and backend teams can deploy independently

## Important Notes

1. **CORS Configuration**: Ensure backend ORIGIN matches frontend URL
2. **Environment Variables**: Set all required variables in Vercel Dashboard
3. **MongoDB Atlas**: Allow connections from anywhere (0.0.0.0/0)
4. **API Base URL**: Update frontend to point to backend URL
5. **Cookies**: Cross-origin cookies work with proper CORS setup

## Testing After Deployment

1. ✅ Test user registration with OTP
2. ✅ Test user login with role-based redirection
3. ✅ Test admin login → admin dashboard
4. ✅ Test regular user login → home page
5. ✅ Test API endpoints work correctly
6. ✅ Verify payment integration (if using Razorpay)

## Troubleshooting

**CORS Errors**: Check ORIGIN environment variable in backend
**API Not Found**: Verify REACT_APP_BASE_URL in frontend
**Authentication Issues**: Check JWT secret and cookie settings
**Build Failures**: Review build logs in Vercel Dashboard