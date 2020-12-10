let express = require("express");
let mustacheExpress = require("mustache-express");
let bodyParser = require("body-parser");
let app = express();

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");

app.engine("mustache", mustacheExpress());

app.get("/dataEntry", function (req, res) {
  res.render("dataEntry", { pageTitle: "Data Privacy" });
});

app.listen(3000, function () {
  console.log("Server started");
});
