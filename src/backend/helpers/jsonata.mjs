import JSONataDriver from '../../global/jsonata/driver.mjs';
import { jsonataLogger } from '../utils/logger/index.mjs';
import { makeJSONataQueryResponse } from './jsonata-query.mjs'

export default Object.assign({}, JSONataDriver, { logger: jsonataLogger }, { makeJSONataQueryResponse });
