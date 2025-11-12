/**
 * Standardized API Response Formatter
 * Provides consistent response structure across all API endpoints
 * Improves frontend integration and API usability
 */

/**
 * Success response format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data,
        ...(meta && { meta }),
        timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Error response format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {string} errorCode - Application specific error code
 * @param {Array} errors - Detailed error array (validation errors, etc.)
 */
const sendError = (res, message = 'An error occurred', statusCode = 400, errorCode = null, errors = null) => {
    const response = {
        success: false,
        message,
        ...(errorCode && { errorCode }),
        ...(errors && { errors }),
        timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Success response for resource creation
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @param {string} resourceId - ID of created resource
 */
const sendCreated = (res, data, message = 'Resource created successfully', resourceId = null) => {
    return sendSuccess(res, data, message, 201, { resourceId });
};

/**
 * Success response for paginated data
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
    return sendSuccess(res, data, message, 200, { pagination });
};

/**
 * Success response with no content
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendNoContent = (res, message = 'Operation completed successfully') => {
    return sendSuccess(res, null, message, 204);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 * @param {string} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
    return sendError(res, message, 400, 'VALIDATION_ERROR', errors);
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name that was not found
 */
const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
    return sendError(res, message, 403, 'FORBIDDEN');
};

/**
 * Conflict response (e.g., duplicate resource)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendConflict = (res, message = 'Resource already exists') => {
    return sendError(res, message, 409, 'CONFLICT');
};

/**
 * Server error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} errorCode - Application specific error code
 */
const sendServerError = (res, message = 'Internal server error', errorCode = 'INTERNAL_ERROR') => {
    return sendError(res, message, 500, errorCode);
};

/**
 * Custom response format with authentication info
 * Specifically for auth endpoints that need to include user data and tokens
 * @param {Object} res - Express response object
 * @param {Object} user - User data
 * @param {string} token - JWT token (optional, if cookies are used)
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendAuthSuccess = (res, user, message = 'Authentication successful', statusCode = 200, token = null) => {
    const response = {
        success: true,
        message,
        data: {
            user,
            ...(token && { token })
        },
        timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Response format for payment operations
 * @param {Object} res - Express response object
 * @param {Object} paymentData - Payment related data
 * @param {string} message - Success message
 * @param {string} paymentStatus - Payment status
 */
const sendPaymentSuccess = (res, paymentData, message = 'Payment processed successfully', paymentStatus = 'completed') => {
    return sendSuccess(res, paymentData, message, 200, { paymentStatus });
};

module.exports = {
    sendSuccess,
    sendError,
    sendCreated,
    sendPaginated,
    sendNoContent,
    sendValidationError,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendConflict,
    sendServerError,
    sendAuthSuccess,
    sendPaymentSuccess
};