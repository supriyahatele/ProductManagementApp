const mongoose = require('mongoose');
let userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number, required: true },
    role: {
        type: String,
        enum: ['user', 'admin', 'seller'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    addresses: [{
        street: { type: String },
        city: { type: String },
        pincode: { type: Number }
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // References your Product Model
    }],
}, {

    timestamps: true
});

module.exports = mongoose.model('User', userSchema);