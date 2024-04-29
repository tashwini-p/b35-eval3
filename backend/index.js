const express = require("express");
const { connectToDB } = require("./src/config/dbConfig");
const { userRouter } = require("./src/routes/user.router");
const { taskRouter } = require("./src/routes/task.router");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const port = 7700;
const app = express();

app.use(express.json());

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Task Manager',
        version: '1.0.0',
      },
    },
    apis: ['./src/routes/*.js'], // files containing annotations as above
  };
  
const openapiSpecification = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));
app.use("/users", userRouter);
app.use("/tasks", taskRouter);

app.get("/", (req, res)=>{
    res.send(`Server is up!`);
})

app.listen(port, async ()=>{
    try {
        await connectToDB();
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})