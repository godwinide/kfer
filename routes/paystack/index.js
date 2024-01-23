const https = require('https');
const User = require('../../models/User');
const Paystack = require('../../paystack');
const router = require("express").Router();

router.get("/transaction/verify/:reference/:username", async (req, res) => {
    const username = req.params.username;
    const referenceCode = req.params.reference;

    Paystack.transaction.verify(referenceCode, async (error, body) => {
        if (error) {
            console.error(error);
        } else {
            const amount = (body.data.amount / 100) - 100;
            const tokens = Number(amount / 1500)
            const user = await User.findOne({ username });
            await User.updateOne({ username }, { tokens: Number(user.tokens) + tokens })
            return res.json({ success: true });
        }
    });

});

module.exports = router;