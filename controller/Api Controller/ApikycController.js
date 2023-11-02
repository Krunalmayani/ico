
const KYC = require("../../models/Kyc_Form");
const USER = require("../../models/User");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../', 'uploads', 'KYC_DOC'));
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = file.fieldname + '-' + Date.now() + extension;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'KYC_Doc' },
    { name: 'KYC_Front_Image' },
    { name: 'KYC_Back_Image' }
]);


function formatDOB(dob) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const parsedDOB = new Date(dob);
    return parsedDOB.toLocaleDateString('en-US', options);
}

function formatTimestamp(timestamp) {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };
    const parsedTimestamp = new Date(timestamp);
    return parsedTimestamp.toLocaleString('en-US', options);
}

module.exports.addKycData = async function (req, res) {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token is missing' });
        }
        const user = await USER.find({ _id: req.body.User_id });
        if (!user) {
            return res.json({ message: 'User not found' });
        }
        // const existingKyc = await KYC.find({ User_id: req.body.User_id });
        // if (existingKyc) {
        //     console.log(existingKyc);
        //     return res.json({ message: 'KYC data has already been submitted' });
        // }
        upload(req, res, async function (err) {
            if (err) {
                console.log('Multer Error:', err);
                return res.json({ message: 'File upload error' });
            }
            const {
                User_id,
                First_Name,
                Last_Name,
                Email,
                Phone,
                DOB,
                Address_1,
                Address_2,
                City,
                State,
                Nationality,
                Zip_Code
            } = req.body;

            const KYC_submit_Time = new Date();
            let KYC_Doc = 'Not Submitted';
            let KYC_Front_Image = 'Not Submitted';
            let KYC_Back_Image = 'Not Submitted';
            if (req.files['KYC_Doc']) {
                KYC_Doc = '/uploads/KYC_DOC' + "/" + req.files['KYC_Doc'][0].filename;
            }
            if (req.files['KYC_Front_Image']) {
                KYC_Front_Image = '/uploads/KYC_DOC' + "/" + req.files['KYC_Front_Image'][0].filename;
            }

            if (req.files['KYC_Back_Image']) {
                KYC_Back_Image = '/uploads/KYC_DOC' + "/" + req.files['KYC_Back_Image'][0].filename;
            }
            const kycData = {
                User_id,
                First_Name,
                Last_Name,
                Email,
                Phone,
                DOB,
                Address_1,
                Address_2,
                City,
                State,
                Nationality,
                Zip_Code,
                KYC_Doc: KYC_Doc,
                KYC_Front_Image: KYC_Front_Image,
                KYC_Back_Image: KYC_Back_Image,
                KYC_submit_Time: KYC_submit_Time,
                Status: "Pending"
            };

            const newKYC = await KYC.create(kycData);
            if (newKYC) {
                const updatedUser = await USER.findByIdAndUpdate(User_id, { Kyc_id: newKYC._id }, { new: true });

                if (!updatedUser) {
                    console.log('User not found');
                    return res.json({ message: 'User not found' });
                }
                return res.json({ message: 'KYC data added successfully' ,"status":true});
            }
        });
    } catch (err) {
        console.log('Error:', err);
        return res.json({ message: 'Internal server error' });
    }
};




module.exports.allkycdata = async (req, res,) => {
    try {
        let data = await KYC.find({});
        return res.json({ data: data });
    } catch (error) {
        console.log(error);
    }
}
