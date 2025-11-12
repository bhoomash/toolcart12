const express=require('express')
const router=express.Router()
const authController=require("../controllers/Auth")
const { verifyToken } = require('../middleware/VerifyToken')
const { authValidators } = require('../middleware/ValidationMiddleware')
const { 
  authRateLimiter, 
  passwordResetRateLimiter, 
  otpRateLimiter, 
  createAccountRateLimiter 
} = require('../middleware/RateLimiter')

router
    .post("/signup", createAccountRateLimiter, authValidators.register, authController.signup)
    .post('/login', authRateLimiter, authValidators.login, authController.login)
    .post("/verify-otp", otpRateLimiter, authValidators.verifyOtp, authController.verifyOtp)
    .post("/resend-otp", otpRateLimiter, authValidators.resendOtp, authController.resendOtp)
    .post("/forgot-password", passwordResetRateLimiter, authValidators.forgotPassword, authController.forgotPassword)
    .post("/reset-password", passwordResetRateLimiter, authValidators.resetPassword, authController.resetPassword)
    .get("/check-auth", verifyToken, authController.checkAuth)
    .get('/logout', authController.logout)


module.exports=router