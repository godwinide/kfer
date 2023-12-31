const router = require("express").Router();
const { ensureAuthenticated } = require("../../config/auth");
const User = require("../../models/User");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        return res.render("tools/paypal/index", { req, layout: "layout2" });
    } catch (err) {
        console.log(err)
    }
});


router.post("/", ensureAuthenticated, async (req, res) => {
    try {
        const { amount, email, currency } = req.body;
        if (req.user.tokens < 0.25) {
            req.flash("error_msg", "insufficient tokens");
            return res.redirect("/paypal");
        }

        const user = await User.findById(req.user.id);

        await User.updateOne({ _id: user.id }, {
            tokens: Number(user.tokens) - 0.25
        });

        return res.render("tools/paypal/proof", { req, layout: false, amount, email, currency });
    } catch (err) {
        console.log(err)
    }
});

module.exports = router;