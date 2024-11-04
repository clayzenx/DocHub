import storeManager from '../storage/manager.mjs';
import logger from './logger.mjs';
import { parentPort } from 'node:worker_threads';

const LOG_TAG = 'manifest_loader';

storeManager.reloadManifest(null).then((result) => {
    logger.log('Loading manifest finished', LOG_TAG);
    parentPort.postMessage(result);
});