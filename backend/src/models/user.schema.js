const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {type:String, require:true, unique:true},
    email: {type:String, require:true, unique:true},
    roles: {type:[String], require:true, enum:["admin", "manager", "member"]},
    password: {type:String, require:true},
    status: {type:String, require:true, enum:["active", "banned"], default:"active"}
}, {
    versionKey:false
})

const User = new mongoose.model("users", userSchema);

module.exports={
    User
}