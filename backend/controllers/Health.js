const { asyncErrorHandler } = require('../middleware/ErrorHandler');
const { getEnvironmentStatus } = require('../utils/EnvironmentValidator');

exports.healthCheck = asyncErrorHandler(async (req, res, next) => {
    const status = getEnvironmentStatus();
    
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        status: {
            server: 'online',
            database: status.mongoConnected ? 'connected' : 'disconnected',
            email: status.emailConfigured ? 'configured' : 'not configured',
            payments: status.razorpayConfigured ? 'configured' : 'not configured'
        }
    });
});