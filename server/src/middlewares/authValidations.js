const { body, validationResult,param } = require('express-validator');
const User = require('../models/userModel');
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            // Return only the error messages (without unnecessary info)
            errors: errors.array().map(err => err.msg)
        });
    }
    
    // If validation passes, move to the next middleware/controller
    next();
};

// ----------------------------------------------------
// B. Validation Rules for Registration
// ----------------------------------------------------
const registerValidationRules = [
    // 1. Name validation
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.'),

    // 2. Email validation
    body('email')
        .isEmail().withMessage('Invalid email format.')
        .normalizeEmail() // Sanitizer: Converts to lowercase and removes dots
       .custom(async (value, { req }) => {
            const existingUser = await User.findOne({ email: value });          
            if (existingUser) {
                throw new Error('User with this email already exists.');
            }
            return true;
        }),

    // 3. Password validation
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
        
    // 4. Phone validation
    body('phone')
        .isMobilePhone('any').withMessage('Invalid phone number format.')
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits.'),

    // 5. Run the general error handler
    validate
];

// ----------------------------------------------------
// C. Validation Rules for Login
// ----------------------------------------------------
const loginValidationRules = [
    // 1. Email validation
    body('email')
        .isEmail().withMessage('Invalid email format.').normalizeEmail(),

    // 2. Password validation
    body('password')
        .isLength({ min: 1 }).withMessage('Password is required.'),
        
    // 3. Run the general error handler
    validate
];

// --- Validation Rules for forgotPassword ---
const forgotPasswordValidationRules = [
    // 1. Email validation: Ensure email is present and in a valid format
    body('email')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(), // Sanitizer: Converts to lowercase and removes dots

    // 2. Run the general error handler
    validate
];

// --- Validation Rules for resetPassword ---
const resetPasswordValidationRules = [
 
    // 1. Token validation: Check the token parameter (req.params)
    param('token')
        .isLength({ min: 32 }).withMessage('Invalid reset token format.'),

    // 2. Password validation: Ensure new password meets security requirements
    body('password')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.'),
        
    // 3. Password confirmation (Optional but highly recommended)
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password.');
            }
            return true;
        }),

    // 4. Run the general error handler
    validate
];


let updateUserValidation = [
    // Validate 'name' (optional, but if present, must be a string and not empty)
    body('name')
        .optional()
        .isString()
        .withMessage('Name must be a string')
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty'),

    // Validate 'email' (optional, but if present, must be a valid email and not empty)
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),

    // Validate 'phone' (optional, but if present, must be a number and 10 digits)
    body('phone')
        .optional()
        .isNumeric()
        .withMessage('Phone number must be numeric')
        .isLength({ min: 10, max: 10 })
        .withMessage('Phone number must be 10 digits'),

    // Validate 'isVerified' (optional, must be a boolean)
    body('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified must be a boolean'),
    validate
];
module.exports = { 
    registerValidationRules, 
    loginValidationRules ,
     forgotPasswordValidationRules, 
    resetPasswordValidationRules,
    updateUserValidation 
};