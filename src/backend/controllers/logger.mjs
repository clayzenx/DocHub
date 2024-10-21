import logger from "../utils/logger/index.mjs";

export default (app) => {
    app.put('/logger/update-level', (req, res) => {
        const secret = req.query.secret;
        if (secret !== process.env.VUE_APP_DOCHUB_RELOAD_SECRET) {
            res.status(403).send({
                error: `Error reload secret is not valid [${secret}]`
            });
        } else {
            if (logger.level) {
                const result = logger.level(req.query.level);
                res.status(result.message ? 200 : 400).send(result);
            }
        }
    });
};