// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');



const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET';

let auth = async (req, res, next) => {
    
    let token;

    // 1. Check if token exists in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = await userModel.findById(decoded.userId).select('-password'); 

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports={auth}