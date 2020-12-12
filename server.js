const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 3000;
const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const isAfter = require("date-fns/isAfter");
const add = require("date-fns/add");
const parseISO = require("date-fns/parseISO");
const startOfDay = require("date-fns/startOfDay");
const format = require("date-fns/format");
const app = express();
const { randomKey, encrypt, decrypt } = require("./encrypt.js");
const helmet = require("helmet");
const expressEnforcesSSL = require("express-enforces-ssl");
const {
  migrate,
  getInformationById,
  deleteInformationById,
  saveInformation,
} = require("./db.js");

app.set("views", `${__dirname}/views`);
app.set("view engine", "mustache");
app.engine("mustache", mustacheExpress());
app.enable("trust proxy");
app.use(expressEnforcesSSL());
app.use(helmet());
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

app.get("/viewData", async function (req, res) {
  const { id, key } = req.query;
  let information;
  try {
    information = await getInformationById(id);
  } catch (err) {
    information = null;
  }
  if (information === null) {
    res.redirect("/expiredData");
  }
  const { encryptedData, expiresAt } = information;
  const data = decrypt(key, encryptedData);
  const expiresAtDate = parseISO(expiresAt);
  console.log(information);
  console.log(expiresAtDate);
  if (isAfter(startOfDay(new Date()), expiresAtDate)) {
    await deleteInformationById(id);
    res.render("expiredData");
  } else {
    res.render("viewData", { data: data, pageTitle: pageTitle });
  }
});

app.post(
  "/saveData",
  express.urlencoded({ extended: true }),
  async function (req, res) {
    const { id, data, expiresAt } = req.body;
    const key = randomKey();
    const encryptedData = encrypt(key, data);
    await saveInformation({
      id: id,
      encryptedData: encryptedData,
      expiresAt: expiresAt,
    });

    const protocol = req.secure ? "https" : "http";
    const host = req.headers.host;
    const link = `${protocol}://${host}/viewData?id=${id}&key=${key}`;
    res.render("shareLink", { link: link, pageTitle: pageTitle });
  }
);

app.listen(PORT, function () {
  console.log(`Server started on ${PORT}`);
});
