const mongoose = require('mongoose');
const ReferralSchema = mongoose.Schema({
    User_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referred_Userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Transactions_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    referralCode: {
        type : String
    },
    Usd: { type: Number },
    purchase_token: { type: Number },
    Commission: { type: Number },
    referral_Date: { type: Date },

});

const Referral = mongoose.model('Referral', ReferralSchema);
module.exports = Referral;

