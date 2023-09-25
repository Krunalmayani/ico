
const express = require("express");
const router = express.Router();
const userController = require("../controller/KycController ");
function requireSession(req, res, next) {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
        return res.redirect('/login');
    }
    next();
}

router.get("/kycApplication", userController.kycApplication);
router.get("/kyc-form", userController.kycform);
router.post("/Kyc_Data", userController.Kyc_Data);
router.get("/kycListDetail/:id", userController.kycListDetail);
router.get("/Approve/:id", userController.Approve);
router.get("/Cancelled/:id", userController.Cancelled);

module.exports = router;      