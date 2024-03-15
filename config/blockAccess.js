module.exports = {
    blockAccess: function (req, res, next) {
        // if (req.hostname === "fan-famosity.site") {
        //     return res.status(403).send('Forbidden');
        // }
        // Allow access for the allowed domain
        next();
    }
}