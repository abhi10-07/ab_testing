const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
// const expressValidator = require("express-validator");

const pool = require("./middleware/database");
const testingRouter = require("./routes/testing");
const app = express();

const port = 3000;

global.pool = pool;

app.set("port", process.env.port || port); // set express to use this port

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // parse form data client
app.use(logger("dev"));
// app.use(expressValidator());

app.use("/api/v1/testing", testingRouter);

//listener
app.listen(port, function () {
  console.log("Server running on port:" + port);
});
