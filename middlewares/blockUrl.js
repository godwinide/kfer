module.exports = {
    blockURL: function (req, res, next) {
        if (req.hostname == req.app.mainURL || req.hostname == req.app.mainURL2) {
            return next();
        }
        res.redirect('/not-found');
    }
}