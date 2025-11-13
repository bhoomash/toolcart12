# 🚀 Backend Deployment Guide (Vercel)

## Prerequisites
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- Vercel account connected to your GitHub

## Deployment Steps

### 1. Deploy Backend to Vercel
```bash
cd backend
vercel login
vercel --prod
```

### 2. Set Environment Variables in Vercel Dashboard
Go to your deployed backend project in Vercel Dashboard → Settings → Environment Variables:

**Required Environment Variables:**
```
MONGO_URI=mongodb+srv://your-connection-string
SECRET_KEY=your-jwt-secret-key
EMAIL=your-email@gmail.com
PASSWORD=your-email-app-password
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
PRODUCTION=true
ORIGIN=https://your-frontend-app.vercel.app
PORT=8001
LOGIN_TOKEN_EXPIRATION=30d
OTP_EXPIRATION_TIME=120000
PASSWORD_RESET_TOKEN_EXPIRATION=2m
COOKIE_EXPIRATION_DAYS=30
```

### 3. Note Your Backend URL
After deployment, copy your backend URL (e.g., `https://your-backend-app.vercel.app`)

## Important Notes
- The backend will be deployed as a serverless function
- Environment variables must be set in Vercel Dashboard
- Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Update the ORIGIN environment variable with your actual frontend URL after deploying frontend

## Troubleshooting
- If deployment fails, check the build logs in Vercel Dashboard
- Ensure all required dependencies are in package.json
- Verify environment variables are set correctly