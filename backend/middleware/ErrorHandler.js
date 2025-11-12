const fs = require('fs');
const path = require('path');

/**
 * Centralized Error Handling Middleware for ToolCart E-commerce
 * 
 * Features:
 * - Secure error logging without exposing sensitive data
 * - Consistent error response formats
 * - Environment-specific error details
 * - Request context logging for debugging
 * - Error categorization and proper HTTP status codes
 */

// Error categories and their default status codes
const ERROR_CATEGORIES = {
    VALIDATION_ERROR: 400,
    AUTHENTICATION_ERROR: 401,
    AUTHORIZATION_ERROR: 403,
    NOT_FOUND_ERROR: 404,
    CONFLICT_ERROR: 409,
    RATE_LIMIT_ERROR: 429,
    DATABASE_ERROR: 500,
    EXTERNAL_API_ERROR: 502,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Custom Error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500, category = 'INTERNAL_SERVER_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.category = category;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Sanitize error data to remove sensitive information
 */
const sanitizeErrorForLogging = (error, req) => {
    const sanitized = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        category: error.category || 'UNKNOWN_ERROR',
        statusCode: error.statusCode || 500,
        isOperational: error.isOperational || false,
        request: {
            method: req?.method,
            url: req?.originalUrl,
            userAgent: req?.get('User-Agent'),
            ip: req?.ip,
            userId: req?.user?._id || 'anonymous'
        }
    };

    // Remove sensitive data from request body/query
    if (req?.body) {
        const safeBody = { ...req.body };
        // Remove sensitive fields
        delete safeBody.password;
        delete safeBody.confirmPassword;
        delete safeBody.token;
        delete safeBody.otp;
        sanitized.request.body = safeBody;
    }

    if (req?.query) {
        const safeQuery = { ...req.query };
        delete safeQuery.token;
        delete safeQuery.apiKey;
        sanitized.request.query = safeQuery;
    }

    return sanitized;
};

/**
 * Log errors to file with rotation
 */
const logErrorToFile = (sanitizedError) => {
    try {
        const logDir = path.join(__dirname, '../logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = `${JSON.stringify(sanitizedError, null, 2)}\n---\n`;
        
        fs.appendFileSync(logFile, logEntry);
    } catch (fileError) {
        // Fallback to console if file logging fails
        console.error('Failed to write to error log file:', fileError.message);
        console.error('Original error:', sanitizedError);
    }
};

/**
 * Determine error category based on error type/message
 */
const categorizeError = (error) => {
    const message = error.message?.toLowerCase() || '';
    
    // Database errors
    if (error.name === 'MongooseError' || error.name === 'MongoError' || message.includes('mongodb')) {
        return { category: 'DATABASE_ERROR', statusCode: 500 };
    }
    
    // Validation errors
    if (error.name === 'ValidationError' || message.includes('validation') || message.includes('required')) {
        return { category: 'VALIDATION_ERROR', statusCode: 400 };
    }
    
    // Authentication errors
    if (message.includes('token') || message.includes('unauthorized') || message.includes('authentication')) {
        return { category: 'AUTHENTICATION_ERROR', statusCode: 401 };
    }
    
    // Authorization errors
    if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
        return { category: 'AUTHORIZATION_ERROR', statusCode: 403 };
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('does not exist')) {
        return { category: 'NOT_FOUND_ERROR', statusCode: 404 };
    }
    
    // Duplicate/conflict errors
    if (message.includes('duplicate') || message.includes('already exists') || error.code === 11000) {
        return { category: 'CONFLICT_ERROR', statusCode: 409 };
    }
    
    // Default to internal server error
    return { category: 'INTERNAL_SERVER_ERROR', statusCode: 500 };
};

/**
 * Create user-friendly error response
 */
const createErrorResponse = (error, req) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = !isProduction;
    
    const { category, statusCode } = categorizeError(error);
    
    // Standardized error response format
    const response = {
        success: false,
        message: error.message || 'An unexpected error occurred',
        errorCode: category,
        timestamp: new Date().toISOString(),
        ...(req?.id && { requestId: req.id })
    };

    // Add development-specific information
    if (isDevelopment) {
        response.stack = error.stack;
        response.details = {
            name: error.name,
            statusCode: statusCode,
            isOperational: error.isOperational
        };
    }

    // Add user-friendly messages for common errors
    switch (category) {
        case 'VALIDATION_ERROR':
            response.userMessage = 'Please check your input and try again.';
            break;
        case 'AUTHENTICATION_ERROR':
            response.userMessage = 'Please log in to access this resource.';
            break;
        case 'AUTHORIZATION_ERROR':
            response.userMessage = 'You do not have permission to perform this action.';
            break;
        case 'NOT_FOUND_ERROR':
            response.userMessage = 'The requested resource was not found.';
            break;
        case 'CONFLICT_ERROR':
            response.userMessage = 'This item already exists or conflicts with existing data.';
            break;
        case 'DATABASE_ERROR':
            response.userMessage = 'Database temporarily unavailable. Please try again later.';
            break;
        default:
            response.userMessage = 'An unexpected error occurred. Please try again later.';
    }

    return { response, statusCode };
};

/**
 * Main error handling middleware
 */
const errorHandler = (error, req, res, next) => {
    // Ensure error is an Error object
    if (!(error instanceof Error)) {
        error = new AppError(
            typeof error === 'string' ? error : 'Unknown error occurred',
            500,
            'INTERNAL_SERVER_ERROR'
        );
    }

    // Sanitize and log error
    const sanitizedError = sanitizeErrorForLogging(error, req);
    
    // Log to file in production, console in development
    if (process.env.NODE_ENV === 'production') {
        logErrorToFile(sanitizedError);
    } else {
        console.error('🚨 Error Details:', sanitizedError);
    }

    // Create response
    const { response, statusCode } = createErrorResponse(error, req);
    
    // Send response
    res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch async errors
 */
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        const error = new AppError(
            `Unhandled Promise Rejection: ${reason}`,
            500,
            'INTERNAL_SERVER_ERROR',
            false
        );
        
        console.error('🚨 Unhandled Promise Rejection:', {
            reason,
            promise,
            timestamp: new Date().toISOString()
        });
        
        // In production, you might want to gracefully shutdown
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Gracefully shutting down due to unhandled promise rejection');
            process.exit(1);
        }
    });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        console.error('🚨 Uncaught Exception:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Gracefully shutdown
        console.log('🔄 Gracefully shutting down due to uncaught exception');
        process.exit(1);
    });
};

/**
 * 404 Error handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'NOT_FOUND_ERROR'
    );
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    asyncErrorHandler,
    notFoundHandler,
    handleUnhandledRejection,
    handleUncaughtException,
    ERROR_CATEGORIES
};