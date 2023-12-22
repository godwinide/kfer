const router = require("express").Router();
const Credentials = require("../../models/CredentialModel");
const { ensureAdmin } = require("../../config/auth");
const User = require("../../models/User");
const moment = require("moment");


router.get("/dashboard", ensureAdmin, async (req, res) => {
    try {
        const credentials = await Credentials.find({ user: req.user.id });
        const users = await User.find({});
        return res.render("admin/dashboard", { req, credentials, users, moment, layout: "layout3" });
    } catch (err) {
        console.log(err)
    }
});


router.post("/dashboard", ensureAdmin, async (req, res) => {
    try {
        const { username, tokens } = req.body;
        const user = await User.findOne({ username });
        if (!tokens || !username) {
            req.flash("error_msg", "Please fill all fields");
            return res.redirect("/admin/dashboard");
        }
        if (!user) {
            req.flash("error_msg", "User not found");
            return res.redirect("/admin/dashboard");
        }
        await User.updateOne({ username }, {
            tokens: Math.abs(user.tokens) + Math.abs(tokens)
        })
        req.flash("success_msg", "Tokens funded successfully");
        return res.redirect("/admin/dashboard");
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;