import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  console.log('📝 Registration attempt:', { username, email, role: role || 'not provided' });

  // Validation
  if (!username || !email || !password) {
    console.error('❌ Missing required fields:', { username: !!username, email: !!email, password: !!password });
    return res.status(400).json({
      success: false,
      message: 'Please provide username, email, and password',
    });
  }

  // Check if user already exists
  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      console.error('❌ User already exists:', { 
        email: userExists.email === email, 
        username: userExists.username === username 
      });
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username',
      });
    }
  } catch (error) {
    console.error('❌ Error checking existing user:', error);
    throw error;
  }

  // Validate role if provided
  const validRoles = ['viewer', 'editor', 'admin'];
  const userRole = role && validRoles.includes(role.toLowerCase()) 
    ? role.toLowerCase() 
    : 'viewer';
  
  console.log('✅ Role validated:', { provided: role, final: userRole });

  // Create user with detailed error handling
  let user;
  try {
    console.log('🔄 Creating user in database...');
    user = await User.create({
      username,
      email,
      password,
      role: userRole,
    });
    console.log('✅ User created successfully:', { _id: user._id, username: user.username, email: user.email, role: user.role });
  } catch (error) {
    console.error('❌ User creation failed:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      console.error('   Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${validationErrors}`,
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error('   Duplicate key error on field:', field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    
    // Re-throw other errors to be handled by errorHandler middleware
    console.error('   Full error:', error);
    throw error;
  }

  // Generate token
  try {
    const token = generateToken(user._id, user.role);
    console.log('✅ Token generated successfully');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw error;
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Check for user and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User account is deactivated',
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Generate token
  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user,
    },
  });
});
