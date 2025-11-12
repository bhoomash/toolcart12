const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

// Error handling middleware for validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Common validation rules
const commonValidators = {
    // MongoDB ObjectId validation
    objectId: (field = 'id') => 
        param(field)
            .custom(isValidObjectId)
            .withMessage(`${field} must be a valid MongoDB ObjectId`),

    // Email validation
    email: (field = 'email') =>
        body(field)
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),

    // Password validation
    password: (field = 'password') =>
        body(field)
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    // Name validation
    name: (field = 'name') =>
        body(field)
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage(`${field} must be between 2 and 50 characters`)
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage(`${field} must contain only letters and spaces`),

    // Required string validation
    requiredString: (field, minLength = 1, maxLength = 255) =>
        body(field)
            .trim()
            .notEmpty()
            .withMessage(`${field} is required`)
            .isLength({ min: minLength, max: maxLength })
            .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`),

    // Optional string validation
    optionalString: (field, maxLength = 255) =>
        body(field)
            .optional()
            .trim()
            .isLength({ max: maxLength })
            .withMessage(`${field} must not exceed ${maxLength} characters`),

    // Number validation
    positiveNumber: (field) =>
        body(field)
            .isNumeric()
            .withMessage(`${field} must be a number`)
            .custom(value => value > 0)
            .withMessage(`${field} must be greater than 0`),

    // Integer validation
    positiveInteger: (field) =>
        body(field)
            .isInt({ min: 1 })
            .withMessage(`${field} must be a positive integer`),

    // Boolean validation
    boolean: (field) =>
        body(field)
            .optional()
            .isBoolean()
            .withMessage(`${field} must be a boolean value`),

    // URL validation
    url: (field) =>
        body(field)
            .optional()
            .isURL()
            .withMessage(`${field} must be a valid URL`),

    // Phone number validation
    phone: (field = 'phone') =>
        body(field)
            .optional()
            .matches(/^[\+]?[1-9][\d]{0,15}$/)
            .withMessage('Please provide a valid phone number'),

    // Pagination validation
    pagination: () => [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ]
};

// Auth validation rules
const authValidators = {
    register: [
        commonValidators.name('name'),
        commonValidators.email('email'),
        commonValidators.password('password'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                }
                return true;
            }),
        handleValidationErrors
    ],

    login: [
        commonValidators.email('email'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        handleValidationErrors
    ],

    forgotPassword: [
        commonValidators.email('email'),
        handleValidationErrors
    ],

    resetPassword: [
        commonValidators.password('password'),
        body('token')
            .notEmpty()
            .withMessage('Reset token is required'),
        handleValidationErrors
    ],

    verifyOtp: [
        body('userId')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('otp')
            .isLength({ min: 4, max: 4 })
            .withMessage('OTP must be 4 digits')
            .isNumeric()
            .withMessage('OTP must contain only numbers'),
        handleValidationErrors
    ],

    resendOtp: [
        body('user')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        handleValidationErrors
    ]
};

// Product validation rules
const productValidators = {
    create: [
        commonValidators.requiredString('title', 2, 100),
        commonValidators.requiredString('description', 10, 1000),
        commonValidators.positiveNumber('price'),
        commonValidators.positiveNumber('discountPercentage'),
        commonValidators.positiveInteger('stockQuantity'),
        body('brand')
            .custom(isValidObjectId)
            .withMessage('Valid brand ID is required'),
        body('category')
            .custom(isValidObjectId)
            .withMessage('Valid category ID is required'),
        body('thumbnail')
            .isURL()
            .withMessage('Thumbnail must be a valid URL'),
        body('images')
            .isArray({ min: 1 })
            .withMessage('At least one image is required'),
        body('images.*')
            .isURL()
            .withMessage('All images must be valid URLs'),
        commonValidators.boolean('isDeleted'),
        handleValidationErrors
    ],

    update: [
        commonValidators.objectId('id'),
        commonValidators.optionalString('title', 100),
        commonValidators.optionalString('description', 1000),
        body('price')
            .optional()
            .isNumeric()
            .custom(value => value > 0)
            .withMessage('Price must be a positive number'),
        body('discountPercentage')
            .optional()
            .isNumeric()
            .custom(value => value >= 0 && value <= 100)
            .withMessage('Discount percentage must be between 0 and 100'),
        body('stockQuantity')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Stock quantity must be a non-negative integer'),
        body('brand')
            .optional()
            .custom((value) => {
                if (value && !isValidObjectId(value)) {
                    throw new Error('Brand ID must be valid');
                }
                return true;
            }),
        body('category')
            .optional()
            .custom((value) => {
                if (value && !isValidObjectId(value)) {
                    throw new Error('Category ID must be valid');
                }
                return true;
            }),
        body('thumbnail')
            .optional()
            .isURL()
            .withMessage('Thumbnail must be a valid URL'),
        body('images')
            .optional()
            .isArray()
            .withMessage('Images must be an array'),
        body('images.*')
            .optional()
            .isURL()
            .withMessage('All images must be valid URLs'),
        body('isDeleted')
            .optional()
            .isBoolean()
            .withMessage('isDeleted must be a boolean'),
        handleValidationErrors
    ],

    getById: [
        commonValidators.objectId('id'),
        handleValidationErrors
    ],

    getAll: [
        ...commonValidators.pagination(),
        query('brand')
            .optional()
            .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(id => isValidObjectId(id));
                }
                return isValidObjectId(value);
            })
            .withMessage('Brand IDs must be valid'),
        query('category')
            .optional()
            .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(id => isValidObjectId(id));
                }
                return isValidObjectId(value);
            })
            .withMessage('Category IDs must be valid'),
        query('search')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search term must be between 1 and 100 characters'),
        handleValidationErrors
    ]
};

// User validation rules
const userValidators = {
    update: [
        commonValidators.objectId('id'),
        commonValidators.optionalString('name', 50),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        commonValidators.phone('phone'),
        handleValidationErrors
    ],

    getById: [
        commonValidators.objectId('id'),
        handleValidationErrors
    ]
};

// Cart validation rules
const cartValidators = {
    create: [
        body('user')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('product')
            .custom(isValidObjectId)
            .withMessage('Valid product ID is required'),
        body('quantity')
            .isInt({ min: 1, max: 10 })
            .withMessage('Quantity must be between 1 and 10'),
        handleValidationErrors
    ],

    update: [
        commonValidators.objectId('id'),
        body('quantity')
            .isInt({ min: 1, max: 10 })
            .withMessage('Quantity must be between 1 and 10'),
        handleValidationErrors
    ],

    delete: [
        commonValidators.objectId('id'),
        handleValidationErrors
    ],

    getByUserId: [
        commonValidators.objectId('id'),
        handleValidationErrors
    ]
};

// Address validation rules
const addressValidators = {
    create: [
        body('user')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        commonValidators.requiredString('street', 5, 100),
        commonValidators.requiredString('city', 2, 50),
        commonValidators.requiredString('state', 2, 50),
        commonValidators.requiredString('country', 2, 50),
        body('zipCode')
            .matches(/^[0-9]{5,10}$/)
            .withMessage('Zip code must be 5-10 digits'),
        commonValidators.optionalString('landmark', 100),
        handleValidationErrors
    ],

    update: [
        commonValidators.objectId('id'),
        commonValidators.optionalString('street', 100),
        commonValidators.optionalString('city', 50),
        commonValidators.optionalString('state', 50),
        commonValidators.optionalString('country', 50),
        body('zipCode')
            .optional()
            .matches(/^[0-9]{5,10}$/)
            .withMessage('Zip code must be 5-10 digits'),
        commonValidators.optionalString('landmark', 100),
        handleValidationErrors
    ]
};

// Review validation rules
const reviewValidators = {
    create: [
        body('user')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('product')
            .custom(isValidObjectId)
            .withMessage('Valid product ID is required'),
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        commonValidators.requiredString('comment', 10, 500),
        handleValidationErrors
    ],

    update: [
        commonValidators.objectId('id'),
        body('rating')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        commonValidators.optionalString('comment', 500),
        handleValidationErrors
    ]
};

// Order validation rules
const orderValidators = {
    create: [
        body('user')
            .custom(isValidObjectId)
            .withMessage('Valid user ID is required'),
        body('item')
            .isArray({ min: 1 })
            .withMessage('At least one item is required'),
        body('item.*.product')
            .custom(isValidObjectId)
            .withMessage('Valid product ID is required for each item'),
        body('item.*.quantity')
            .isInt({ min: 1, max: 10 })
            .withMessage('Quantity must be between 1 and 10 for each item'),
        body('item.*.price')
            .isNumeric()
            .custom(value => value > 0)
            .withMessage('Price must be positive for each item'),
        body('total')
            .isNumeric()
            .custom(value => value > 0)
            .withMessage('Total amount must be positive'),
        body('address')
            .notEmpty()
            .withMessage('Shipping address is required'),
        handleValidationErrors
    ]
};

// Brand and Category validation rules
const brandCategoryValidators = {
    create: [
        commonValidators.requiredString('name', 2, 50),
        handleValidationErrors
    ],

    update: [
        commonValidators.objectId('id'),
        commonValidators.optionalString('name', 50),
        handleValidationErrors
    ]
};

module.exports = {
    authValidators,
    productValidators,
    userValidators,
    cartValidators,
    addressValidators,
    reviewValidators,
    orderValidators,
    brandCategoryValidators,
    commonValidators,
    handleValidationErrors
};