import { Worker } from 'worker_threads';
import md5 from 'md5';
import cache from '../storage/cache.mjs';
import compress from '../../global/compress/compress.mjs';

const compressor = compress();

export default function(app) {
    app.get('/core/storage/smartants/:data', (req, res) => {
        cache.pullFromCache('smartants', req.params.data, async () => {
            const query = JSON.parse(await compressor.decodeBase64(req.params.data));
            return new Promise((resolve, reject) => {
                const worker = new Worker(global.$paths.smartants);
                worker.on('message', (data) => {
                    worker.terminate();
                    resolve(data);
                });
                worker.on('error', () => {
                    worker.terminate();
                    reject('SmartAnts internal Error');
                });
                worker.postMessage({
                    params: query,
                    queryID: md5(req.params.data)
                });
            });
        }, res);
    });
}
