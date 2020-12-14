const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 3000;
const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const isAfter = require("date-fns/isAfter");
const add = require("date-fns/add");
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
// app.use(helmet());
app.use(express.static("public"));

const pageTitle = "Data Privacy";

app.get("/", function (req, res) {
  res.redirect("/enterData");
});

app.get("/enterData", function (req, res) {
  const id = uuidv4();
  const defaultExpiry = format(add(new Date(), { days: 30 }), "yyyy-MM-dd");
  const siteRoot = getURLFromRequest(req);

  res.render("enterData", {
    id,
    pageTitle,
    defaultExpiry,
    siteRoot,
  });
});

app.get("/expiredData", function (req, res) {
  const siteRoot = getURLFromRequest(req);
  res.render("expiredData", { pageTitle, siteRoot });
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

  if (isAfter(startOfDay(new Date()), expiresAt)) {
    await deleteInformationById(id);
    res.redirect("/expiredData");
  } else {
    const siteRoot = getURLFromRequest(req);
    res.render("viewData", { data, pageTitle, siteRoot, id });
  }
});

app.post("/saveData", express.urlencoded({ extended: true }), async function (
  req,
  res
) {
  const { id, data, expiresAt } = req.body;
  const key = randomKey();
  const encryptedData = encrypt(key, data);
  await saveInformation({
    id: id,
    encryptedData: encryptedData,
    expiresAt: expiresAt,
  });

  const link = `/viewData?id=${id}&key=${key}`;
  const siteRoot = getURLFromRequest(req);

  res.render("shareLink", { link, pageTitle, siteRoot });
});

app.post("/deleteData", express.urlencoded({ extended: true }), (req, res) => {
  const { id } = req.body;
  deleteInformationById(id);
  res.redirect("/"); // TODO confirm screen
});

const getURLFromRequest = (req) => {
  const protocol = req.secure ? "https" : "http";
  const host = req.headers.host;
  return `${protocol}://${host}`;
};

app.listen(PORT, function () {
  console.log(`Server started on ${PORT}`);
});
