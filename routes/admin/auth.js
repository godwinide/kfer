const router = require("express").Router();
const passport = require("passport");

router.get("/signin", (req, res) => {
    try {
        return res.render("admin/signin", { pageTitle: "Login", req });
    } catch (err) {
        return res.redirect("/");
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/admin/dashboard',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/admin/signin');
    });
});



module.exports = router;