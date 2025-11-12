require("dotenv").config()

// Validate environment variables before server startup
const { validateEnvironmentVariables } = require('./utils/EnvironmentValidator');
validateEnvironmentVariables();

const express=require('express')
const cors=require('cors')
const morgan=require("morgan")
const helmet=require("helmet")
const cookieParser=require("cookie-parser")
const authRoutes=require("./routes/Auth")
const productRoutes=require("./routes/Product")
const orderRoutes=require("./routes/Order")
const cartRoutes=require("./routes/Cart")
const brandRoutes=require("./routes/Brand")
const categoryRoutes=require("./routes/Category")
const userRoutes=require("./routes/User")
const addressRoutes=require('./routes/Address')
const reviewRoutes=require("./routes/Review")
const wishlistRoutes=require("./routes/Wishlist")
const paymentRoutes=require("./routes/Payment")
const healthRoutes=require("./routes/Health")
const { connectToDB } = require("./database/db")
const { 
    errorHandler, 
    notFoundHandler, 
    handleUnhandledRejection, 
    handleUncaughtException 
} = require('./middleware/ErrorHandler')


// server init
const server=express()

// Set up global error handlers
handleUnhandledRejection()
handleUncaughtException()

// database connection
connectToDB()


// middlewares
const allowedOrigins = [
    process.env.ORIGIN,
    'https://toolcart-gamma.vercel.app',
    'https://your-vercel-app.vercel.app', // Keep as fallback
    'http://localhost:3000',
    'http://localhost:3001'
];

server.use(cors({
    origin: function (origin, callback) {
        // Only log CORS origin in development environment
        if (process.env.NODE_ENV === 'development') {
            console.log('CORS Origin:', origin);
        }
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow all Vercel deployments
        if (origin.includes('vercel.app')) {
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (origin.includes('localhost')) {
            return callback(null, true);
        }
        
        // Check allowed origins list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Only log blocked origins in development environment
        if (process.env.NODE_ENV === 'development') {
            console.log('CORS blocked origin:', origin);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

server.use(express.json())
server.use(cookieParser())
server.use(morgan("tiny"))

// Apply security headers with environment-specific configuration
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Security Headers Configuration
 * - Production: Full security headers with restrictive CSP
 * - Development: Minimal headers to avoid development issues
 * 
 * Security Features:
 * - Content Security Policy (CSP) - Prevents XSS attacks
 * - HTTP Strict Transport Security (HSTS) - Forces HTTPS
 * - X-Frame-Options - Prevents clickjacking
 * - X-Content-Type-Options - Prevents MIME sniffing
 * - Referrer Policy - Controls referrer information
 * - Cross-Origin Policies - Isolates resources
 */
server.use(helmet({
    // Production: Enable COEP for better security isolation
    // Development: Disable to avoid compatibility issues
    crossOriginEmbedderPolicy: isProduction ? { policy: "require-corp" } : false,
    
    // Content Security Policy - restrictive in production, disabled in development
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    } : false,
    
    // Additional security headers for production
    crossOriginOpenerPolicy: isProduction ? { policy: "same-origin" } : false,
    crossOriginResourcePolicy: isProduction ? { policy: "same-origin" } : false,
    
    // Always enable these security headers
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: isProduction ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}))

// Security middlewares
const { sanitizeInput } = require('./middleware/Sanitizer')
const { generalRateLimiter } = require('./middleware/RateLimiter')

// Apply general rate limiting to all routes
server.use(generalRateLimiter)

// Apply input sanitization
server.use(sanitizeInput)

// Health check endpoint for monitoring
server.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// routeMiddleware
server.use("/auth",authRoutes)
server.use("/users",userRoutes)
server.use("/products",productRoutes)
server.use("/orders",orderRoutes)
server.use("/cart",cartRoutes)
server.use("/brands",brandRoutes)
server.use("/categories",categoryRoutes)
server.use("/address",addressRoutes)
server.use("/reviews",reviewRoutes)
server.use("/wishlist",wishlistRoutes)
server.use("/payments",paymentRoutes)
server.use("/api",healthRoutes)

// 404 handler for undefined routes
server.use(notFoundHandler)

// Global error handling middleware (must be last)
server.use(errorHandler)

server.get("/",(req,res)=>{
    res.status(200).json({message:'running'})
})

const PORT = process.env.PORT || 8001;
server.listen(PORT,()=>{
    console.log(`server [STARTED] ~ http://localhost:${PORT}`);
})