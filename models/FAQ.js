const mongoose = require("mongoose");
const FAQSchema = mongoose.Schema({
    FAQ_Question: {
        type: String,
        required: true
    },
    FAQ_Answer: {
        type: String,
        required: true
    },
},{timestamps: true});
const FAQ = mongoose.model("FAQ", FAQSchema);
module.exports = FAQ;
