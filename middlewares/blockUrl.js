const { default: axios } = require("axios");

module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return next();
        }
        return res.redirect('/not-found');
    },
    blockNoneUS: function async(req, res, next) {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const userIp = xForwardedFor ? xForwardedFor.split(',')[0] : req.ip;
        if (req.hostname == req.app.hostname1 || req.hostname == req.app.voteUrl || req.hostname == "localhost") {
            axios.get(`https://ipinfo.io/${userIp}?token=7eaa7df72317f6`)
                .then((response) => {
                    console.log(response.data.country)
                    if (response.data.country === "US") {
                        return res.redirect('/not-found');
                    };
                    return next();
                })
        }
        next();
    }
}
