const mongoose = require("mongoose");
const AdminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createTime: {
        type: Date,
    },
    role : {
        type: String,
        required : true
    }
});
const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
