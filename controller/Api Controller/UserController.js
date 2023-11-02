const { STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } = process.env;

const stripe = require('stripe')(STRIPE_SECRET_KEY)

const createCustomer = async (req, res) => {

    try {

        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.email,
        });

        res.status(200).send(customer);

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

const addNewCard = async (req, res) => {

    try {

        const {
            customer_id,
            card_Name,
            card_ExpYear,
            card_ExpMonth,
            card_Number,
            card_CVC,
        } = req.body;

        const card_token = await stripe.tokens.create({
            card: {
                name: card_Name,
                number: card_Number,
                exp_year: card_ExpYear,
                exp_month: card_ExpMonth,
                cvc: card_CVC
            }
        });

        const card = await stripe.customers.createSource(customer_id, {
            source: `${card_token.id}`
        });

        res.status(200).send({ card: card.id });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}

const createCharges = async (req, res) => {

    try {

        const createCharge = await stripe.charges.create({
            receipt_email: 'tester@gmail.com',
            amount: parseInt(req.body.amount) * 100,
            currency: 'INR',
            card: req.body.card_id,
            customer: req.body.customer_id
        });

        res.status(200).send(createCharge);

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }

}


module.exports = {
    createCustomer,
    addNewCard,
    createCharges
}
const Transaction = require("../../models/Transaction")
const User = require("../../models/User")
const WebSetting = require("../../models/WebSetting")
const ICOSTO = require("../../models/ICO_STO_Stage")
const Referral = require("../../models/referral")
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { request } = require('../../routes/API/user');

module.exports.transactiondata = async (req, res) => {
    try {
        const currentDateTime = new Date();
        req.body.Transaction_submit_Time = currentDateTime;
        req.body.Status = 'Pending';

        const transactionsdata = await Transaction.create(req.body);

        if (transactionsdata) {
            const referredUser = await User.findById(req.body.User_id);

            if (referredUser.referred_by == null) {
                useremail = await User.findById(req.body.User_id);
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                var transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EmailAddress,
                        pass: process.env.EmailAppKEY,
                    },
                });
                let info = transport.sendMail({
                    from: "vishaltesting14@gmail.com",
                    to: useremail.email,
                    subject: "Welcome to [ Website Name] - Your Gateway to Digital Tokens!",
                    html: `
                        <html>
                        <head>
                        </head>
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
                return res.json({ "success": "data added successfully" });
            } else {
                const currentDate = new Date();
                const bonusPercentage = await ICOSTO.findOne({
                    Start_Date: { $lte: currentDate },
                    End_Date: { $gte: currentDate },
                });
                const commission = parseFloat(req.body.Total_Token) * (bonusPercentage.Bonus_Percentage / 100);

                const referral = new Referral({
                    User_id: referredUser._id,
                    referred_Userid: transactionsdata.User_id,
                    Transactions_id: transactionsdata._id,
                    Usd: req.body.Usd,
                    purchase_token: req.body.Total_Token,
                    Commission: commission,
                    referral_Date: currentDateTime,
                    referralCode: referredUser.referred_by,
                });
                await referral.save();
                transactionsdata.referred_id = referral._id;
                await transactionsdata.save();
                useremail = await User.findById(req.body.User_id);
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                var transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EmailAddress,
                        pass: process.env.EmailAppKEY,
                    },
                });
                let info = transport.sendMail({
                    from: "vishaltesting14@gmail.com",
                    to: useremail.email,
                    subject: "testing mail",
                    html: `
                        <html>
                        <head>
                        </head>
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
                return res.json({ "success": "data added successfully" });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "error": "An error occurred" });
    }
}

const Withdrawal = require('../../models/Withdrawal')

module.exports.WithdrawalTokens = async (req, res) => {
    try {
        const { User_id, Ethereum_Address, Withdrawal_Tokens } = req.body;

        const withdrawalAmount = parseFloat(Withdrawal_Tokens);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            return res.json({ "success": false, "message": "Invalid withdrawal amount" });
        }

        const Withdrawal_date = new Date();
        const Status = 'Pending';

        const formattedWithdrawalTokens = withdrawalAmount.toFixed(8);
        const withdrawalRequest = await Withdrawal.create({
            User_id,
            Ethereum_Address,
            Withdrawal_Tokens: formattedWithdrawalTokens,
            Withdrawal_date,
            Status,
        });

        if (withdrawalRequest) {
            // Deduct tokens from the user's balance
            const user = await User.findByIdAndUpdate(
                User_id,
                { $inc: { token_balance: -withdrawalAmount } },
                { new: true }
            );

            if (user) {
                // Send an email notification
                const useremail = await User.findById(User_id);
                const webcoin = await WebSetting.findById('64e9a0fdc365527caca5058a');

                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EmailAddress,
                        pass: process.env.EmailAppKEY,
                    },
                });

                const mailOptions = {
                    from: "vishaltesting14@gmail.com",
                    to: useremail.email,
                    subject: "Token Withdrawal Request Submitted - Confirmation",
                    html: `
                        <html>
                        <head>
                            <style>
                                .container {
                                    border: 1px solid #ccc;
                                    padding: 20px;
                                }
                                .label {
                                    font-weight: bold;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="label">Withdrawal Request sent successfully</h1>
                                <p class="label">Withdrawal Tokens:</p> ${formattedWithdrawalTokens} ${webcoin.Tokensymbol}
                                <p class="label">Ethereum Address:</p> ${Ethereum_Address}
                                <p>Dear ${useremail.Fname} ${useremail.Lname},</p>
                                <p>Your withdrawal request has been successfully processed. Below are the details:</p>
                                <p><strong>Withdrawal Tokens:</strong> ${formattedWithdrawalTokens} ${webcoin.Tokensymbol}</p>
                                <p><strong>Ethereum Address:</strong> ${Ethereum_Address}</p>
                                <p>Thank you for using our platform for your withdrawal. If you have any further questions or need assistance, please feel free to contact our support team.</p>
                                <p>Best regards,</p>
                                <p>[Your Name]</p>
                            </div>
                        </body>
                        </html>
                    `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending error:", error);
                    } else {
                        console.log("Email sent:", info.response);
                    }
                });

                return res.json({ "success": true, "message": "Withdrawal request sent successfully" });
            }
        }
    } catch (error) {
        console.error("Withdrawal request error:", error);
        return res.json({ "success": false, "message": "Something went wrong..." });
    }
};


module.exports.userPasswordUpdate = async (req, res) => {
    try {
        const { oldPass, newPass, confirmPass } = req.body;
        const user = await User.findById(req.body.User_id);

        if (user.password !== oldPass) {
            return res.json({ message: 'Old password is incorrect.' });
        }
        if (newPass !== confirmPass) {
            return res.json({ message: 'New passwords do not match.' });
        }

        await User.findByIdAndUpdate(user._id, { password: newPass });
        return res.json({ "success": true, "message": "Password change successfully" });
    } catch (error) {
        return res.json({ "success": false, "message": "error" });
    }
};

module.exports.userProfileUpdate = async (req, res) => {
    try {
        let ad = await User.findByIdAndUpdate(req.body.User_id, req.body);
        if (ad) {
            return res.json({ message: 'User profile updated successfully.' });
        }
        else {
            return res.json({ message: 'An error occurred while updating' });
        }
    } catch (error) {
        return res.json({ message: 'An error occurred while updating' });
    }
}
const FAQ = require('../../models/FAQ')
module.exports.allFAQ = async (req, res) => {
    try {
        let ad = await FAQ.find({});
        if (ad) {
            return res.json({ FAQs: ad });
        }
        else {
            return res.json({ message: 'Data not found ' });
        }
    } catch (error) {
        return res.json({ message: 'error' });
    }
}

module.exports.allStages = async (req, res) => {
    try {
        let ad = await ICOSTO.find({});
        if (ad) {
            return res.json({ FAQs: ad });
        }
        else {
            return res.json({ message: 'Data not found ' });
        }
    } catch (error) {
        return res.json({ message: 'error' });
    }
}