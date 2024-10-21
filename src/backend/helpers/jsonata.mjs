import JSONataDriver from '../../global/jsonata/driver.mjs';
import logger from '../utils/logger/index.mjs';

export default function() {
    return Object.assign({}, JSONataDriver, {logger});
}
