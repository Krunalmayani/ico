const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const CreateToken = require('../../config/generateTokenMiddleware'); 
const otpGenerator = require('otp-generator')
function generateOTP(length) {
    const otp = otpGenerator.generate(length, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    return otp;
}


// Function to generate a random code for the referral code
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

// Define an endpoint to get all users
module.exports.allUser = async (req, res) => {
    try {
        const data = await User.find({});
        res.json({ "All User Data":data });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
};

// Define an endpoint for user signup

module.exports.signup = async (req, res) => {
    try {
        if (req.body.password === req.body.confirmPassword) {
            const referralCode = generateRandomCode(7);
            const otp = generateOTP(6);
            const newUser = await User.create({
                Fname: req.body.Fname,
                Lname: req.body.Lname,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password,
                country: req.body.country,
                role: 'User',
                status: true,
                email_status: false,
                referralCode,
                referred_by: req.body.referred_by || null,
                token_balance: 0,
                two_fa_verification: false,
                otp,
                active_status: 0
            });

            if (newUser) {
                // const token = jwt.sign({ userId: newUser._id }, 'your-secret-key', {
                //     expiresIn: '24h',
                // });
                const token = CreateToken({ userId: newUser._id });
                newUser.token = token;
                await newUser.save();

                const transport = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'vishaltesting14@gmail.com',
                        pass: 'zazlmhlgefvvwazq',
                    },
                });
                const info = await transport.sendMail({
                    from: 'vishaltesting14@gmail.com',
                    to: req.body.email,
                    subject: 'Registration Confirmation',
                    html: `
                    <html>
                    <head>
                    </head>
                    <body>  
                        <h1>OTP: ${otp}</h1>
                    </body>
                    </html>`,
                });
                return res.json({ 'status': 200, message: 'Check your email for the OTP and complete your Email verification.', status: true, data: newUser });
            }
        } else {
            return res.json({ error: 'Passwords do not match' ,"status": false,});
        }
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
};

module.exports.checkOtp = async (req, res) => {
    try {
        const { email, enteredOTP } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ error: 'User not found' });
        }

        if (user.email_status) {
            return res.json({ error: 'Email is already verified' });
        }
        if (user.otp == enteredOTP) {
            user.email_status = true;
            await user.save();
            return res.json({ message: 'Email verification successfully', status: true, data: user });
        } else {
            return res.json({ error: 'Invalid OTP' });
        }
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
};

module.exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ error: 'User not found' });
        }
        if (user.email_status == false) {
            return res.json({ error: 'Please verify Email' });
        }        
        if (user.password !== password) {
            return res.json({ error: 'Invalid password' });
        }

        const token = CreateToken({ userId: user._id });

        user.token = token;
        user.active_status = 1
        await user.save();

        return res.json({ message: 'Login successfully', status: true, data: user, token: user.token });
    } catch (error) {
        console.error(error);
        res.json({ error: 'Internal server error' });
    }
}


module.exports.logout = async (req, res) => {
    try {

        const userId = req.params.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.token = null;
        user.active_status = 0;
        await user.save();

        return res.json({ message: 'Logout successful', status: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('1090353028229-4p3khtl7u3hikg80pj4k3cf11otcrjhi.apps.googleusercontent.com'); 
module.exports.googleLogin = async (req, res) => {
    const { googleToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: '1090353028229-4p3khtl7u3hikg80pj4k3cf11otcrjhi.apps.googleusercontent.com', 
        });

        const payload = ticket.getPayload();
        
        const googleUserId = payload.sub;

        let user = await User.findOne({ googleId: googleUserId });

        if (!user) {
            user = new User({
                googleId: googleUserId,
                Fname: profile.name.givenName,
                Lname: profile.name.familyName,
                email: profile.emails[0].value,
                role: 'User', 
                status: true,
                email_status: profile.emails[0].verified,
                referralCode: generateRandomCode(7),
                referred_by: null,
                token_balance: 0,
                active_status:1
            });
        }
        await user.save();
        res.status(200).json({
            message: 'Google login successful',
            user: user,
            status: true,
        });
        
    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        res.json({ message: 'Google login failed' });
    }
};