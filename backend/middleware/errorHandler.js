/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging with more details
  console.error('❌ Global Error Handler:');
  console.error('   Name:', err.name);
  console.error('   Message:', err.message);
  console.error('   Code:', err.code);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error('   Stack:', err.stack);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `${field} already exists`;
    console.error('   Duplicate key on field:', field);
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationMessages = Object.values(err.errors || {}).map((val) => val.message);
    const message = validationMessages.join(', ');
    console.error('   Validation errors:', validationMessages);
    error = { 
      message: `Validation failed: ${message}`, 
      statusCode: 400,
      errors: Object.keys(err.errors || {}).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {}),
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
