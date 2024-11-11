import storeManager from '../storage/manager.mjs';
import { logger } from './logger/index.mjs';
import { parentPort } from 'node:worker_threads';

const LOG_TAG = 'manifest_loader';

storeManager.reloadManifest(null).then(async(result) => {
    logger.log('Loading manifest finished', LOG_TAG, 'info');
    const app = {};
    await storeManager.applyManifest(app, result, true, true);
    logger.log('Apply manifest in primary worker finished', LOG_TAG, 'debug');
    parentPort.postMessage(app.storage);
});
