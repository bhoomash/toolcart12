const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { AppError, asyncErrorHandler } = require('../middleware/ErrorHandler');

// Initialize Razorpay
console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? `Present (${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...)` : 'Missing');
console.log('Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? `Present (${process.env.RAZORPAY_KEY_SECRET.substring(0, 10)}...)` : 'Missing');

let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials are missing');
    }
    
    // Validate key format
    if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
        throw new Error('Invalid Razorpay Key ID format');
    }
    
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        timeout: 60000, // 60 second timeout
    });
    console.log('Razorpay instance created successfully with timeout');
} catch (error) {
    throw new AppError('Failed to initialize Razorpay payment service', 500, 'EXTERNAL_API_ERROR');
}

// Create Razorpay order
exports.createPaymentOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', orderId, receipt } = req.body;
        
        console.log('Payment order request:', { amount, currency, orderId, receipt });
        console.log('Environment check - Key ID:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');

        // Validate required parameters
        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: 'Invalid amount. Amount must be a positive number.',
                error: 'INVALID_AMOUNT'
            });
        }

        // Validate amount limits (Razorpay has limits)
        const roundedAmount = Math.round(amount);
        if (roundedAmount < 100) { // Minimum 1 INR in paise
            return res.status(400).json({
                message: 'Amount too small. Minimum amount is ₹1 (100 paise).',
                error: 'AMOUNT_TOO_SMALL'
            });
        }
        
        if (roundedAmount > 1500000000) { // Razorpay limit: 15 crores in paise
            return res.status(400).json({
                message: 'Amount too large. Maximum amount exceeded.',
                error: 'AMOUNT_TOO_LARGE'
            });
        }

        // Check if Razorpay instance exists, reinitialize if needed
        if (!razorpay) {
            console.log('Razorpay instance not found, reinitializing...');
            try {
                razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });
                console.log('Razorpay instance reinitialized successfully');
            } catch (initError) {
                return res.status(500).json({
                    message: 'Payment service initialization failed',
                    error: 'RAZORPAY_INIT_ERROR'
                });
            }
        }

        // Generate a unique receipt if not provided
        const finalReceipt = receipt || `order_rcptid_${orderId || Date.now()}`;

        const options = {
            amount: roundedAmount, // Use the validated rounded amount
            currency,
            receipt: finalReceipt,
            payment_capture: 1, // Auto capture payment
        };

        console.log('Creating Razorpay order with options:', options);
        
        let razorpayOrder;
        try {
            // Add a timeout wrapper for the Razorpay API call
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Razorpay API timeout')), 30000); // 30 second timeout
            });
            
            const orderPromise = razorpay.orders.create(options);
            
            razorpayOrder = await Promise.race([orderPromise, timeoutPromise]);
            console.log('Razorpay order created successfully:', razorpayOrder);
        } catch (razorpayError) {
            console.error('Specific Razorpay API error:', {
                message: razorpayError.message,
                statusCode: razorpayError.statusCode,
                error: razorpayError.error,
                stack: razorpayError.stack
            });
            
            // If it's a timeout or network error, try once more with a simpler approach
            if (razorpayError.message.includes('timeout') || razorpayError.message.includes('status')) {
                console.log('Retrying with simplified options...');
                try {
                    const simplifiedOptions = {
                        amount: roundedAmount,
                        currency: 'INR',
                        receipt: `retry_${Date.now()}`,
                    };
                    razorpayOrder = await razorpay.orders.create(simplifiedOptions);
                    console.log('Retry successful:', razorpayOrder);
                } catch (retryError) {
                    console.error('Retry also failed:', retryError.message);
                    
                    // For development: return a mock response if Razorpay is completely failing
                    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
                        console.log('Using mock Razorpay response for development');
                        razorpayOrder = {
                            id: `order_mock_${Date.now()}`,
                            amount: roundedAmount,
                            amount_due: roundedAmount,
                            amount_paid: 0,
                            attempts: 0,
                            created_at: Math.floor(Date.now() / 1000),
                            currency: 'INR',
                            entity: 'order',
                            notes: [],
                            offer_id: null,
                            receipt: finalReceipt,
                            status: 'created'
                        };
                    } else {
                        throw razorpayError; // Throw original error in production
                    }
                }
            } else {
                throw razorpayError;
            }
        }

        res.status(200).json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
            receipt: razorpayOrder.receipt,
            ...(orderId && { orderId: orderId })
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        
        // Handle different types of errors
        if (error.statusCode) {
            // Razorpay API error
            return res.status(error.statusCode === 400 ? 400 : 500).json({ 
                message: 'Payment service error',
                error: error.error?.description || error.message || 'Failed to create payment order'
            });
        } else {
            // Generic error
            return res.status(500).json({ 
                message: 'Internal server error',
                error: 'Failed to create payment order'
            });
        }
    }
};

// Verify payment signature
exports.verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            orderId 
        } = req.body;

        // Create signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update order status to paid
            const order = await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: 'paid',
                    paymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id,
                    razorpaySignature: razorpay_signature,
                    paymentMethod: 'razorpay',
                    paidAt: new Date()
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                order: order
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

// Handle payment failure
exports.handlePaymentFailure = async (req, res) => {
    try {
        const { orderId, error } = req.body;

        // Update order status to failed
        await Order.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: 'failed',
                paymentError: error
            }
        );

        res.status(200).json({
            success: true,
            message: 'Payment failure recorded'
        });
    } catch (error) {
        console.error('Error handling payment failure:', error);
        res.status(500).json({
            message: 'Failed to record payment failure',
            error: error.message
        });
    }
};

// Webhook handler for Razorpay events
exports.webhookHandler = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest('hex');

        if (signature === expectedSignature) {
            const event = req.body.event;
            const paymentEntity = req.body.payload.payment.entity;

            switch (event) {
                case 'payment.captured':
                    // Handle successful payment
                    console.log('Payment captured:', paymentEntity.id);
                    break;
                case 'payment.failed':
                    // Handle failed payment
                    console.log('Payment failed:', paymentEntity.id);
                    break;
                default:
                    console.log('Unhandled event:', event);
            }

            res.status(200).json({ status: 'ok' });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const payment = await razorpay.payments.fetch(paymentId);
        
        res.status(200).json({
            success: true,
            payment: payment
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message
        });
    }
};