const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 3000;
const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const fs = require("fs");
const isAfter = require("date-fns/isAfter");
const add = require("date-fns/add");
const parse = require("date-fns/parse");
const startOfDay = require("date-fns/startOfDay");
const format = require("date-fns/format");
const app = express();
const { randomKey, encrypt, decrypt } = require("./encrypt.js");

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.use(express.static("public"));

const pageTitle = "Data Privacy";

app.get("/", function (req, res) {
  res.redirect("/enterData");
});

app.get("/enterData", function (req, res) {
  const id = uuidv4();
  const defaultExpiry = format(add(new Date(), { days: 30 }), "yyyy-MM-dd");
  res.render("enterData", {
    id: id,
    pageTitle: pageTitle,
    defaultExpiry: defaultExpiry,
  });
});

app.get("/expiredData", function (req, res) {
  res.render("expiredData", { pageTitle: pageTitle });
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
    res.redirect("/expiredData");
  }
  const { encryptedData, expiresAt } = JSON.parse(file);
  const data = decrypt(key, encryptedData);
  const expiresAtDate = parse(expiresAt, "yyyy-MM-dd", new Date());

  if (isAfter(startOfDay(new Date()), expiresAtDate)) {
    fs.unlinkSync(`/tmp/${id}.json`);
    res.render("expiredData");
  } else {
    res.render("viewData", { data: data, pageTitle: pageTitle });
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
    res.render("shareLink", { link: link, pageTitle: pageTitle });
  }
);

app.listen(PORT, function () {
  console.log(`Server started on ${PORT}`);
});
