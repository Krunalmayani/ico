
const mongoose = require('mongoose');

const KYCSchema = mongoose.Schema({
    User_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    First_Name: { type: String, required: true },
    Last_Name: { type: String, required: true },
    Email: { type: String, required: true },
    Phone: { type: String, required: true },
    DOB: { type: Date, required: true },
    Address_1: { type: String, required: true },
    Address_2: String,
    City: { type: String, required: true },
    State: { type: String, required: true },
    Nationality: { type: String, required: true },
    Zip_Code: { type: String, required: true },
    KYC_Doc: String,
    KYC_Front_Image: String,
    KYC_Back_Image: String,
    KYC_submit_Time: {
        type: Date
    },
    Status: { type: String }
},{
    timestamps: true,
});

const KYC = mongoose.model('KYC', KYCSchema);

module.exports = KYC;
