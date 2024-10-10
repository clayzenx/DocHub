import express from 'express';
import md5 from 'md5';
import './helpers/env.mjs';
import compress from '../global/compress/compress.mjs';
import { WorkerStack } from './utils/worker-stack.mjs';

const compressor = compress();

const app = express();
const PORT = global.$smartants.baseUrl.port;
const { maxWorkers, workerTimeout, source } = global.$smartants;

const smartantsWorkerThreads = new WorkerStack(maxWorkers, source, workerTimeout, 100000);

app.get(`/${global.$smartants.pathUrl}:data`, async (req, res) => {
    const query = JSON.parse(await compressor.decodeBase64(req.params.data));
    try {
        const result = await smartantsWorkerThreads.execute({ params: query, queryID: md5(req.params.data) });
        res.send(result);
    } catch (err) {
        res.status(503).send('Smartants internal Error');
    }
});

app.listen(PORT);
