require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {Task} = require("../models/task.schema");
const {verifyToken} = require("../middlewares/auth.middleware")
const { access } = require("../middlewares/access.middleware");
const taskRouter = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *      Task:
 *          type: object
 *          properties:
 *              _id: 
 *                  type: string
 *                  description: Auto-generated id of the task
 *              task: 
 *                  type: string
 *                  description: title of the task
 *              priority: 
 *                  type: string
 *                  description: low/medium/high
 *              status: 
 *                  type: string
 *                  description: pending/in-progress/completed
 *              deadline: 
 *                  type: string
 *                  description: deadline enforced to complete the task
 *              approvedToDelete: 
 *                  type: string
 *                  description: status of approval to delete the task (yes/no)
 *              user_id: 
 *                  type: string
 *                  description: User ID of the person who created the task
 *              username: 
 *                  type: string
 *                  description: Username of the person who created the task
 */

/**
 * @swagger
 * /tasks:
 *  get:
 *      summary: To fetch tasks based on user role
 *      tags: [Tasks]
 *      security:
 *          - BearerAuth: []
 *      responses:
 *          201:
 *              description: Tasks retrieved succesfully
 *              content: 
 *                  application/json:
 *                      scehma:
 *                          type: array
 *                          items:
 *                              $ref: "#components/schemas/Task"
 *          500:
 *              description: Could not fulfill request 
 */

taskRouter.get("/", verifyToken, access("admin", "manager", "member"), async (req, res) => {
    const user = req.user;
    
    try {    
        let filter = {};

        if(user.roles.includes("member")){
            filter = {username: user.username};
        } else if(user.roles.includes("manager")){
            const withinTheDay = Date.now() - 24 * 60 * 60 * 1000;
            filter.createdAt = {$gt: withinTheDay}
        }

        const tasks = await Task.find(filter);
        return res.status(201).send(tasks);

    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not retrieve tasks"});
    }
});

/**
 * @swagger
 * /tasks/create:
 *  post:
 *      summary: To create a new task
 *      tags: [Tasks]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema: 
 *                      type: object
 *                      properties:
 *                          task:
 *                              type: string
 *                              description: task name
 *                          priority:
 *                              type: string
 *                              description: low/medium/high
 *                          deadline:
 *                              type: string
 *                              description: deadline (dd/mm/yy)
 *      responses: 
 *          200:
 *              description: The task was created successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              msg: 
 *                                  type: string
 *          500:
 *              description: Could not fulfill request
 */

taskRouter.post("/create", verifyToken, access("member"), async(req, res)=>{
    const {task, priority, deadline} = req.body;
    try {
        const isTask = new Task({task, priority, deadline: deadline, approvedToDelete:"no", user_id:req.id, username:req.username});
        await isTask.save();
        return res.status(200).send({"msg":"Task successfully created", "item":isTask});   
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not post task"});
    }
})

/**
 * @swagger
 * /tasks/update/{id}:
 *  patch:
 *      summary: To update a task
 *      tags: [Tasks]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: string
 *            description: ID of the task to update
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema: 
 *                      type: object
 *                      properties:
 *                          task:
 *                              type: string
 *                              description: task name
 *                          priority:
 *                              type: string
 *                              description: low/medium/high
 *                          status:
 *                              type: string
 *                              description: in-progress/completed
 *                          deadline:
 *                              type: string
 *                              description: deadline (dd/mm/yy)
 *      responses: 
 *          200:
 *              description: The task was successfully updated.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              msg: 
 *                                  type: string
 *          500:
 *              description: Could not fulfill request
 */

taskRouter.patch("/update/:id", verifyToken, access("member") ,async(req, res)=>{
    const {task, priority, status, deadline} = req.body; 
    const {id} = req.params;

    try {
        const isTask = await Task.findByIdAndUpdate({_id:id}, {task:task, status:status, priority:priority, deadline:deadline});
        const updatedTask = await Task.findById({_id:id});
        res.status(200).send({"msg":"Task updated succesfully", "item":updatedTask});
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not update Task"});
    }
})

/**
 * @swagger
 * /tasks/approveToDelete/{id}:
 *  patch:
 *      summary: To approve a task to be deleted (only by manager)
 *      tags: [Tasks]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: string
 *            description: ID of the task to update
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      responses: 
 *          200:
 *              description: The task has been approved to delete.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              msg: 
 *                                  type: string
 *          500:
 *              description: Could not fulfill request
 */

taskRouter.patch("/approveToDelete/:id", verifyToken, access("manager"), async(req, res)=>{
    const {id} = req.params;
    try {
        const isTask = await Task.findByIdAndUpdate({_id:id}, {approvedToDelete:"yes"});
        const updatedTask = await Task.findById({_id:id});
        res.status(200).send({"msg":"Task has been approved to delete", "item":updatedTask});
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not approve task for deletion"});
    }
})

/**
 * @swagger
 * /tasks/delete/{id}:
 *  delete:
 *      summary: To delete a task (only if approved by manager)
 *      tags: [Tasks]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: string
 *            description: ID of the task to delete
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      responses: 
 *          200:
 *              description: The task has been approved to delete.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              msg: 
 *                                  type: string
 *          500:
 *              description: Could not fulfill request
 */
taskRouter.delete("/delete/:id", verifyToken, access("member"), async(req, res)=>{
    const {id} = req.params;
    try {
        const isTask = await Task.findById({_id:id});

        if(isTask.approvedToDelete=="yes"){
            await Task.findByIdAndDelete({_id:id});
            return res.status(200).send({"msg":"Task Deleted Successfully"});
        } else {
            return res.status(400).send({"msg":"This task has not been approved by the manager to delete."})
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Internal Server Error: Error occured while deleting task"});
    }
})


module.exports = {
    taskRouter
}