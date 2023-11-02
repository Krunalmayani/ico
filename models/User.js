
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    Fname: {
        type: String,
    },
    Lname: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    phone: {
        type: String,
    },
    password: {
        type: String,
    },
    country: {
        type: String,
    },
    role: {
        type: String,
    },
    status: {
        type: Boolean,
    }, 
    email_status: {
        type: Boolean, 
    },
    Kyc_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KYC'
    },
    referralCode: {
        type: String
    },
    referred_by: {
        type: String
    },
    token_balance: {
        type: Number,
    },
    token: {
        type: String
    },
    two_fa_verification: {
        type: Boolean,
    }, 
    two_fa_secret:{
        type: String
    },
    otp:{
        type: Number
    },
    active_status: {
        type: Number
    },
    googleId: {
        type: String,
    },
}, {
    timestamps: true,
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
  