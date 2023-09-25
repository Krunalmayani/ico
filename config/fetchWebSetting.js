const WebSetting = require('../models/WebSetting');

module.exports = async (req, res, next) => {
    try {
        const webSetting = await WebSetting.findOne().sort({ _id: -1 }).limit(1);
        res.locals.webSettingData = webSetting; // This makes the data available to all views
        next();
    } catch (error) {
        res.status(500).json({   
            success: false,
            message: 'An error occurred while fetching WebSetting data',
            error: error.message
        });
    }
};
