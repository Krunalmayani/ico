const adminAuthMiddleware = (req, res, next) => {
    // Check if the isAdminLoggedIn flag is set in the session
    if (req.session.isAdminLoggedIn) {
        return next(); // User is logged in, allow access to the route
    } else {
        res.redirect('/admin/AdminLogin'); // Redirect to the login page if not logged in
    }
};

module.exports = adminAuthMiddleware;
