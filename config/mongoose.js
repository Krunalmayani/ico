var mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE)
var db = mongoose.connection;
db.once("open",(err)=>{
    if (err){
        console.log(err);
    }
    console.log("database connectd....");
})
module.exports = db;  