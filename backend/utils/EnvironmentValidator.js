const { AppError } = require('../middleware/ErrorHandler');

/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are present and properly formatted
 * Prevents server startup with missing or invalid configuration
 */

// Define required environment variables with validation rules
const REQUIRED_ENV_VARS = {
    // Database Configuration
    MONGO_URI: {
        required: true,
        validator: (value) => value && value.startsWith('mongodb'),
        message: 'MONGO_URI must be a valid MongoDB connection string'
    },
    
    // Security & Authentication
    SECRET_KEY: {
        required: true,
        validator: (value) => value && value.length >= 32,
        message: 'SECRET_KEY must be at least 32 characters long for security'
    },
    
    // Email Configuration
    EMAIL: {
        required: true,
        validator: (value) => value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'EMAIL must be a valid email address'
    },
    
    PASSWORD: {
        required: true,
        validator: (value) => value && value.length >= 8,
        message: 'PASSWORD (email app password) must be at least 8 characters long'
    },
    
    // Frontend Configuration
    ORIGIN: {
        required: true,
        validator: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
        message: 'ORIGIN must be a valid URL starting with http:// or https://'
    },
    
    // Razorpay Configuration (required for payment functionality)
    RAZORPAY_KEY_ID: {
        required: true,
        validator: (value) => value && value.startsWith('rzp_'),
        message: 'RAZORPAY_KEY_ID must start with rzp_'
    },
    
    RAZORPAY_KEY_SECRET: {
        required: true,
        validator: (value) => value && value.length >= 20,
        message: 'RAZORPAY_KEY_SECRET must be properly configured'
    }
};

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
    NODE_ENV: 'development',
    PORT: '8001',
    PRODUCTION: 'false',
    OTP_EXPIRATION_TIME: '120000',
    LOGIN_TOKEN_EXPIRATION: '30d',
    PASSWORD_RESET_TOKEN_EXPIRATION: '2m',
    COOKIE_EXPIRATION_DAYS: '30'
};

/**
 * Validates all environment variables
 * @throws {AppError} If any required variables are missing or invalid
 */
function validateEnvironmentVariables() {
    const errors = [];
    const warnings = [];
    
    console.log('🔍 Validating environment variables...');
    
    // Check required environment variables
    for (const [varName, config] of Object.entries(REQUIRED_ENV_VARS)) {
        const value = process.env[varName];
        
        if (!value) {
            errors.push(`❌ Missing required environment variable: ${varName}`);
            continue;
        }
        
        if (config.validator && !config.validator(value)) {
            errors.push(`❌ Invalid ${varName}: ${config.message}`);
            continue;
        }
        
        // Show confirmation for sensitive variables (without exposing full value)
        if (['SECRET_KEY', 'PASSWORD', 'RAZORPAY_KEY_SECRET'].includes(varName)) {
            console.log(`   ✅ ${varName}: Present (${value.length} chars)`);
        } else if (varName === 'RAZORPAY_KEY_ID') {
            console.log(`   ✅ ${varName}: ${value.substring(0, 8)}...`);
        } else if (varName === 'EMAIL') {
            console.log(`   ✅ ${varName}: ${value.replace(/(.{2}).*@/, '$1***@')}`);
        } else {
            console.log(`   ✅ ${varName}: ${value}`);
        }
    }
    
    // Set defaults for optional variables
    for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
        if (!process.env[varName]) {
            process.env[varName] = defaultValue;
            warnings.push(`⚠️  Using default for ${varName}: ${defaultValue}`);
        }
    }
    
    // Additional validation checks
    performAdditionalValidation(warnings);
    
    // Display results
    if (warnings.length > 0) {
        console.log('\n📋 Environment Warnings:');
        warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (errors.length > 0) {
        console.log('\n💥 Environment Validation Failed:');
        errors.forEach(error => console.log(`   ${error}`));
        console.log('\n📝 Please check your .env file or environment variables');
        console.log('💡 Refer to .env.example for proper configuration format');
        
        throw new AppError(
            'Environment validation failed. Server cannot start with missing or invalid configuration.',
            500,
            'ENVIRONMENT_ERROR'
        );
    }
    
    console.log('✅ Environment validation passed!\n');
}

/**
 * Performs additional environment validation checks
 * @param {Array} warnings - Array to collect warnings
 */
function performAdditionalValidation(warnings) {
    // Check NODE_ENV consistency
    if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION !== 'true') {
        warnings.push('NODE_ENV is production but PRODUCTION is not set to true');
    }
    
    // Check for development environment with production-like settings
    if (process.env.NODE_ENV === 'development') {
        if (process.env.MONGO_URI.includes('mongodb+srv://') && 
            !process.env.MONGO_URI.includes('localhost')) {
            warnings.push('Development mode with remote MongoDB detected');
        }
    }
    
    // Check Razorpay environment consistency
    if (process.env.RAZORPAY_KEY_ID) {
        const isTestKey = process.env.RAZORPAY_KEY_ID.includes('test');
        const isProd = process.env.NODE_ENV === 'production';
        
        if (isProd && isTestKey) {
            warnings.push('Production environment with Razorpay test keys detected');
        } else if (!isProd && !isTestKey) {
            warnings.push('Development environment with Razorpay live keys detected');
        }
    }
    
    // Check OTP expiration time
    const otpTime = parseInt(process.env.OTP_EXPIRATION_TIME);
    if (otpTime > 600000) { // 10 minutes
        warnings.push('OTP expiration time is longer than 10 minutes');
    }
}

/**
 * Gets environment status for monitoring/debugging
 * @returns {Object} Environment status information
 */
function getEnvironmentStatus() {
    return {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        mongoConnected: !!process.env.MONGO_URI,
        emailConfigured: !!(process.env.EMAIL && process.env.PASSWORD),
        razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        frontendOrigin: process.env.ORIGIN,
        port: process.env.PORT
    };
}

module.exports = {
    validateEnvironmentVariables,
    getEnvironmentStatus,
    REQUIRED_ENV_VARS,
    OPTIONAL_ENV_VARS
};