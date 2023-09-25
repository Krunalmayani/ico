const ICOSTO = require('../models/ICO_STO_Stage');

module.exports = async (req, res, next) => {
    try {
        const currentDate = new Date();

        // Find the active stage where Start_Date is less than or equal to the current date
        // and End_Date is greater than or equal to the current date
        const activeStage = await ICOSTO.findOne({
            Start_Date: { $lte: currentDate },
            End_Date: { $gte: currentDate }
        });

        if (activeStage) {
            // If an active stage is found, store it in res.locals
            res.locals.activeStageData = activeStage;
        } else {
            // If no active stage is found, find the latest expired stage
            const latestExpiredStage = await ICOSTO.findOne({
                End_Date: { $lt: currentDate },
            }).sort({ End_Date: -1 }); // Sort by End_Date in descending order to get the latest expired stage

            res.locals.activeStageData = latestExpiredStage;
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching active ICO/STO stage data',
            error: error.message
        });
    }
};
