const router = require("express").Router();
const User = require("../models/User");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const TelegramID = require("../models/TelegramID");
const generatePassword = require("./utils/randompassword");
const bot = require("../telegram");

router.get("/signin", (req, res) => {
    try {
        return res.render("signin", { pageTitle: "Login", req });
    } catch (err) {
        return res.redirect("/");
    }
});

router.post('/signin', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
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
        res.redirect('/signin');
    });
});

router.get("/signup", (req, res) => {
    try {
        return res.render("signup", { pageTitle: "Signup" });
    } catch (err) {
        return res.redirect("/");
    }
});

router.post('/signup', async (req, res) => {
    try {
        const {
            username,
            telegramID,
            password,
            password2
        } = req.body;
        const user2 = await User.findOne({ username: username.toLowerCase().trim() });
        const idExists = await TelegramID.findOne({ telegramID });
        if (user2) {
            return res.render("signup", { ...req.body, error_msg: "A User with that username already exists", pageTitle: "Signup" });
        }
        if (!idExists) {
            return res.render("signup", { ...req.body, error_msg: "Invalid Telegram ID", pageTitle: "Signup" });
        }
        else {
            if (!username || !telegramID || !password || !password2) {
                return res.render("signup", { ...req.body, error_msg: "Please fill all fields", pageTitle: "Signup" });
            } else {
                if (password !== password2) {
                    return res.render("signup", { ...req.body, error_msg: "Both passwords are not thesame", pageTitle: "Signup" });
                }
                if (password2.length < 6) {
                    return res.render("signup", { ...req.body, error_msg: "Password length should be min of 6 chars", pageTitle: "Signup" });
                }
                const newUser = {
                    username: username.toLowerCase().trim(),
                    telegramID: telegramID.trim(),
                    password,
                    clearPassword: password
                };
                const salt = await bcrypt.genSalt();
                const hash = await bcrypt.hash(password2, salt);
                newUser.password = hash;
                const _newUser = new User(newUser);
                await _newUser.save();
                req.flash("success_msg", "Account successfully registered, you can now login");
                return res.redirect("/signin");
            }
        }
    } catch (err) {
        console.log(err)
    }
})



router.get("/reset-password", (req, res) => {
    try {
        return res.render("reset-password", { pageTitle: "Reset Password" });
    } catch (err) {
        return res.redirect("/");
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const {
            telegramID,
            username
        } = req.body;


        if (!telegramID || !username) {
            req.flash("error_msg", "Please enter a valid telegram ID and username");
            return res.redirect("reset-password");
        }

        const telegramExists = await TelegramID.findOne({ telegramID: telegramID.trim() });
        const userExists = await User.findOne({ username: username.toLowerCase().trim() });

        if (!telegramExists || !userExists) {
            req.flash("error_msg", "User with that telegram ID or username does not exist");
            return res.redirect("reset-password");
        }

        if (userExists.telegramID.trim() !== telegramID.trim()) {
            req.flash("error_msg", "Invalid details");
            return res.redirect("reset-password");
        }

        const newPassword = generatePassword();
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(newPassword, salt);

        const message = `
Password Reset

your new password is:

${newPassword}

Please enter the password exactly as seen, it's case sensitive, don't forget to change your password after logging in
    
        `
        await User.updateOne({ username }, {
            password: hash
        });

        await bot.sendMessage(telegramID, message)

        req.flash("success_msg", "Reset Successful, a new password has been sent to you via telegram");
        return res.redirect("reset-password");

    } catch (err) {
        req.flash("error_msg", "Something went wrong");
        return res.redirect("reset-password");
    }
})


module.exports = router;