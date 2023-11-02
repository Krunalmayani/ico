const express = require("express");
const routes = express.Router();
var AdminController = require("../../controller/adminController/AdminController");
const passport = require("passport");
const adminAuthMiddleware = require('../../config/adminAuthMiddleware');

routes.get("/AdminLogin", AdminController.AdminLogin);
routes.post("/AdminSession", AdminController.AdminSession);
// routes.get("/AdminSignup", AdminController.AdminSignup);
routes.post("/AdminSignUpData",adminAuthMiddleware, AdminController.AdminSignUpData);
routes.get("/AdminDashbord", adminAuthMiddleware, AdminController.AdminDashbord);
routes.get("/Transactions",adminAuthMiddleware, AdminController.Transactions);
routes.get("/Alluser",adminAuthMiddleware, AdminController.Alluser);
routes.get("/withdrawal",adminAuthMiddleware, AdminController.withdrawal);
routes.get("/UserDetails/:id",adminAuthMiddleware, AdminController.UserDetails);
routes.get("/UserStatus/:id",adminAuthMiddleware, AdminController.UserStatus);  
routes.get("/kycList",adminAuthMiddleware, AdminController.kycList);
routes.get("/IcoSto",adminAuthMiddleware, AdminController.IcoSto);
routes.get("/addStage",adminAuthMiddleware, AdminController.addStage);
routes.post("/AddIcoSto",adminAuthMiddleware, AdminController.AddIcoSto);
routes.get("/crypto_Address",adminAuthMiddleware, AdminController.crypto_Address);
routes.post("/AddcryptoAddress",adminAuthMiddleware, AdminController.AddcryptoAddress); 
routes.get("/EditCrypto/:id",adminAuthMiddleware, AdminController.EditCrypto);
routes.get("/deleteCrypto/:id",adminAuthMiddleware, AdminController.deleteCrypto)
routes.post("/editecryptoAddress/:id",adminAuthMiddleware, AdminController.editecryptoAddress);
routes.get('/UpdateIcoSto/:id',adminAuthMiddleware, AdminController.UpdateIcoSto);
routes.post('/UpdateIcoStoData',adminAuthMiddleware, AdminController.UpdateIcoStoData);
routes.get("/Setting",adminAuthMiddleware, AdminController.Setting);
routes.get("/Transactions_approved/:id",adminAuthMiddleware, AdminController.Transactions_approved);
routes.get("/Transactions_reject/:id",adminAuthMiddleware, AdminController.Transactions_reject);
routes.post("/websettingdata",adminAuthMiddleware, AdminController.websettingdata);
routes.get("/AddIcoStoDelete/:id",adminAuthMiddleware, AdminController.AddIcoStoDelete);
routes.get("/ApproveWithdrawal/:id",adminAuthMiddleware, AdminController.ApproveWithdrawal)
routes.get("/RejectWithdrawal/:id", adminAuthMiddleware, AdminController.RejectWithdrawal)
routes.get("/AddFAQS", adminAuthMiddleware, AdminController.AddFAQS)
routes.post("/AddFAQSData", adminAuthMiddleware, AdminController.AddFAQSData)
routes.post("/updateFAQSData/:id",adminAuthMiddleware, AdminController.updateFAQSData)
routes.get("/DeleteFAQSData/:id", adminAuthMiddleware, AdminController.DeleteFAQSData)
routes.get('/logout', async (req, res) => {
    try {
        console.log(req.session);
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during session destruction:', err);
                    reject(err);
                } else {
                    console.log(req.session);
                    resolve();
                }
            }); 
        });
        res.clearCookie('Session'); 
        res.redirect('/admin/AdminLogin'); 
    } catch (error) {
        console.error('Error during logout:', error);
        res.redirect('/'); 
    }
    
});
module.exports = routes;