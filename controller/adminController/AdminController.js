const Admin = require("../../models/Admin");
const KYC = require("../../models/Kyc_Form");
const USER = require("../../models/User");
const IcoSto = require("../../models/ICO_STO_Stage");
const CryptoAddress = require("../../models/CryptoAddress");
const WebSetting = require('../../models/WebSetting');
const Transaction = require('../../models/Transaction');
const Withdrawal = require('../../models/Withdrawal');
const Referer = require('../../models/referral');
const nodemailer = require("nodemailer");
const multer = require("multer");
var path = require("path");
const { assert } = require("console");
const { user } = require("../userController");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../', 'uploads', 'WebDocs'));
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = file.fieldname + '-' + Date.now() + extension;
        cb(null, filename);
    }
});
const upload = multer({ storage: storage }).fields([
    { name: 'FaviconImage' },
    { name: 'DashboardLogo' },
    { name: 'SignUpLoginLogo' }
]);



module.exports.AdminDashbord = async (req, res) => {

    const currentDate = new Date();
    const latestExpiredStage = await IcoSto.findOne({ End_Date: { $lt: currentDate } }).sort({ End_Date: -1 }).limit(1);

    const currentStage = await IcoSto.findOne({
        Start_Date: { $lte: currentDate },
        End_Date: { $gte: currentDate }
    });

    const latestUpcomingStage = await IcoSto.findOne({
        Start_Date: { $gt: currentDate }, 
    }).sort({ Start_Date: 1 }).limit(1);


    return res.render('admin-views/admindashbord', {
        latestExpired: latestExpiredStage,
        currentStage: currentStage,
        latestUpcomingStage: latestUpcomingStage
    });
}
module.exports.Transactions = async (req, res) => {
    try {
        let data = await Transaction.find({}).populate('User_id').sort({ Transaction_submit_Time: -1 }).exec();


        return res.render('admin-views/Transactions', {
            data: data
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }

}
module.exports.Alluser = async (req, res) => {
    try {
        let data = await USER.find({}).populate('Kyc_id').sort({ createTime: -1 }).exec();

        data = data.map(item => ({
            ...item.toObject(),
            formattedCreateTime: formatDate(item.createTime)
        }));

        return res.render('admin-views/AllUser', {
            data: data
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

function formatDate(dateString) {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };
    return new Date(dateString).toLocaleString('en-US', options);
}

module.exports.withdrawal = async (req, res) => {
    const record = await Withdrawal.find({}).populate('User_id').sort({ Withdrawal_date: -1 })
    return res.render('admin-views/withdrawal', {
        record: record
    });
}

module.exports.AdminLogin = (req, res) => {
    return res.render('admin-views/AdminLogin');
}

module.exports.AdminSession = (req, res) => {
    try {
        
        const isValidLogin =  true;

        if (isValidLogin) {
            req.session.isAdminLoggedIn = true;
            res.redirect('/admin/AdminDashbord'); 
        } else {
            req.flash('error', 'Invalid email or password');
            res.redirect('/admin/AdminLogin'); 
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/admin/AdminLogin');
    }
};

module.exports.AdminSignup = (req, res) => {
    return res.render('admin-views/AdminSignup');
}

module.exports.UserDetails = async (req, res) => {
    try {
        let data = await USER.findById(req.params.id).populate('Kyc_id').exec();
        if (!data) {
            return res.status(404).send("User not found");
        }
        let formattedDOB = "NO";
        if (data.Kyc_id && data.Kyc_id.DOB) {
            formattedDOB = new Date(data.Kyc_id.DOB).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        return res.render('admin-views/UserDetails',   {
            data: data,
            formattedDOB: formattedDOB
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

module.exports.kycList = async (req, res) => {
    var data = await KYC.find(req.params.id).sort({ KYC_submit_Time: -1 });
    return res.render('admin-views/kycList', {
        data: data
    });
}
module.exports.kycListDetail = (req, res) => {
    return res.render('admin-views/kycList-Detail');
}
function formatDate(dateString) {
    const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = new Date(dateString).toLocaleDateString('en-US', options);
    return formattedDate;
}


module.exports.IcoSto = async (req, res) => {
    try {
        let data = await IcoSto.find({}).sort({ Create_Date: -1 });

        return res.render('admin-views/IcoSto-Stage', { data: data });
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports.addStage = (req, res) => {
    return res.render('admin-views/IcoStoAddStage');
}
module.exports.updateUserProfile = (req, res) => {
    console.log("dfhg");
}
module.exports.AdminSignUpData = async (req, res) => {
    try {
        const existingUser = await Admin.findOne({ email: req.body.email });
        if (existingUser) {
            console.log("You are already registered");
            return res.status(400).send("You are already registered");
        } else {
            if (req.body.password === req.body.confirmPassword) {
                const currentTime = new Date();
                const newUser = await Admin.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    createTime: currentTime,
                    role: "Admin"
                });
                if (newUser) {
                    return res.redirect("/admin/AdminLogin");
                }
            } else {
                return res.status(400).send("Passwords do not match");
            }
        }
    } catch (error) {
        console.error("Error during user registration:", error);
        return res.status(500).send("Error during user registration");
    }
}

module.exports.UserStatus = async (req, res) => {
    try {
        const updateData = await USER.findByIdAndUpdate(req.params.id, {
            email_status: false
        });
        return res.redirect('back');
    } catch (err) {
        console.log(err);
    }
}

module.exports.AddIcoSto = async (req, res) => {
    try {
        req.body.Create_Date = new Date();
        let IS = await IcoSto.create(req.body);
        if (IS) {
            return res.redirect('/admin/IcoSto');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports.crypto_Address = async (req, res) => {
    try {
        var CA = await CryptoAddress.find({})
        return res.render('admin-views/crypto_Address', {
            data: CA
        })
    } catch (error) {
        console.log(error);
    }
}
module.exports.AddcryptoAddress = async (req, res) => {
    try {
        const currentTime = new Date();
        let cryptoAddress = await CryptoAddress.create({
            Crypto_Address: req.body.Crypto_Address,
            Crypto_Type: req.body.Crypto_Type,
            Block_explorer: req.body.Block_explorer,
            Create_time: currentTime,
        });

        if (cryptoAddress) {
            req.flash('success', ' Crypto Address add succesfully..');
            return res.redirect('/admin/crypto_Address');
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports.EditCrypto = async (req, res) => {
    console.log(req.body);
    try {
        let catct = await CryptoAddress.findById(req.params.id);
        return res.render('admin-views/EditCrypto_Address', {
            data: catct
        })
    } catch (error) {
        console.log(error);
    }
}


module.exports.editecryptoAddress = async (req, res) => {
    try {
        const currentTime = new Date();
        let cryptoAddress = await CryptoAddress.findByIdAndUpdate(req.params.id, {
            Crypto_Address: req.body.Crypto_Address,
            Crypto_Type: req.body.Crypto_Type,
            Block_explorer: req.body.Block_explorer,
            Update_time: currentTime,
        });
        if (cryptoAddress) {
            req.flash('success', ' Crypto Address edit succesfully..');
            return res.redirect('/admin/crypto_Address');
        }

    } catch (error) {
        console.log(error);
    }
}

module.exports.deleteCrypto = async (req, res) => {
    try {
        let cryptoAddress = await CryptoAddress.findByIdAndDelete(req.params.id);
        if (cryptoAddress) {
            req.flash('success', ' Crypto Address delete succesfully..');

            return res.redirect('/admin/crypto_Address');
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports.Setting = async (req, res) => {
    try {
        let setting = await WebSetting.find({});
        if (setting) {
            return res.render('admin-views/Setting', {
                data: setting
            })
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports.websettingdata = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading files',
                    error: err.message
                });
            }

            const {
                Referral_Commission,
                Minimum_Purchase,
                Token_Name,
                Private_Policy,
                TermsAndConditions,
                CopyRightWord,
                WhitePaperLink,
                HomePageLink,
                Tokensymbol
            } = req.body;

            // Check if FaviconImage file is provided
            const faviconImage = req.files['FaviconImage']
                ? `/uploads/WebDocs/${req.files['FaviconImage'][0].filename}`
                : null;

            // Check if DashboardLogo file is provided
            const dashboardLogo = req.files['DashboardLogo']
                ? `/uploads/WebDocs/${req.files['DashboardLogo'][0].filename}`
                : null;

            // Check if SignUpLoginLogo file is provided
            const signUpLoginLogo = req.files['SignUpLoginLogo']
                ? `/uploads/WebDocs/${req.files['SignUpLoginLogo'][0].filename}`
                : null;

            // Construct the update object
            const updateFields = {
                Referral_Commission,
                Minimum_Purchase,
                Token_Name,
                Private_Policy,
                TermsAndConditions,
                CopyRightWord,
                WhitePaperLink,
                HomePageLink,
                Tokensymbol
            };

            // Add FaviconImage, DashboardLogo, and SignUpLoginLogo to the update object if they exist
            if (faviconImage) {
                updateFields.FaviconImage = faviconImage;
            }
            if (dashboardLogo) {
                updateFields.DashboardLogo = dashboardLogo;
            }
            if (signUpLoginLogo) {
                updateFields.SignUpLoginLogo = signUpLoginLogo;
            }

            const updatedWebSetting = await WebSetting.findByIdAndUpdate(
                '64e9a0fdc365527caca5058a',
                updateFields, // Use the constructed update object
                { new: true }
            );

            if (updatedWebSetting) {
                req.flash('success', 'Data Add successfully..');
                return res.redirect('/admin/Setting');
            }
        });
    } catch (error) {
        console.log(error);
    }
};



module.exports.UpdateIcoSto = async (req, res) => {
    const icodata = await IcoSto.findById(req.params.id);
    if (icodata) {
        return res.render('admin-views/UpdateIcoSto', {
            i: icodata
        })
    }
}

module.exports.UpdateIcoStoData = async (req, res) => {
    try {
        const icodata = await IcoSto.findByIdAndUpdate(req.body.id, req.body);
        if (icodata) {
            return res.redirect('/admin/IcoSto');
        }
        else {
            console.log("ERROR");
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports.AddIcoStoDelete = async (req, res) => {
    try {
        const icodata = await IcoSto.findByIdAndDelete(req.params.id);
        if (icodata) {
            return res.redirect('/admin/IcoSto');
        }
        else {
            console.log("ERROR");
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports.Transactions_reject = async (req, res) => {
    try {
        const updateData = await Transaction.findByIdAndUpdate(req.params.id, {
            Status: "Rejected"
        });
        return res.redirect('back');
    } catch (err) {
        console.log(err);
    }
}



module.exports.ApproveWithdrawal = async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, {
            Status: "Approved",
        });

        if (withdrawal) {
            const user = await USER.findById(withdrawal.User_id);

            var transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "vishaltesting14@gmail.com",
                    pass: "zazlmhlgefvvwazq",
                },
            });

            let info = await transport.sendMail({
                from: "vishaltesting14@gmail.com",
                to: user.email,
                subject: "Token Withdrawal Approved - Your Request Is Confirmed",
                html: `
                <html>
                <head>
                </head>
                <body>
                    <div class="container">
                        <h1 class="label">Withdrawal Approved</h1>
                        <p class="label">Your withdrawal request has been approved.</p>
                        <p class="label">Withdrawal Details:</p>
                        <ul>
                            <li>Ethereum Address: ${withdrawal.Ethereum_Address}</li>
                            <li>Withdrawal Tokens: ${withdrawal.Withdrawal_Tokens}</li>
                        </ul>
                        <!-- Add the new content below -->
                        <p>Dear ${user.Fname} ${user.Lname},</p>
                        <p>I hope this message finds you in high spirits. We are pleased to inform you that your recent token withdrawal request on [Your Website Name] has been approved and processed successfully.</p>
                        <p>Here are the details of your approved withdrawal:</p>
                        <p><strong>Token Amount:</strong> [Enter Token Amount]</p>
                        <p><strong>ETH Address:</strong> [Enter Ethereum Wallet Address]</p>
                        <p>The tokens have been transferred to your provided Ethereum address, and the transaction has been confirmed on the blockchain. You can verify the transaction using the following transaction ID: [Transaction ID].</p>
                        <p>Should you have any questions or require further assistance, please do not hesitate to contact our support team at [Support Email Address]. We are here to help you with any inquiries you may have.</p>
                        <p>Thank you for choosing [Your Website Name], and we appreciate your continued trust in our platform. If you have any more withdrawal requests or if there's anything else we can assist you with, please feel free to reach out to us anytime.</p>
                        <p>Wishing you a great day ahead!</p>
                        <p>Best regards,</p>
                        <p>[Your Name]</p>
                    </div>
                </body>
                </html>
                `,
            });
            console.log("Withdrawal approved and email sent successfully");
        }
        return res.redirect('back');
    } catch (err) {
        console.error("Error approving withdrawal: " + err);
    }
}
module.exports.RejectWithdrawal = async (req, res) => {
    try {
        const withdrawalRequest = await Withdrawal.findById(req.params.id);

        if (withdrawalRequest && withdrawalRequest.Status === "Pending") {
            const user = await USER.findById(withdrawalRequest.User_id);

            if (user) {
                user.token_balance += parseFloat(withdrawalRequest.Withdrawal_Tokens);
                await user.save();

                var transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "vishaltesting14@gmail.com",
                        pass: "zazlmhlgefvvwazq",
                    },
                });

                let info = await transport.sendMail({
                    from: "vishaltesting14@gmail.com",
                    to: user.email,
                    subject: "Withdrawal Request Rejected",
                    html: `
                        <html>
                        <head>
                            <style>
                                /* Add your CSS styles here to format the email content */
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
                                <h1 class="label">Withdrawal Request Rejected</h1>
                                <p class="label">Your withdrawal request has been rejected.</p>
                                <p class="label">Withdrawal Details:</p>
                                <ul>
                                    <li>Ethereum Address: ${withdrawalRequest.Ethereum_Address}</li>
                                    <li>Withdrawal Tokens: ${withdrawalRequest.Withdrawal_Tokens}</li>
                                </ul>
                            </div>
                        </body>
                        </html>
                    `,
                });

                console.log("Withdrawal request rejected and email sent successfully");
            }

            await Withdrawal.findByIdAndUpdate(req.params.id, {
                Status: "Rejected"
            });

            return res.redirect('back');
        } else {
            req.flash('error', 'Invalid withdrawal request.');
            return res.redirect('back');
        }
    } catch (err) {
        console.error("Error rejecting withdrawal: " + err);
    }
}


module.exports.Transactions_approved = async (req, res) => {
    try {
        const approvedTransaction = await Transaction.findByIdAndUpdate(req.params.id, {
            Status: "Approved",
        });

        if (!approvedTransaction) {
            return res.status(404).json({ error: "Transaction not found." });
        }

        const userId = approvedTransaction.User_id;

        const user = await USER.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const totalToken = approvedTransaction.Total_Token;

        user.token_balance += totalToken;
        await user.save();

        if (approvedTransaction.referred_id) {
            const referredId = approvedTransaction.referred_id;

            const referral = await Referer.findById(referredId);

            if (!referral) {
                return res.status(404).json({ error: "Referral not found." });
            }

            const commission = referral.Commission;
            const referralCode = referral.referralCode;

            await USER.updateOne(
                { referralCode },
                { $inc: { token_balance: commission } }
            );
        }

        return res.redirect('back');
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error." });
    }
}