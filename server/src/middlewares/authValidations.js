const { body, validationResult } = require('express-validator');
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

module.exports = { 
    registerValidationRules, 
    loginValidationRules 
};