const { v4: uuidv4 } = require("uuid");
let express = require("express");
let mustacheExpress = require("mustache-express");
let bodyParser = require("body-parser");
let fs = require("fs");

let app = express();

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");

app.engine("mustache", mustacheExpress());

let db = {};

app.get("/enterData", function (req, res) {
  const id = uuidv4();
  res.render("enterData", { id: id, pageTitle: "Data Privacy" });
});

app.post(
  "/saveData",
  express.urlencoded({ extended: true }),
  function (req, res) {
    let { id, data } = req.body;
    fs.writeFileSync(`/tmp/${id}.json`, data);
  }
);

app.listen(3000, function () {
  console.log("Server started");
});
