/* eslint-disable */
import cache from '../storage/cache.mjs';

export default function(app) {
    app.post('/smartants/:query', async(req, res) => {
        console.log('smartants', req.query);
        console.log('smartants body', req.body);
        // cache.pullFromCache()
        res.send('smartants');
    });
}