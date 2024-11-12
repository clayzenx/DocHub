import datasets from '../helpers/datasets.mjs';
import { logger } from '../utils/logger/index.mjs';

const LOG_TAG = 'validators_warmup';

export default async function(app) {

    logger.log('Validators cache warm up started', LOG_TAG, 'info');

    const datasetsForApp = datasets(app);

    logger.log(`Validators cache warm datasetsForApp = ${datasetsForApp}`, LOG_TAG, 'info');
    logger.log(`Validators cache warm app.storage.manifest.datasets = ${app.storage.manifest.datasets}`, LOG_TAG, 'info');

    for (const key in app.storage.manifest.datasets) {
        logger.log(`Validators cache warm key = ${key}`, LOG_TAG, 'info');

        await datasetsForApp.getData(app.storage.manifest, { origin: key, source: '({})' });
    }

    logger.log('Validators cache warm up finished', LOG_TAG, 'info');
}
