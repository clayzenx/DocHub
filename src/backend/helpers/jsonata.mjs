import JSONataDriver from '../../global/jsonata/driver.mjs';
import logger from '../utils/logger/index.mjs';

/* export default function() {
    // return Object.assign({}, JSONataDriver, {logger});
    // const driver = Object.create(JSONataDriver);
    JSONataDriver.logger = logger;
    return JSONataDriver;
} */

export default Object.assign({}, JSONataDriver, {logger});
