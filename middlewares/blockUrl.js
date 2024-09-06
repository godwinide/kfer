const { default: axios } = require("axios");

module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2 || req.hostname == 'localhost') {
            return next();
        }
        return res.redirect('/not-found');
    },
    blockNoneUS: function async(req, res, next) {
        console.log(req.ip)
        if (req.hostname == req.app.hostname1 || req.hostname == req.app.voteUrl || req.hostname == "localhost") {
            axios.get(`https://ipinfo.io/${req.ip}?token=${process.env.IPtoken}`)
                .then((response) => {
                    console.log(response)
                    if (response.data.country === "US") {
                        return res.redirect('/not-found');
                    };
                    return next();
                })
        }
        next();
    }
}
