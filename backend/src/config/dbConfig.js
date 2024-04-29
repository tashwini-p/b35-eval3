require("dotenv").config();
const mongoose = require("mongoose");

async function connectToDB(){
    try{
        await mongoose.connect(process.env.server_URL);
        console.log("Server connected to DB");
    }catch(err){
        console.log(error);
        process.exit(1);
    }
}

module.exports = {
    connectToDB
}