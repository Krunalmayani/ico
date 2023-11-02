
const mongoose = require('mongoose');
const TransactionSchema = mongoose.Schema({
    User_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referred_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Referral'
    },
    Usd: { type: Number },
    Method: { type: String },
    Token: { type: Number }, 
    Bonus: { type: Number }, 
    Pay_Amount: { type: Number }, 
    Total_Token: { type: Number }, 
    Crypto_Address: { type: String },
    Pay_Transaction_id: { type: String },
    Transaction_submit_Time: {
        type: Date
    },
    Status: { type: String }
},{
    timestamps: true,
});
const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;