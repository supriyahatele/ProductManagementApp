const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



// @desc Register new user
// @route POST /api/auth/register

let register = async (req, res) => {
  try {
    // Destructure all required fields (Validation ensures they exist)
    const { name, email, password, phone, address } = req.body; 

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (including default role and isVerified=false)
    const user = await User.create({ 
        name, 
        email, 
        password: hashedPassword,
        phone,
        address, // Address is optional, but included if provided
        role: 'user', // Set default role
        isVerified: false // Recommend setting up email verification later
    });

    res.status(201).json({
      message: 'User registered successfully. Welcome!',
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    // 500 status is for unexpected server/DB errors
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
};

// @desc Login user
// @route POST /api/auth/login

let login = async (req, res) => {
  try {
    // Validation ensures email and password are present
    const { email, password } = req.body;

    // Find user (email has been normalized by validation)
    const user = await User.findOne({ email });
    
    // Check if user exists OR if password doesn't match
    if (!user || !(await bcrypt.compare(password, user.password))) {
        // Return a generic error message for security reasons
        return res.status(400).json({ message: 'Invalid credentials (email or password).' });
    }

    // Optional: Check for account status (e.g., email verification)
    // if (!user.isVerified) {
    //     return res.status(401).json({ message: 'Account not verified. Please check your email.' });
    // }

    // Sign JWT (make sure process.env.SECRETKEY is set!)
    const payload = { userId: user._id, role: user.role };
    jwt.sign(
        payload, 
        process.env.SECRETKEY, 
        { expiresIn: "12h" }, 
        (err, token) => {
            if (err) throw err;
            return res.json({ 
                token: token,
                userId: user._id,
                role: user.role 
            });
        }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
};
module.exports = { 
    register, 
    login
}