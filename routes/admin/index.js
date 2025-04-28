const router = require("express").Router();
const Credentials = require("../../models/CredentialModel");
const { ensureAdmin } = require("../../config/auth");
const User = require("../../models/User");
const moment = require("moment");
const bot = require("../../telegram");

router.get("/dashboard", ensureAdmin, async (req, res) => {
    try {
        // const credentials = await Credentials.find({});
        // const users = await User.find({});
        return res.render("admin/dashboard", { req, moment, layout: "layout3" });
    } catch (err) {
        console.log(err)
    }
});

router.post("/dashboard", ensureAdmin, async (req, res) => {
    try {
        const { username, tokens, tokenType } = req.body;
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!tokens || !username) {
            req.flash("error_msg", "Please fill all fields");
            return res.redirect("/bad-admin/dashboard");
        }
        if (!user) {
            req.flash("error_msg", "User not found");
            return res.redirect("/bad-admin/dashboard");
        }
        if (tokenType == 'true') {
            await User.updateOne({ username }, {
                tokens: Math.abs(user.tokens) + Math.abs(tokens)
            })
        } else {
            await User.updateOne({ username }, {
                usTokens: Math.abs(user.usTokens) + Math.abs(tokens)
            })
        }
        await bot.sendMessage(user.telegramID, `
You've received ${tokens} ${tokenType == 'true' ? '' : 'US'} tokens.
        `)
            .catch((res) => console.log(""));
        req.flash("success_msg", "Tokens funded successfully");
        return res.redirect("/bad-admin/dashboard");
    } catch (err) {
        console.log(err)
    }
});

router.post("/fund-all", ensureAdmin, async (req, res) => {
    try {
        const { tokens } = req.body;
        const users = await User.find({});

        users.forEach(async user => {
            const { username } = user;

            await User.updateOne({ username }, {
                tokens: Math.abs(user.tokens) + Math.abs(tokens)
            })

            await bot.sendMessage(user.telegramID, `
    You've received ${tokens} tokens.
    You now have ${Math.abs(user.tokens) + Math.abs(tokens)} tokens.
            `)
                .catch((res) => console.log(""));
        });

        req.flash("success_msg", "Tokens funded successfully");
        return res.redirect("/bad-admin/dashboard");
    } catch (err) {
        console.log(err)
    }
});


router.post("/send-mesage", ensureAdmin, async (req, res) => {
    try {
        const { message } = req.body;
        console.log(message)
        const users = await User.find({});
        users.forEach(async user => {
            await bot.sendMessage(user.telegramID, message)
                .catch((res) => console.log(""));
        });
        req.flash("success_msg", "Message Sent");
        return res.redirect("/bad-admin/dashboard");
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;