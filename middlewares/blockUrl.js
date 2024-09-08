const axios = require("axios");

module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return next();
        }
        return res.redirect('/not-found');
    },
    blockNoneUS: async function (req, res, next) {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const userIp = xForwardedFor ? xForwardedFor.split(',')[0] : req.ip;
        console.log(userIp);
        // if (userIp?.length < 13) {
        //     return next();
        // }
        if (req.hostname == req.app.hostname1 || req.hostname == req.app.voteUrl || req.hostname == "localhost") {
            const response = await axios.get(`https://ipinfo.io/${userIp}?token=7eaa7df72317f6`);
            if (response.data.country === "US") {
                return next();
                return res.redirect('/not-found');
            } else {
                return next()
            }
        } else {
            return next();
        }
    }
}
