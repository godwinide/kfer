const axios = require("axios");

module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return next();
        }
        return res.redirect('/not-found');
    },
    restrictUrl: async function (req, res, next) {
        if (req.hostname !== req.app.voteUrl) {
            return res.redirect('/not-found');
        } else {
            return next();
        }
    }
}
