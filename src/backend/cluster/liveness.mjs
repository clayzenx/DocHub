import express from 'express';
import { logger } from '../utils/logger/index.mjs';

const LOG_TAG = 'liveness';


const livenessPort = process.env.VUE_APP_DOCHUB_LIVENESS_PORT || 8090;
const app = express();

function startLivenessWorker(app, serverPort) {
  app.get('/health/livez', async(_, res) => {
    return res.status(200).json({ status: 'alive' });
  });

  app.listen(serverPort, () => logger.log(`Liveness fork ${process.pid} running on ${serverPort}`, LOG_TAG, 'info'));
}

startLivenessWorker(app, livenessPort);
