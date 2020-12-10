const { v4: uuidv4 } = require("uuid");
let express = require("express");
let mustacheExpress = require("mustache-express");
let bodyParser = require("body-parser");
let fs = require("fs");
let isAfter = require("date-fns/isAfter");
let add = require("date-fns/add");
let parse = require("date-fns/parse");
let startOfDay = require("date-fns/startOfDay");
let format = require("date-fns/format");
let app = express();
let { randomKey, encrypt, decrypt } = require("./encrypt.js");

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());

let db = {};

app.get("/", function (req, res) {
  res.redirect("/enterData");
});

app.get("/enterData", function (req, res) {
  const id = uuidv4();
  const defaultExpiry = format(add(new Date(), { days: 30 }), "yyyy-MM-dd");
  res.render("enterData", {
    id: id,
    pageTitle: "Data Privacy",
    defaultExpiry: defaultExpiry,
  });
});

app.get("/viewData", function (req, res) {
  const { id, key } = req.query;
  let file;
  try {
    file = fs.readFileSync(`/tmp/${id}.json`, {
      encoding: "utf8",
    });
  } catch (err) {
    file = null;
  }
  if (file === null) {
    res.render("expired");
  }
  const { encryptedData, expiresAt } = JSON.parse(file);
  const data = decrypt(key, encryptedData);
  const expiresAtDate = parse(expiresAt, "yyyy-MM-dd", new Date());

  if (isAfter(startOfDay(new Date()), expiresAtDate)) {
    fs.unlinkSync(`/tmp/${id}.json`);
    res.render("expired");
  } else {
    res.render("viewData", { data: data, pageTitle: "Data Privacy" });
  }
});

app.post(
  "/saveData",
  express.urlencoded({ extended: true }),
  function (req, res) {
    const { id, data, expiresAt } = req.body;
    const key = randomKey();
    const encryptedData = encrypt(key, data);
    fs.writeFileSync(
      `/tmp/${id}.json`,
      JSON.stringify({
        encryptedData: encryptedData,
        expiresAt: expiresAt,
      }),
      { encoding: "utf8" }
    );
    const protocol = req.secure ? "https" : "http";
    const host = req.headers.host;
    const link = `${protocol}://${host}/viewData?id=${id}&key=${key}`;
    res.render("shareLink", { link: link, pageTitle: "Data Privacy" });
  }
);

app.listen(3000, function () {
  console.log("Server started");
});
