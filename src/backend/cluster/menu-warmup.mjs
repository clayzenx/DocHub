import jsonata from '../helpers/jsonata.mjs';
import queries from '../../global/jsonata/queries.mjs';
import { logger } from '../utils/logger/index.mjs';

const LOG_TAG = 'menu-warmup';

export default async function(app) {
    logger.log('Menu cache warm up started', LOG_TAG, 'info');

    try {
      const query = queries.makeQuery(queries.QUERIES[queries.IDS.USER_MENU]);
      await jsonata.makeJSONataQueryResponse(app, query);
    } catch(e) {
      logger.error(e.message, LOG_TAG, 'error'); 
    }

    logger.log('Menu cache warm up finished', LOG_TAG, 'info');
}
