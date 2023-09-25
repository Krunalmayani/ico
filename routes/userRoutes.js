const express = require("express");
const routes = express.Router();
var userController = require("../controller/userController");
const CryptoAddress = require('../models/CryptoAddress');
var passport = require("passport")
const speakeasy = require('speakeasy');
const User = require('../models/User')
const qrCode = require('qrcode');

function requireSession(req, res, next) {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
        return res.redirect('/login');
    }
    next();
}

// routes.post("/creatsession", passport.authenticate('user', { failureRedirect: '/' }), userController.dashbordsession);

routes.post('/creatsession', (req, res, next) => {
    passport.authenticate('user', async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/login');
        }

        req.logIn(user, async (err) => {
            if (err) {
                return next(err);
            }
            if (!user.email_status) {
                // User's email is not verified, redirect to email verification
                if (!user.email_status && user.token === req.body.token) {
                    user.email_status = true;
                    await user.save();

                    req.flash('success', 'Email verified successfully.');
                    return res.redirect('/dashboard');
                }
                return res.redirect('/signup');

            } else if (user.email_status === true && user.two_fa_verification === true) {
                // Email is verified, but 2FA is not set up, redirect to 2FA setup
                return res.redirect('/TwoFAverification');
            } else {

                // Email is verified, 2FA is enabled, redirect to the dashboard

                return res.redirect('/dashboard');
            }
        });
    })(req, res, next);
});
routes.get("/", userController.user)
routes.get("/login", userController.login);
routes.get("/signup", userController.signup);
routes.get("/dashboard", requireSession, userController.dashboard);
routes.get("/buytokens", requireSession, userController.buytokens)
routes.get('/getRandomCryptoAddress', requireSession, userController.getRandomCryptoAddress);
routes.get("/transactions", requireSession, userController.transactions);
routes.get("/profile/:id", requireSession, userController.profile);
routes.post('/userProfileUpdate', userController.updateUserProfile);
routes.get("/ICODistribution", requireSession, userController.ICODistribution);
routes.get("/kycApplication", requireSession, userController.kycApplication);
routes.get("/kyc-form", requireSession, userController.kycform);
routes.get("/kycVerification", requireSession, userController.kycVerification)
routes.get("/Referral/:id", requireSession, userController.Referral);
routes.get("/Withdrawal/:id", requireSession, userController.Withdrawal);
routes.get("/FAQs", requireSession, userController.FAQs);
routes.post("/UserSignUpData",requireSession, userController.UserSignUpData);
routes.post("/userPasswordUpdate",requireSession ,userController.userPasswordUpdate);
routes.post("/transactionData",requireSession, userController.transactionData);
routes.post("/addWithdrawalRequest",requireSession, userController.addWithdrawalRequest)
routes.get("/forgotPassword", userController.forgotPassword);
routes.post("/SendEmail", userController.SendEmail)
routes.get("/changepassword", userController.changepassword)
routes.post("/ChangeAccountPassword", userController.ChangeAccountPassword)
routes.get("/TwoFAverification", async (req, res) => {
    return res.render('TwoFAverification')
});
routes.post("/twofa_verification", async (req, res) => {
    try {
        var verified = speakeasy.totp.verify({
            secret: req.body.ascii,
            encoding: 'ascii',
            token: req.body.otp,
            window: 1,
        });
        console.log(verified, "user  varification  update in  database");
        if (verified) {
            let data = await User.findByIdAndUpdate(req.body.User_id, {
                two_fa_verification: true,
                two_fa_secret: req.body.ascii
            })
            return res.redirect("back")
        } else {
            res.status(500).json({ error: 'An error occurred' });
            console.log("error: unknown");
        }
    }
    catch (err) {
        console.log(err);
    }
})

routes.get('/your-fetch-route', async (req, res) => {

    // your-fetch-route    jQuery user karene Qrcode mokale lo chhe profile ma

    try {
        var userData = await User.findById(req.session.passport.user);
        const secret = speakeasy.generateSecret({
            email: userData.email
        });
        var qData = await qrCode.toDataURL(secret.otpauth_url);
        // console.log(secret);
        res.json({ qData, secret });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});
routes.post("/checkLoginTwoFAcode", userController.checkLoginTwoFAcode)

routes.get('/logout', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during session destruction:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        res.clearCookie('Session');
        res.redirect('/login');
    } catch (error) {
        console.error('Error during logout:', error);
        res.redirect('/');
    }
});

module.exports = routes;