const router = require("express").Router();
const { ensureAuthenticated } = require("../../config/auth");

router.get("/", ensureAuthenticated, async (req, res) => {
    try {
        return res.render("tools/trust-wallet/index", { req, layout: "layout2" });
    } catch (err) {
        console.log(err)
    }
});


module.exports = router;