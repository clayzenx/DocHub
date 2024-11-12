import datasets from '../helpers/datasets.mjs';
import { logger } from '../utils/logger/index.mjs';

const LOG_TAG = 'validators_warmup';

export default async function(app) {

    logger.log('Validators cache warm up started', LOG_TAG, 'info');

    const datasetsForApp = datasets(app);

    for (const key in app.storage.manifest.datasets) {
        await datasetsForApp.getData(app.storage.manifest, { origin: key, source: '({})' });
    }

    logger.log('Validators cache warm up finished', LOG_TAG, 'info');
}
