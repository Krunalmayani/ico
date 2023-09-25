const mongoose = require("mongoose");
const WithdrawalSchema = mongoose.Schema({
    User_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Ethereum_Address: {
        type: String,
    },
    Withdrawal_Tokens: {
        type: String,
    },
    Withdrawal_date: {
        type: Date,
    },
    Status: {
        type : String,
    }
});
const Withdrawal = mongoose.model("Withdrawal", WithdrawalSchema);
module.exports = Withdrawal;