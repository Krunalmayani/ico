
const express = require("express");
const router = express.Router();
const KycController = require("../../controller/Api Controller/ApikycController");

router.post('/addKycData', KycController.addKycData);
router.get('/allkycdata', KycController.allkycdata)
module.exports = router;      