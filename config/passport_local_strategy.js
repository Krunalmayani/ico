const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Admin = require('../models/Admin'); // Replace with your Admin model import

passport.use('admin', new LocalStrategy({
    usernameField: 'email', // Specify the username field in your HTML form
    passwordField: 'password' // Specify the password field in your HTML form
}, async (email, password, done) => {
    try {
        // Find the admin user by email
        const adminUser = await Admin.findOne({ email: email });
        console.log("Admin DATA", adminUser);

        // If the admin user is not found or the password is incorrect, return false
        if (!adminUser || adminUser.password !== password) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        // If the admin user is found and the password is correct, return the admin user
        return done(null, adminUser);
    } catch (error) {
        return done(error);
    }
}));
