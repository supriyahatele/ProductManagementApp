const express = require('express');
const { loginValidationRules, registerValidationRules, forgotPasswordValidationRules, resetPasswordValidationRules, updateUserValidation } = require('../middlewares/authValidations');
const { register, login, forgotPassword, resetPassword, getUserById, updateUser } = require('../controllers/userController');
const { auth } = require('../middlewares/authMiddleware');
const userRouter = express.Router();


// POST /api/register
userRouter.post('/register', registerValidationRules, register);

// POST /api/login
userRouter.post('/login', loginValidationRules, login);

userRouter.post('/forget-password', forgotPasswordValidationRules, forgotPassword);

userRouter.put('/reset-password/:token', resetPasswordValidationRules, resetPassword);

userRouter.get('/profile',auth, getUserById);

userRouter.put('/profile',auth, updateUserValidation, updateUser);

module.exports = userRouter;