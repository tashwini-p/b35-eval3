const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {type:String, require:true}
}, {
    versionKey:false
})

const Blacklist = mongoose.model("blacklisted", blacklistSchema);

module.exports={
    Blacklist
}