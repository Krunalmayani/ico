
const mongoose = require("mongoose");

const CryptoAddressSchema = mongoose.Schema({
    Crypto_Address: {
        type: String,
        required: true
    },
    Crypto_Type: {
        type: String,
        required: true
    },
    Block_explorer: {
        type: String,
    },
  
},{timestamps: true});

const CryptoAddress = mongoose.model("CryptoAddress", CryptoAddressSchema);
module.exports = CryptoAddress;
