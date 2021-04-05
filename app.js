const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");

const sailingFactory = require("./sites/sailingFactory");
const kubryk = require("./sites/kubryk");

const PORT = process.env.PORT || 8080;

require("dotenv").config();

// Initialize Express
let app = express();

// database
mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => {
    console.log(err);
  });

// cron.schedule("*/1 * * * *", () => {
sailingFactory.saveToDb();
kubryk.saveToDb();
// });

app.listen(PORT, function () {
  console.log("App listening on port " + PORT);
});
