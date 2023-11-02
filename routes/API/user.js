const express = require('express');
const routes = express();

const bodyParser = require('body-parser');
routes.use(bodyParser.json());

routes.use(bodyParser.urlencoded({ extended:false })); 

const UserController = require('../../controller/Api Controller/UserController');

routes.post('/create-customer', UserController.createCustomer);
routes.post('/add-card', UserController.addNewCard);
routes.post('/create-charges', UserController.createCharges);
routes.post('/transactiondata', UserController.transactiondata)
routes.post('/WithdrawalTokens', UserController.WithdrawalTokens)
routes.post('/userProfileUpdate', UserController.userProfileUpdate);
routes.post("/userPasswordUpdate", UserController.userPasswordUpdate);
routes.get("/allFAQ", UserController.allFAQ);
routes.get("/allStages", UserController.allStages);

module.exports = routes;