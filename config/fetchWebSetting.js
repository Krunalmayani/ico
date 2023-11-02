const WebSetting = require('../models/WebSetting');

module.exports = async (req, res, next) => {
    try {
        const webSetting = await WebSetting.findOne().sort({ _id: -1 }).limit(1);
        res.locals.webSettingData = webSetting;
        
        // Set STRIPE_SECRET_KEY in res.locals
        res.locals.STRIPE_SECRET_KEY = webSetting.Stripe_Secret_Key;
        next();
    } catch (error) {
        res.status(500).json({   
            success: false,
            message: 'An error occurred while fetching WebSetting data',
            error: error.message
        });
    }
};
