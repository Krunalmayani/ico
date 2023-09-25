const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    Fname: {
        type: String,
        required: true
    },
    Lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    createTime: {
        type: Date,
    },
    role: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    }, 
    email_status: {
        type: Boolean,
        required: true
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
    }
});
const User = mongoose.model("User", UserSchema);
module.exports = User;