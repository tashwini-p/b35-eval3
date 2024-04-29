const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    task: {type:String, require:true},
    priority: {type:String, require:true, enum:["low", "medium", "high"]},
    status: {type:String, enum:["pending", "in-progress", "completed"], default:"pending"},
    deadline: {type:String, require:true},
    approvedToDelete : {type:String, enum:["yes", "no"]},
    user_id: {type:String, require:true},
    username: {type:String, require:true}
}, {
    versionKey:false,
    timestamps:true
})

const Task = new mongoose.model("tasks", taskSchema);

module.exports={
    Task
}