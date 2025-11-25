const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); 


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
   return  res.status(500).json({ message: 'Server error during registration.', error: err.message });
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
        process.env.JWT_SECRET, 
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
   return  res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
};

// POST /api/auth/forgot-password
let forgotPassword = async (req, res, next) => {
  let user;
    try {
        const { email } = req.body;
//  console.log('body email',email)
        // 1. Find User by Email
         user = await User.findOne({ email });
//  console.log('user',user)
        if (!user) {
            // SECURITY: Always return a success message even if the user isn't found.
            // This prevents attackers from testing which emails are registered.
            return res.status(200).json({
                message: 'If a user with that email exists, a password reset link has been sent.',
            });
        }

        // 2. Generate Reset Token
        // Create a 32-byte token and convert it to a hex string
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // 3. Set Token and Expiry in DB
        user.resetPasswordToken = resetToken;
        // Token expires in 1 hour (3600000 milliseconds)
        user.resetPasswordExpires = Date.now() + 3600000; 

        await user.save();

        // 4. Create the Reset URL
      
        // const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        
         const resetURL = `http://localhost:8080/reset-password/${resetToken}`;

        // **NOTE:** In production, you must replace req.protocol/req.get('host') 
        // with the hardcoded frontend URL (e.g., https://your-frontend.com)

        // 5. Send Email (using your Nodemailer setup)
        const message = `You are receiving this because you (or someone else) has requested the reset of the password for your account. 
        \n\nPlease click on the following link, or paste this into your browser to complete the process within one hour: \n\n${resetURL}`;

        
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            message,
        });

        res.status(200).json({
            status: 'success',
            message: 'Reset token sent to email!',
        });

    } catch (error) {
        // If email fails, clear the token from the user
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // next(error);
      return  res.status(500).json({ message: 'Server error .', error: error.message });
    }
};

// PUT /api/auth/reset-password/:token
let resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // 1. Find User by Token and Check Expiry
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token must be greater than current time
        });

        if (!user) {
            // Token is invalid, expired, or already used
            return res.status(400).json({ 
                message: 'Password reset token is invalid or has expired.' 
            });
        }

        // 2. Hash New Password (using bcrypt)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Update User Record
        user.password = hashedPassword;
        user.resetPasswordToken = undefined; // Clear the token
        user.resetPasswordExpires = undefined; // Clear the expiry
        
        await user.save();

        // 4. Optional: Send success email (Good practice)
        // await sendEmail({ ... password changed message ... });

        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully. You can now log in.',
        });

    } catch (error) {
        // next(error);
       return res.status(500).json({ message: 'Server error .', error: err.message });
    }
};

// --- Get User by ID ---
let getUserById = async (req, res) => {
    try {
       const userId = req.user._id;
        const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires'); // Exclude sensitive fields
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Update User by ID ---
let updateUser = async (req, res) => {
    try {
         const userId = req.user._id;
         const updates = req.body;

        // Prevent users from updating fields that should only be controlled internally or by other endpoints
        const forbiddenUpdates = ['role', 'password', 'isVerified', 'resetPasswordToken', 'resetPasswordExpires'];
        const updateKeys = Object.keys(updates);
        
        const containsForbidden = updateKeys.some(key => forbiddenUpdates.includes(key));
        if (containsForbidden) {
            return res.status(400).json({ message: 'You cannot update sensitive fields like role, password, or isVerified.' });
        }

        // 2. Perform the update
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { 
                new: true, // Return the updated document
                runValidators: true // Run schema validators on the update
            }
        ).select('-password -resetPasswordToken -resetPasswordExpires'); // Exclude sensitive fields

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User profile updated successfully', user });

    } catch (error) {
        // Handle MongoDB duplicate key error (e.g., trying to update to an email that already exists)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'The provided email is already in use.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports = { 
    register, 
    login,
    forgotPassword,
    resetPassword,
    getUserById,
    updateUser,
}