const router = require("express").Router();
const passport = require("passport");

router.get("/signin", (req, res) => {
    try {
        return res.render("admin/signin", { pageTitle: "Login", layout: "layout", req });
    } catch (err) {
        return res.redirect("/");
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/bad-admin/dashboard',
        failureRedirect: '/bad-admin/signin',
        failureFlash: true
    })(req, res, next); 
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/bad-admin/signin');
    });
});



module.exports = router;