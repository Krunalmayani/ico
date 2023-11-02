
const express = require("express");
const router = express.Router();
const AuthController = require("../../controller/Api Controller/AuthController");
const speakeasy = require('speakeasy');
const User = require('../../models/User')
const qrCode = require('qrcode');
router.get("/allUser", AuthController.allUser);
router.post("/signup", AuthController.signup);
router.post("/checkOtp", AuthController.checkOtp);
router.post("/login", AuthController.login);
router.post("/google-login", AuthController.googleLogin);
router.get("/logout/:id", AuthController.logout);


router.get('/createQrcode/:id', async (req, res) => {
    try {
        var userData = await User.findById(req.params.id);
        const secret = speakeasy.generateSecret({
            email: userData.email
        });
        var qData = await qrCode.toDataURL(secret.otpauth_url);
       return res.json({ qData, secret , "status": true, "userData": userData});
    } catch (error) {
        console.error(error);
        res.json({ error: 'An error occurred' });
    }
});


router.post("/tfa_verification/:id", async (req, res) => {
      try {
        const verified = speakeasy.totp.verify({
            secret: req.body.ascii,
            encoding: 'ascii',
            token: req.body.otp,
            window: 1,
        });

        if (verified) {
            const data = await User.findByIdAndUpdate(req.params.id, {
                two_fa_verification: true,
                two_fa_secret: req.body.ascii
            });
            return res.json({"message": '2FA Verification successful', "verified": verified , "status": true, "Data": data});
        } else {
            return res.json({"message": '2FA Verification Error', "verified": verified});
        }
    } catch (err) {
        console.log(err);
        return res.json({ "message": 'Error during 2FA ' });
    }
}); 


router.post("/checkTFAotp", async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ message: "User not found" });
        }
        const verified = speakeasy.totp.verify({
            secret: user.two_fa_secret,
            encoding: 'ascii',
            token: otp,
            window: 1,
        });
        if (verified) {
            return res.json({ message: '2FA OTP is valid', verified: true , "status": true, "Data": user});
        } else {
            return res.json({ message: '2FA OTP is invalid', verified: false });
        }
    } catch (err) {
        console.log(err);
        return res.json({ message: 'Error during 2FA OTP verification' });
        
    }
});

module.exports = router;