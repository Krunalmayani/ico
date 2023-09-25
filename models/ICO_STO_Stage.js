const mongoose = require("mongoose");

const IcoStoSchema =mongoose.Schema({
    Stage_Name: {
        type: String,
        required: true
    },
    Total_Token: {
        type: String,
        required: true
    },
    Base_Token_Price: {
        type: String,
        required: true
    },
    Bonus_Percentage: {
        type: String,
        required: true
    },
    Start_Date: {
        type: Date,
        required: true
    },
    End_Date: {
        type: Date,
        required: true
    },
    Create_Date: {
        type: Date
    }
});
const ICOSTO = mongoose.model("ICOSTO", IcoStoSchema);
module.exports = ICOSTO;
