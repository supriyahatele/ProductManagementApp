const express = require('express');
const { loginValidationRules, registerValidationRules } = require('../middlewares/authValidations');
const { register, login } = require('../controllers/userController');
const userRouter = express.Router();


// POST /api/register
// The validation chain runs BEFORE the register controller function
userRouter.post('/register', registerValidationRules, register);

// POST /api/login
// The validation chain runs BEFORE the login controller function
userRouter.post('/login', loginValidationRules, login);

module.exports = userRouter;