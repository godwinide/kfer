const axios = require("axios");

module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return next();
        }
        return res.redirect('/not-found');
    },
    blockPhishingUrl: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return res.redirect('/not-found');
        }
        return next();
    },
}
