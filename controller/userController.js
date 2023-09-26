require('dotenv').config();
const WebSetting = require('../models/WebSetting');
const User = require("../models/User")
const CryptoAddress = require("../models/CryptoAddress");
const Transaction = require("../models/Transaction");
const Withdrawal = require("../models/Withdrawal");
const ICOSTO = require("../models/ICO_STO_Stage");
const crypto = require('crypto');
const Referral = require('../models/referral');
const { Collection } = require("mongoose");
const speakeasy = require('speakeasy');
const qrCode = require('qrcode');
const nodemailer = require("nodemailer");
const { withdrawal } = require('./adminController/AdminController');
const jwt = require('jsonwebtoken');
module.exports.user = function (req, res) {
    return res.render("index")
}
module.exports.signup = function (req, res) {
    return res.render("signup")
}
module.exports.dashboard = async function (req, res) {
    try {
        const userId = req.session.passport.user;
        const data = await Transaction.find({ User_id: userId });
        const pendingTransactions = data.filter(transaction => transaction.Status === 'Pending');
        const totalPayAmount = pendingTransactions.reduce((total, transaction) => total + transaction.Total_Token, 0);

        const ApprovedTransactionsdata = data.filter(transaction => transaction.Status === 'Approved');
        const ApprovedTransactions = ApprovedTransactionsdata.reduce((total, transaction) => total + transaction.Total_Token, 0);

        const Withdrawaldatas = await Withdrawal.find({ User_id: userId });
        const collection = Withdrawaldatas.filter(Withdrawal => Withdrawal.Status === 'Approved');
        const totalWithdrawal = collection.reduce((total, Withdrawal) => total + parseFloat(Withdrawal.Withdrawal_Tokens), 0);

        const currentDate = new Date();
        const latestExpiredStage = await ICOSTO.findOne({ End_Date: { $lt: currentDate } }).sort({ End_Date: -1 }).limit(1);

        const currentStage = await ICOSTO.findOne({
            Start_Date: { $lte: currentDate },
            End_Date: { $gte: currentDate }
        });

        const latestUpcomingStage = await ICOSTO.findOne({
            Start_Date: { $gt: currentDate },
        }).sort({ Start_Date: 1 }).limit(1);


        return res.render("dashboard", {
            pendingTransaction: totalPayAmount,
            ApprovedTransactions: ApprovedTransactions,
            totalWithdrawal: totalWithdrawal,
            latestExpired: latestExpiredStage,
            currentStage: currentStage,
            latestUpcomingStage: latestUpcomingStage
        });

    } catch (error) {
        console.log(error);
    }


}

module.exports.buytokens = async (req, res) => {
    const currentDate = new Date();

    const ICO_STO_StageData = await ICOSTO.find({});

    const runningStage = ICO_STO_StageData.find(stage => {
        const startDate = new Date(stage.Start_Date);
        const endDate = new Date(stage.End_Date);
        return currentDate >= startDate && currentDate <= endDate;
    });

    if (runningStage) {
        return res.render("buytokens");
    } else {
        const upcomingStage = ICO_STO_StageData.find(stage => {
            const startDate = new Date(stage.Start_Date);
            return currentDate < startDate;
        });

        if (upcomingStage) {
            return res.render("NoIcoSto", { upcomingStartDate: upcomingStage.Start_Date });
        } else {
            return res.render("NoIcoSto");
        }
    }
};


module.exports.transactions = async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const data = await Transaction.find({ User_id: userId })
            .populate('User_id')
            .sort({ Transaction_submit_Time: -1 })
            .exec();
        return res.render('transactions', {
            data: data
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}
module.exports.getRandomCryptoAddress = async (req, res) => {
    try {
        const selectedCryptocurrency = req.query.selectedCryptocurrency;
        const filteredAddresses = await CryptoAddress.find({ Crypto_Type: selectedCryptocurrency });
        if (filteredAddresses.length === 0) {
            return res.status(404).json({ error: 'No crypto addresses found for the selected cryptocurrency.' });
        }
        const randomIndex = Math.floor(Math.random() * filteredAddresses.length);
        const randomCryptoAddress = filteredAddresses[randomIndex].Crypto_Address;
        let price = 0;
        const specificCryptocurrencies = ['USDC(ERC20)', 'USDT(TRC20)', 'USDT(BEP20)', 'USDT(ERC20)'];
        if (specificCryptocurrencies.includes(selectedCryptocurrency)) {
            price = 1;
        } else {
            const priceApiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${selectedCryptocurrency}&vs_currencies=usd`;
            const priceResponse = await fetch(priceApiUrl);
            const priceData = await priceResponse.json();
            price = priceData[selectedCryptocurrency].usd;
        }
        res.json({ randomCryptoAddress, price });
    } catch (error) {
        console.error("Error fetching random Crypto_Address:", error);
        res.status(500).json({ error: "Error fetching random Crypto_Address" });
    }
}
module.exports.profile = async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const profile = await User.findById(userId);
        if (!profile) {
            return res.status(404).send("User not found");
        }
        const userReferralCode = profile.referralCode;
        if (!userReferralCode) {
            return res.status(404).send("Referral code not found");
        }
        const referralCodeUrl = `${process.env.URL}/signup?ref=${userReferralCode}`;
        return res.render("profile", {
            profile: profile,
            referralCodeUrl: referralCodeUrl
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error fetching user profile");
    }
};

module.exports.ICODistribution = async (req, res) => {
    return res.render("ICODistribution");
}

module.exports.kycApplication = async (req, res) => {
    return res.render("kycApplication");
}

module.exports.kycform = async (req, res) => {
    return res.render("kyc-Form");
}
module.exports.kycVerification = async (req, res) => {
    return res.render("kycVerification");
}

module.exports.Referral = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found.");
            return res.status(404).json({ error: 'User not found.' });

        }
        const referringUser = await Referral.aggregate([
            {
                $match: {
                    referralCode: user.referralCode,
                },
            },
            {
                $lookup: {
                    from: 'users', // Use the actual name of the User collection
                    localField: 'User_id',
                    foreignField: '_id',
                    as: 'User_id',
                },
            },
            {
                $lookup: {
                    from: 'users', // Use the actual name of the User collection
                    localField: 'referred_Userid',
                    foreignField: '_id',
                    as: 'referred_Userid',
                },
            },
            {
                $lookup: {
                    from: 'transactions', // Use the actual name of the Transaction collection
                    localField: 'Transactions_id',
                    foreignField: '_id',
                    as: 'Transactions_id',
                },
            },
            {
                $unwind: '$User_id',
            },
            {
                $unwind: '$referred_Userid',
            },
            {
                $unwind: '$Transactions_id',
            },
            {
                $match: {
                    'Transactions_id.Status': 'Approved', // Filter by the "Approved" status
                },
            },
            {
                $sort: { referral_Date: -1 },
            },
        ]);

        const userIdSession = req.session.passport.user;
        const profile = await User.findById(userIdSession);
        if (!profile) {
            return res.status(404).send("User not found");
        }
        const userReferralCode = profile.referralCode;
        if (!userReferralCode) {
            return res.status(404).send("Referral code not found");
        }
        const referralCodeUrl = `${process.env.URL}/signup?ref=${userReferralCode}`;

        if (referringUser) {
            return res.render("Referral", { referralCodeData: referringUser, referralCodeUrl: referralCodeUrl });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
module.exports.Withdrawal = async (req, res) => {
    try {
        const userId = req.session.passport.user;

        const user = await User.findById(userId);

        if (user) {
            const WithdrawalDATA = await Withdrawal.find({ User_id: userId }).sort({ createTime: -1 });

            return res.render("withdrawal", {
                data: user,
                Withdrawal: WithdrawalDATA
            });
        } else {
            console.log("error: Couldn't find");
        }
    } catch (error) {
        console.log(error);
    }
}



module.exports.FAQs = async (req, res) => {
    return res.render("FAQs");
}


module.exports.UserSignUpData = async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {
            console.log('You are already registered');
            return res.status(400).send('You are already registered');
        }

        let newUser;

        if (extractReferralCodeFromURL(req.headers.referer)) {
            if (req.body.password === req.body.confirmPassword) {
                const currentTime = new Date();
                const referralCode = generateRandomCode(7);

                newUser = await User.create({
                    Fname: req.body.Fname,
                    Lname: req.body.Lname,
                    email: req.body.email,
                    phone: req.body.phone,
                    password: req.body.password,
                    country: req.body.country,
                    createTime: currentTime,
                    role: 'User',
                    status: false,
                    email_status: false,
                    referralCode,
                    referred_by: extractReferralCodeFromURL(req.headers.referer),
                    token_balance: 0,
                    two_fa_verification: false
                });

                if (newUser) {
                    const token = jwt.sign({ userId: newUser._id }, 'your-secret-key', {
                        expiresIn: '24h',
                    });

                    newUser.token = token;
                    await newUser.save();

                    const loginPageURL = `${process.env.URL}/login`; // Define the login page URL
                    const confirmationLink = `${loginPageURL}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(newUser.email)}`;

                    const transport = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: "vishaltesting14@gmail.com",
                            pass: "zazlmhlgefvvwazq",
                        },
                    });

                    const info = await transport.sendMail({
                        from: 'vishaltesting14@gmail.com',
                        to: req.body.email,
                        subject: 'Registration Confirmation',
                        html: `
                        <html>
        <head>
            <style>
                /* Add your email styles here if needed */
            </style>
        </head>
        <body>
            <h1>Welcome to [Your Website Name]</h1>
            <p>Dear ${req.body.Fname} ${req.body.Lname},</p>
            <p>Welcome to [Your Website Name]! We are thrilled to have you join our platform. We are excited to have you as a part of our community.</p>
            <p>To confirm your email and complete your registration, please click the following link:</p>
            <a href="${confirmationLink}">${confirmationLink}</a>
            <p>If you have any questions, require assistance, or need guidance on buying tokens, please don't hesitate to contact our support team. Your satisfaction and success are important to us.</p>
            <p>Once again, welcome to [Your Website Name]! We look forward to helping you navigate the world of digital assets.</p>
            <p>Best regards,</p>
            <p>[Your Name]</p>
        </body>
        </html>
                        `,
                    });

                    console.log('User registered successfully');
                    return res.redirect('/login');
                }
            } else {
                return res.status(400).send('Passwords do not match');
            }
        } else {
            if (req.body.password === req.body.confirmPassword) {
                const currentTime = new Date();
                const referralCode = generateRandomCode(7);

                newUser = await User.create({
                    Fname: req.body.Fname,
                    Lname: req.body.Lname,
                    email: req.body.email,
                    phone: req.body.phone,
                    password: req.body.password,
                    country: req.body.country,
                    createTime: currentTime,
                    role: 'User',
                    status: true,
                    email_status: false,
                    referralCode,
                    referred_by: null,
                    token_balance: 0,
                    two_fa_verification: false
                });

                if (newUser) {
                    const token = jwt.sign({ userId: newUser._id }, 'your-secret-key', {
                        expiresIn: '24h',
                    });


                    newUser.token = token;
                    await newUser.save();

                    const loginPageURL = `${process.env.URL}/login`;
                    const confirmationLink = `${loginPageURL}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(newUser.email)}`;
                    const transport = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: "vishaltesting14@gmail.com",
                            pass: "zazlmhlgefvvwazq",
                        },
                    });
                    const info = await transport.sendMail({
                        from: 'vishaltesting14@gmail.com',
                        to: req.body.email,
                        subject: 'Registration Confirmation',
                        html: `
                        <html>
        <head>
            <style>
                /* Add your email styles here if needed */
            </style>
        </head>
        <body>
            <h1>Welcome to [Your Website Name]</h1>
            <p>Dear ${req.body.Fname} ${req.body.Lname},</p>
            <p>Welcome to [Your Website Name]! We are thrilled to have you join our platform. We are excited to have you as a part of our community.</p>
            <p>To confirm your email and complete your registration, please click the following link:</p>
            <a href="${confirmationLink}">${confirmationLink}</a>
            <p>If you have any questions, require assistance, or need guidance on buying tokens, please don't hesitate to contact our support team. Your satisfaction and success are important to us.</p>
            <p>Once again, welcome to [Your Website Name]! We look forward to helping you navigate the world of digital assets.</p>
            <p>Best regards,</p>
            <p>[Your Name]</p>
        </body>
        </html>   `,
                    });

                    console.log('User registered successfully');
                    return res.redirect('/login');
                }
            } else {
                return res.status(400).send('Passwords do not match');
            }
        }
    } catch (error) {
        console.error('Error during user registration:', error);
        return res.status(500).send('Error during user registration');
    }
};




function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

function extractReferralCodeFromURL(url) {
    const queryParams = new URL(url).searchParams;
    return queryParams.get('ref') || null;
}

module.exports.dashbordsession = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.email_status) {
            req.flash('success', 'Email already verified.');
            return res.redirect('/dashboard');
        }

        if (!user.email_status && user.token === req.body.token) {
            user.email_status = true;
            await user.save();

            req.flash('success', 'Email verified successfully.');
            return res.redirect('/dashboard');
        }

        req.flash('error', 'Token not found or does not match.');
        return res.redirect('/signup');
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};



module.exports.login = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    return res.render('login');
}

module.exports.updateUserProfile = async (req, res) => {
    let ad = await User.findByIdAndUpdate(req.body.id, req.body);
    if (ad) {
        req.flash('success', ' Profile Update succesfully..');
        return res.redirect('back');
    }
    else {
        console.log('Error record not update');
    }
}

exports.userPasswordUpdate = async (req, res) => {
    try {
        const { oldPass, newPass, confirmPass } = req.body;
        const user = await User.findById(req.session.passport.user);

        if (user.password !== oldPass) {
            return res.status(400).json({ message: 'Old password is incorrect.' });
        }
        if (newPass !== confirmPass) {
            return res.status(400).json({ message: 'New passwords do not match.' });
        }

        await User.findByIdAndUpdate(user._id, { password: newPass });
        req.flash('success', 'Password updated successfully.');
        return res.redirect('back');

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'An error occurred while updating password.' });
    }
};



module.exports.transactionData = async (req, res) => {
    try {
        const currentDateTime = new Date();
        req.body.Transaction_submit_Time = currentDateTime;
        req.body.Status = 'Pending';
        const transactionsdata = await Transaction.create(req.body);
        if (transactionsdata) {
            req.flash('success', 'Transaction request sent successfully.');
            const referredUser = await User.findById(req.body.User_id);
            if (referredUser.referred_by == null) {
                useremail = await User.findById(req.body.User_id);
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                var transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "vishaltesting14@gmail.com",
                        pass: "zazlmhlgefvvwazq",
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
                return res.redirect('back');
            }
            else {
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
                        user: "vishaltesting14@gmail.com",
                        pass: "zazlmhlgefvvwazq",
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
                return res.redirect('back');
            }
        }

    } catch (error) {
        console.log(error);
    }
};


module.exports.addWithdrawalRequest = async (req, res) => {
    try {
        req.body.Withdrawal_date = new Date();
        req.body.Status = 'Pending';


        const formattedWithdrawalTokens = parseFloat(req.body.Withdrawal_Tokens).toFixed(8);

        const withdrawalRequest = await Withdrawal.create({
            ...req.body,
            Withdrawal_Tokens: formattedWithdrawalTokens,
        });

        if (withdrawalRequest) {
            const user = await User.findByIdAndUpdate(
                req.body.User_id,
                {
                    $inc: { token_balance: -parseFloat(formattedWithdrawalTokens) }
                },
                { new: true }
            );

            if (user) {
                const useremail = await User.findById(req.body.User_id);
                const id = '64e9a0fdc365527caca5058a';
                const webcoin = await WebSetting.findById(id);
                var transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "vishaltesting14@gmail.com",
                        pass: "zazlmhlgefvvwazq",
                    },
                });
                let info = await transport.sendMail({
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
                            <p class="label">Ethereum Address:</p> ${req.body.Ethereum_Address}
                            <p>Dear ${useremail.Fname} ${useremail.Lname},</p>
                            <p>Your withdrawal request has been successfully processed. Below are the details:</p>
                            <p><strong>Withdrawal Tokens:</strong> ${formattedWithdrawalTokens} ${webcoin.Tokensymbol}</p>
                            <p><strong>Ethereum Address:</strong> ${req.body.Ethereum_Address}</p>
                            <p>Thank you for using our platform for your withdrawal. If you have any further questions or need assistance, please feel free to contact our support team.</p>
                            <p>Best regards,</p>
                            <p>[Your Name]</p>
                            </div>
                        </body>
                        </html>
                    `,
                });

                console.log("Withdrawal request sent successfully");

                req.flash('success', 'Withdrawal request sent successfully.');
                return res.redirect('back');
            }
        }
    } catch (error) {
        console.error("Error in withdrawal: " + error);
    }
};

module.exports.forgotPassword = async (req, res) => {
    return res.render('forgotPassword')
}

module.exports.SendEmail = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email });
        if (userData) {
            const transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "vishaltesting14@gmail.com",
                    pass: "zazlmhlgefvvwazq",
                },
            });

            const loginPageURL = `${process.env.URL}/changepassword`;
            const confirmationLink = `${loginPageURL}?token=${userData.token}&email=${userData.email}`;

            const info = await transport.sendMail({
                from: "vishaltesting14@gmail.com",
                to: userData.email,
                subject: "Password Reset Request for Your [Your Website Name] Account",
                html: `
                    <html>
                    <head>
                       
                    </head>
                    <body>
                        <div class="container">
                        <h1 class="label">Password Reset Request for Your [Your Website Name] Account</h1>
                        <p>Dear ${userData.Fname} ${userData.Lname},</p>
                        <p>We've received a request to reset the password for your [Your Website Name] account. If you didn't make this request, please disregard this email.</p>
                        <p>To reset your password, please follow the instructions below:</p>
                        <p>Click on the following link to reset your password:</p>
                        <p><a href="${confirmationLink}">${confirmationLink}</a></p>
                        <p>You will be directed to a page where you can create a new password. Make sure your new password is strong and unique.</p>
                        <p>After setting your new password, you'll be able to log in to your [Your Website Name] account using your updated credentials.</p>
                        <p>If you have any trouble resetting your password or believe this request was made in error, please contact our support team immediately at [Support Email Address]. We're here to assist you.</p>
                        <p>For security reasons, this password reset link will expire in [X hours], so please reset your password as soon as possible.</p>
                        <p>Thank you for choosing [Your Website Name]. We look forward to continuing to serve you.</p>
                        <p>Best regards,</p>
                        <p>[Your Name]</p>
                        </div>
                    </body>
                    </html>
                `,
            });

            return res.redirect("back");
        } else {

            return res.status(404).send("User not found");
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email');
    }
};


module.exports.ChangeAccountPassword = async (req, res) => {
    try {
        const token = req.body.token;
        const newPassword = req.body.New_password;
        const confirmPassword = req.body.Confirm_password;

        if (newPassword !== confirmPassword) {
            console.log("Passwords do not match");
            return res.redirect('back');
        }
        const user = await User.findOne({ token });

        if (!user) {
            console.log("User not found");
            return res.redirect('back');
        }

        user.password = newPassword;
        await user.save();

        return res.redirect("/login");

    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

module.exports.changepassword = async (req, res) => {
    return res.render('changepassword')
}


module.exports.checkLoginTwoFAcode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        if (!user.two_fa_verification) {

            console.log("1");
            return res.redirect('/dashboard');
        }

        const isVerified = speakeasy.totp.verify({
            secret: user.two_fa_secret,
            encoding: 'ascii',
            token: req.body.otpCode,
            window: 2,
        });

        if (isVerified) {
            req.session.is2FAVerified = true;
            return res.redirect('/dashboard');
        } else {
            console.log("Invalid OTP");
            return res.status(401).send('Invalid OTP');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
}