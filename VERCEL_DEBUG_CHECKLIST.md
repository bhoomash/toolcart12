# 🔧 VERCEL ENVIRONMENT VARIABLES CHECKLIST

## Critical Variables Required for Production:

### **Database & Backend**
```bash
MONGO_URI=mongodb+srv://your-connection-string
SECRET_KEY=your-128-char-secure-jwt-secret
NODE_ENV=production
PRODUCTION=true
```

### **Frontend Configuration**
```bash
ORIGIN=https://toolcart-gamma.vercel.app
```

### **Email Configuration**
```bash
EMAIL=your-email@gmail.com
PASSWORD=your-app-password
```

### **Razorpay Payment**
```bash
RAZORPAY_KEY_ID=rzp_live_or_test_key
RAZORPAY_KEY_SECRET=your-secret
```

### **Token Configuration**
```bash
LOGIN_TOKEN_EXPIRATION=30d
OTP_EXPIRATION_TIME=120000
COOKIE_EXPIRATION_DAYS=30
```

## ⚠️ IMPORTANT NOTES:

1. **ORIGIN** must be your Vercel domain: `https://toolcart-gamma.vercel.app`
2. **PRODUCTION** must be set to `true`
3. **NODE_ENV** must be `production`
4. **MONGO_URI** must be accessible from Vercel (check IP whitelist)

## 🔍 Debugging Steps:

1. Check Vercel Function Logs:
   - Go to Vercel Dashboard → Functions → View Logs
   
2. Test environment validation:
   - The server has environment validation that will show missing vars

3. Database connectivity:
   - Ensure MongoDB Atlas allows Vercel IPs (0.0.0.0/0 for simplicity)