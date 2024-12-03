import JSONataDriver from '../../global/jsonata/driver.mjs';
import { jsonataLogger } from '../utils/logger/index.mjs';

export default Object.assign({}, JSONataDriver, { logger: jsonataLogger });
