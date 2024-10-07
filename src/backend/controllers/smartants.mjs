import md5 from 'md5';
import cache from '../storage/cache.mjs';
import compress from '../../global/compress/compress.mjs';
import { WorkerStack } from '../utils/worker-stack.mjs';

const compressor = compress();
const { source, maxWorkers, workerTimeout, mode } = global.$smartants;
const smartantsWorkerThreads = mode === 'thread' ? new WorkerStack(maxWorkers, source, workerTimeout, 100000) : null;

export default function(app) {
    app.get('/smartants/:data', (req, res) => {
        cache.pullFromCache('smartants', req.params.data, async () => {
            if (mode === 'service') {
                return (
                    fetch(new URL(encodeURIComponent(req.params.data), global.$smartants.baseUrl))
                    .then((res) => res.json())
                    .catch((err) => ({ message: err }))
                );
            } else if (mode === 'thread') {
                const query = JSON.parse(await compressor.decodeBase64(req.params.data));
                return await smartantsWorkerThreads.execute({ params: query, queryID: md5(req.params.data) });
            }
        }).then((result) => {
            if (result?.result !== 'OK') {
                res.status(500).send({ message: 'Smartants Error', result });
            } else {
                res.send(result);
            }
        });
    });
}
