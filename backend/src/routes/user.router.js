require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {User} = require("../models/user.schema");
const {verifyToken} = require("../middlewares/auth.middleware")
const {Blacklist} = require("../models/blacklist.schema");
const { access } = require("../middlewares/access.middleware");
const userRouter = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *      User:
 *          type: object
 *          properties:
 *              _id: 
 *                  type: string
 *                  description: The auto-generated id of the user
 *              username:
 *                  type: string
 *                  description: The username 
 *              email:
 *                  type: string
 *                  description: The unique email of the user
 *              roles:
 *                  type: string
 *                  description: Role of the user
 *              password:
 *                  type: string
 *                  description: Hashed Password of the user                 
 */

/**
 * @swagger
 * /users:
 *  get:
 *      summary: This will fetch all the user data from the database
 *      tags: [Users]
 *      responses: 
 *          200:
 *              description: The list of all the users
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          item:
 *                              $ref: "#components/schemas/User"
 *          500:
 *              description: Cannot fulfill get request
 */

userRouter.get("/", async (req, res)=>{
    try {
        const allUsers = await User.find();
        return res.status(200).send(allUsers);
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not fetch users"});
    }
})

/**
 * @swagger
 * /users/register:
 *  post:
 *      summary: To register a new user
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: "#components/schemas/User"
 *      responses: 
 *          200:
 *              description: The user was successfully registered
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          item:
 *                              $ref: "#components/schemas/User"
 *          400:
 *              description: All fields are required to register user 
 *          500:
 *              description: Could not register user
 */
userRouter.post("/register", async (req, res)=>{
    const {username, email, role, password} = req.body;
    const saltRounds=10;

    if(!username || !email || !role || !password){
        return res.status(400).send({"msg":"All fields are required to register user"});
    }

    try {
        const hashPassword = await bcrypt.hash(password, saltRounds);
        const isUser = new User({username, email, roles:role, password:hashPassword})  
        await isUser.save();
        return res.status(200).send({"item":isUser}); 
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not register user"});
    }
})


/**
 * @swagger
 * /users/login:
 *  post:
 *      summary: To authenticate a user
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *                      required:
 *                          - email
 *                          - password
 *      responses: 
 *          200:
 *              description: The user was successfully logged in
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              msg: 
 *                                  type: string
 *                              accessToken:
 *                                  type: string
 *          400:
 *              description: All fields are required to login user 
 *          500:
 *              description: Could not login
 */
userRouter.post("/login", async (req, res)=> {
    const{email, password} = req.body;
    try {
        const user = await User.findOne({email:email});
        const checkPassword = await bcrypt.compare(password, user.password);
        console.log(checkPassword);

        if(checkPassword){
            const accessToken = await jwt.sign({
                data:{email:user.email, username:user.username, roles:user.roles, id:user._id, status:user.status}
            }, process.env.SECRETKEY, {expiresIn:'1h'});

            return res.status(200).send({"msg":"User logged in successfully!", "accessToken":accessToken});
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not login"});
    }
})

/**
 * @swagger
 * /users/logout:
 *  post:
 *      summary: To logout a user
 *      tags: [Users]
 *      security:
 *          - BearerAuth: []
 *      responses: 
 *          200:
 *              description: The user was successfully logged out.
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

userRouter.post("/logout", verifyToken , async(req, res)=>{
    const accessToken = req.headers.authorization;

    try {
        const isBlacklist = new Blacklist({token: accessToken});
        await isBlacklist.save();
        return res.status(200).send({"msg":"Logout Successful"});
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"Could not logout"});
    }
})


/**
 * @swagger
 * /users/disable/{id}:
 *  patch:
 *      summary: To logout a user
 *      tags: [Users]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: string
 *            description: ID of the user to update
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      responses: 
 *          200:
 *              description: The user was successfully disabled.
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
userRouter.patch("/disable/:id", verifyToken, access("admin") ,async(req, res)=>{
    const {id} = req.params;
    try {
        const user = await User.findByIdAndUpdate({_id:id}, {status:"banned"});
        const updatedUser = await User.findById({_id:id});
        res.status(200).send({"msg":"User banned", "item":updatedUser});
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"User successfully disabled"});
    }
})

/**
 * @swagger
 * /users/enable/{id}:
 *  patch:
 *      summary: To logout a user
 *      tags: [Users]
 *      security:
 *          - BearerAuth: []
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            schema:
 *              type: string
 *            description: ID of the user to update
 *          - in : header
 *            name: Authorization
 *            required: true
 *            schema:
 *              type: string
 *            description: Bearer token for authentication
 *      responses: 
 *          200:
 *              description: The user was successfully enabled.
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
userRouter.patch("/enable/:id", verifyToken, access("admin") ,async(req, res)=>{
    const {id} = req.params;
    try {
        const user = await User.findByIdAndUpdate({_id:id}, {status:"active"});
        const updatedUser = await User.findById({_id:id});
        res.status(200).send({"msg":"User activated", "item":updatedUser});
    } catch (error) {
        console.log(error);
        return res.status(500).send({"msg":"User successfully activated"});
    }
})

module.exports={
    userRouter
}