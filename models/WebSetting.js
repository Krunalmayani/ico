const mongoose = require("mongoose");
const WebSettingSchema = mongoose.Schema({
    Referral_Commission: {
        type: Number
    },
    Minimum_Purchase: {
        type: Number,
    },
    Token_Name: {
        type: String, 
        required: true,
    },
    Private_Policy: {
        type: String,
        required: true,

    },
    TermsAndConditions: {
        type: String,
        required: true,

    },
    CopyRightWord: {
        type: String,
        required: true,

    },
    WhitePaperLink: {
        type: String,
        required: true,

    },
    HomePageLink: {
        type: String,
    },
    Tokensymbol: {
        type: String,

    },
    FaviconImage: {
        type: String,

    },
    DashboardLogo: {
        type: String,

    },
    SignUpLoginLogo: {
        type: String,

    },
});
const WebSetting = mongoose.model("WebSetting", WebSettingSchema);
module.exports = WebSetting;