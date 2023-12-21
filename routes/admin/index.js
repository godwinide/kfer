const router = require("express").Router();
const { linkTypes, templates } = require("../constants");
const Links = require("../models/LinkModel");
const Credentials = require("../models/CredentialModel");
const { ensureAuthenticated } = require("../config/auth");
const ShortUniqueId = require("short-unique-id");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const moment = require("moment");


router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        const credentials = await Credentials.find({ user: req.user.id }).limit(10);
        const links = await Links.find({ user: req.user.id }).limit(10);

        const linkscount = await Links.find({ user: req.user.id }).count();
        const credentialscount = await Credentials.find({ user: req.user.id }).count();

        return res.render("dashboard", { req, credentials, moment, credentialscount, linkscount, links, layout: "layout2" });
    } catch (err) {
        console.log(err)
    }
});

router.get("/pricing", ensureAuthenticated, async (req, res) => {
    return res.render("pricing", { moment, req, layout: "layout2" });
});


module.exports = router;