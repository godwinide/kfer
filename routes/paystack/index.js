const https = require('https');
const User = require('../../models/User');
const Paystack = require('../../paystack');
const bot = require('../../telegram');
const router = require("express").Router();

router.get("/transaction/verify/:reference/:username", async (req, res) => {
    const username = req.params.username;
    const referenceCode = req.params.reference;

    console.log(username, referenceCode);

    Paystack.transaction.verify(referenceCode, async (error, body) => {
        if (error) {
            console.error(error);
        } else {
            const amount = body.data.amount / 100;
            const tokens = Number(amount / 1500)
            const user = await User.findOne({ username });
            await User.updateOne({ username }, { tokens: Number(user.tokens) + tokens });
            await bot.sendMessage(user.telegramID, `
You've received ${tokens} tokens.
You now have ${Math.abs(user.tokens) + Math.abs(tokens)} tokens.`)
                .catch((res) => console.log(""));
            return res.json({ success: true });
        }
    });

});

module.exports = router;