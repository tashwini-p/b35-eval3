require("dotenv").config();
const jwt = require("jsonwebtoken");
const { Blacklist } = require("../models/blacklist.schema");

const verifyToken = async(req, res, next) => {
    try {
        
        const authorizationHeader = req.headers.authorization;

        if(!authorizationHeader || !authorizationHeader.startsWith("Bearer")){
            return res.status(401).send({"msg":"Unauthorized. Provide valid token."});
        }

        const accessToken = authorizationHeader.split(" ")[1];
        console.log(accessToken);

        const isBlacklisted = await Blacklist.findOne({token:accessToken});
        if(isBlacklisted){
            return res.status(401).send({"msg":"User is logged out. Please log in again"});
        }

        const decoded = await jwt.verify(accessToken, process.env.SECRETKEY);
        if(decoded){
            req.user = decoded.data;
            req.id = decoded.data.id;
            req.username = decoded.data.username;
            req.role = decoded.data.roles;
            next();
        }

    } catch (error) {
        console.log(error.message);
        return res.send(error.message);
    }
}

module.exports={
    verifyToken
}