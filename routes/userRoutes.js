const express = require("express");
const routes = express.Router();
var userController = require("../controller/userController");
const CryptoAddress = require('../models/CryptoAddress');
var passport = require("passport")
const speakeasy = require('speakeasy');
const User = require('../models/User')
const nodemailer = require('nodemailer'); // Import the nodemailer library
const Referral = require('../models/referral'); // Import your Referral model
const WebSetting = require('../models/WebSetting'); // Import your WebSetting model

const qrCode = require('qrcode');

function requireSession(req, res, next) {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
        return res.redirect('/login');
    }
    next();
}

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
                if (!user.email_status && user.token === req.body.token) {
                    user.email_status = true;
                    await user.save();
                    req.flash('success', 'Email verified successfully.');
                    return res.redirect('/dashboard');
                }
                return res.redirect('/signup');
            } else if (user.email_status === true && user.two_fa_verification === true) {
                return res.redirect('/TwoFAverification');
            } else {
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
routes.post("/UserSignUpData", userController.UserSignUpData);
routes.get("/DisabledTwoFA/:id", requireSession, userController.DisabledTwoFA)
routes.post("/userPasswordUpdate", requireSession, userController.userPasswordUpdate);
routes.post("/transactionData", requireSession, userController.transactionData);
routes.post("/addWithdrawalRequest", requireSession, userController.addWithdrawalRequest)
routes.get("/forgotPassword", userController.forgotPassword);
routes.post("/SendEmail", userController.SendEmail)
routes.get("/changepassword", userController.changepassword)
routes.post("/ChangeAccountPassword", userController.ChangeAccountPassword)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require("../models/Transaction")

routes.post('/StripePaymentData', async (req, res) => {
    try {
        // Create a Stripe customer and charge

        const customer = await stripe.customers.create({
            email: req.body.email,
            source: 'tok_visa', // Use a valid test token
        });


        const charge = await stripe.charges.create({
            amount: 100 * req.body.Usd, // Change this to the desired amount in cents
            currency: 'usd',
            customer: customer.id,
        });


        const currentDate = new Date();
        req.body.Transaction_submit_Time = currentDate;
        req.body.Status = 'Approved';
        req.body.Method = "Card";
        req.body.Pay_Transaction_id = charge.id;
        const transactionsdata = await Transaction.create(req.body);

        
        if (transactionsdata) {
            req.flash('success', 'Card Transaction successfully');

            const referredUser = await User.findById(req.body.User_id);

            if (referredUser.referred_by == null) {
                
                await User.findByIdAndUpdate(
                    { _id: req.body.User_id },
                    { $inc: { token_balance: req.body.Total_Token } }
                );

                // Send email notification
                const useremail = await User.findById(req.body.User_id); 
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                const transport = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EmailAddress,
                        pass: process.env.EmailAppKEY,
                    },
                });
                const info = await transport.sendMail({
                    from: 'vishaltesting14@gmail.com',
                    to: useremail.email,
                    subject: 'Welcome to [ Website Name] - Your Gateway to Digital Tokens!',
                    html: `
                        <html>
                        <head></head>
                        <body>
                            <div class="container">
                                <h1 class="label">Confirmation of Your Token Purchase on [Your Website Name]</h1>
                                <p class="label">Dear [User's Name],</p>
                                <p>We are delighted to confirm your recent token purchase on [Your Website Name]. Your transaction details are as follows:</p>
                                <p><strong>Purchase Amount (in USD):</strong> ${transactionsdata.Usd} $</p>
                                <p><strong>Payment Method:</strong> ${transactionsdata.Method}</p>
                                <p><strong>Token Amount:</strong> ${transactionsdata.Token} ${webcoin.Tokensymbol}</p>
                                <p><strong>Bonus Tokens:</strong> ${transactionsdata.Bonus} ${webcoin.Tokensymbol}</p>
                                <p><strong>Total Tokens Received:</strong> ${transactionsdata.Total_Token} ${webcoin.Tokensymbol}</p>
                                <p>Your purchase has been successfully processed, and the tokens have been added to your account. You can now explore the exciting possibilities that come with owning these tokens on our platform.</p>
                                <p>If you have any questions about your purchase or need further assistance, please don't hesitate to contact our support team at [Support Email Address]. We're here to provide any information or guidance you may require.</p>
                                <p>Thank you for choosing [Your Website Name] for your token purchase. We appreciate your trust and look forward to your continued involvement in our community.</p>
                                <p>Best regards,</p>
                                <p>[Your Name]</p>
                            </div>
                        </body>
                        </html>
                    `,
                });
            } else {
                const idrefferal = '64e9a0fdc365527caca5058a';
                const bonusPercentage = await WebSetting.findById(idrefferal);
                const commission = parseFloat(req.body.Total_Token) * (bonusPercentage.Referral_Commission / 100);

                // Create and save the referral record
                const referral = new Referral({
                    User_id: referredUser._id,
                    referred_Userid: transactionsdata.User_id,
                    Transactions_id: transactionsdata._id,
                    Usd: req.body.Usd,
                    purchase_token: req.body.Total_Token,
                    Commission: commission,
                    referral_Date: currentDate,
                    referralCode: referredUser.referred_by,
                });
 
                await referral.save();


                await User.findByIdAndUpdate(
                    { _id: req.body.User_id },
                    { $inc: { token_balance: req.body.Total_Token } }
                );

                await User.findByIdAndUpdate(
                    { _id: referredUser._id },
                    { $inc: { token_balance: commission } }
                );

                const useremail = await User.findById(req.body.User_id);
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                const transport = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EmailAddress,
                        pass: process.env.EmailAppKEY,
                    },
                });
                const info = await transport.sendMail({
                    from: 'vishaltesting14@gmail.com',
                    to: useremail.email,
                    subject: 'Testing mail',
                    html: `
                        <html>
                        <head></head>
                        <body>
                            <div class="container">
                                <h1 class="label">Confirmation of Your Token Purchase on [Your Website Name]</h1>
                                <p class="label">Dear [User's Name],</p>
                                <p>We are delighted to confirm your recent token purchase on [Your Website Name]. Your transaction details are as follows:</p>
                                <p><strong>Purchase Amount (in USD):</strong> ${transactionsdata.Usd} $</p>
                                <p><strong>Payment Method:</strong> ${transactionsdata.Method}</p>
                                <p><strong>Token Amount:</strong> ${transactionsdata.Token} ${webcoin.Tokensymbol}</p>
                                <p><strong>Bonus Tokens:</strong> ${transactionsdata.Bonus} ${webcoin.Tokensymbol}</p>
                                <p><strong>Total Tokens Received:</strong> ${transactionsdata.Total_Token} ${webcoin.Tokensymbol}</p>
                                <p>Your purchase has been successfully processed, and the tokens have been added to your account. You can now explore the exciting possibilities that come with owning these tokens on our platform.</p>
                                <p>If you have any questions about your purchase or need further assistance, please don't hesitate to contact our support team at [Support Email Address]. We're here to provide any information or guidance you may require.</p>
                                <p>Thank you for choosing [Your Website Name] for your token purchase. We appreciate your trust and look forward to your continued involvement in our community.</p>
                                <p>Best regards,</p>
                                <p>[Your Name]</p>
                            </div>
                        </body>
                        </html>
                    `,
                });
            }
        }
        res.redirect('back');
    } catch (error) {
        req.flash('success', 'Error in transaction please try again ');
        res.redirect('back');
    }
});


const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated() && req.user.email_status === true && req.user.two_fa_verification === true) {
      return next();
    } else {
      // Redirect to the login page or perform other actions as needed
      res.redirect('/login');
    }
  };
  
  routes.get('/TwoFAverification', isLoggedIn, (req, res) => {
    // If the user reaches this point, it means they are authenticated and meet the criteria
    res.render('TwoFAverification');
  });
  

routes.post("/twofa_verification", async (req, res) => {
    try {
        var verified = speakeasy.totp.verify({
            secret: req.body.ascii,
            encoding: 'ascii',
            token: req.body.otp,
            window: 1,
        });
        if (verified) {
            let data = await User.findByIdAndUpdate(req.body.User_id, {
                two_fa_verification: true,
                two_fa_secret: req.body.ascii
            })
            req.flash('success', ' 2FA Verification on successfully');
            return res.redirect("back")
        } else {
            req.flash('success', ' Error During Verification please try again');
            return res.redirect("back")
        }
    }
    catch (err) {
        console.log(err);
    }
})

routes.post("/checkLoginTwoFAcode", userController.checkLoginTwoFAcode)
routes.get('/your-fetch-route', async (req, res) => {
    try {
        var userData = await User.findById(req.session.passport.user);
        const secret = speakeasy.generateSecret({
            email: userData.email
        });
        var qData = await qrCode.toDataURL(secret.otpauth_url);
        res.json({ qData, secret });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

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