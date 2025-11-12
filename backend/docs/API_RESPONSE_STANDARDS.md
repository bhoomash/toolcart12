# API Response Format Standardization

## Overview

This document outlines the standardized response format implemented across all API endpoints to ensure consistency, improve frontend integration, and enhance developer experience.

## Standard Response Structure

### Success Responses

All successful API responses follow this structure:

```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {}, // Response payload
  "meta": {}, // Optional metadata (pagination, etc.)
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "SPECIFIC_ERROR_CODE",
  "userMessage": "User-friendly error message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Response Formatter Usage

### Import the Response Formatter

```javascript
const { 
  sendSuccess, 
  sendError, 
  sendCreated,
  sendAuthSuccess,
  sendNotFound 
} = require('../utils/ResponseFormatter');
```

### Common Response Types

#### 1. Success Response
```javascript
// Basic success
return sendSuccess(res, userData, 'User retrieved successfully');

// With custom status code
return sendSuccess(res, data, 'Custom message', 201);
```

#### 2. Created Response
```javascript
return sendCreated(res, newUser, 'User created successfully', newUser._id);
```

#### 3. Authentication Response
```javascript
return sendAuthSuccess(res, userObject, 'Login successful', 200);
```

#### 4. Error Responses
```javascript
// Not found
return sendNotFound(res, 'User');

// Custom error
return sendError(res, 'Custom error message', 400, 'CUSTOM_ERROR');
```

## Response Examples

### 1. User Registration (Success)

**Endpoint**: `POST /auth/signup`

**Response**:
```json
{
  "success": true,
  "message": "Account created successfully! Please check your email for the verification OTP.",
  "data": {
    "user": {
      "_id": "60f7c8d4b5c6e123456789",
      "email": "user@example.com",
      "isVerified": false,
      "isAdmin": false
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Login (Success)

**Endpoint**: `POST /auth/login`

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "60f7c8d4b5c6e123456789",
      "email": "user@example.com",
      "isVerified": true,
      "isAdmin": false
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. Get Categories (Success)

**Endpoint**: `GET /categories`

**Response**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "60f7c8d4b5c6e123456789",
      "name": "Electronics",
      "description": "Electronic items"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 4. User Not Found (Error)

**Endpoint**: `GET /users/:id`

**Response**:
```json
{
  "success": false,
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "userMessage": "The requested resource was not found.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 5. Validation Error

**Response**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "userMessage": "Please check your input and try again.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Codes Reference

| Error Code | Description | HTTP Status | User Message |
|------------|-------------|-------------|--------------|
| `VALIDATION_ERROR` | Input validation failed | 400 | Please check your input and try again |
| `AUTHENTICATION_ERROR` | Login failed | 401 | Please log in to access this resource |
| `AUTHORIZATION_ERROR` | Permission denied | 403 | You do not have permission to perform this action |
| `USER_NOT_FOUND` | User not found | 404 | The requested resource was not found |
| `OTP_EXPIRED` | OTP has expired | 400 | Your verification code has expired |
| `CONFLICT_ERROR` | Resource already exists | 409 | This item already exists |
| `DATABASE_ERROR` | Database operation failed | 500 | Database temporarily unavailable |
| `INTERNAL_ERROR` | Server error | 500 | An unexpected error occurred |

## Migration Guide

### Before (Inconsistent)
```javascript
// Old way - inconsistent formats
res.status(200).json(userData);
res.status(201).json({ ...user, message: "Created" });
res.status(404).json({ error: "Not found" });
```

### After (Standardized)
```javascript
// New way - consistent format
return sendSuccess(res, userData, 'User retrieved successfully');
return sendCreated(res, user, 'User created successfully');
return sendNotFound(res, 'User');
```

## Benefits

1. **Consistency**: All endpoints return data in the same format
2. **Frontend Integration**: Predictable response structure for easier frontend development
3. **Error Handling**: Standardized error codes and messages
4. **User Experience**: User-friendly error messages
5. **Debugging**: Better error tracking with timestamps and request IDs
6. **API Documentation**: Clear response format for API documentation

## Best Practices

1. Always use the response formatter functions
2. Provide descriptive success messages
3. Use appropriate HTTP status codes
4. Include relevant metadata when needed
5. Don't expose sensitive information in error messages
6. Use consistent error codes across similar operations

## Implementation Status

✅ **Completed Controllers**:
- User controller (getById, updateById)
- Auth controller (signup, login endpoints)
- Category controller (getAll)
- Error Handler middleware

🔄 **Remaining Controllers**:
- Product, Order, Cart, Brand, Address, Review, Wishlist, Payment

The standardization is being implemented gradually to ensure stability and proper testing.