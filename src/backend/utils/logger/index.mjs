import winston from './logger.mjs';
import jsonataLogger from './jsonata-logger.mjs';

const logger = process.env.VUE_APP_DOCHUB_LOGGER_ENABLE?.toLowerCase() === 'on'
    ? winston 
    : {
        log(text, tag = '', level = 'info') {
            // eslint-disable-next-line no-console
            console.log(`${Date.now()} [${level}]:${tag}:${text}`);
        },
        info(text, tag = '') {
            // eslint-disable-next-line no-console
            console.info(`${Date.now()} [info]:${tag}:${text}`);
        },
        error(text, tag = '') {
            // eslint-disable-next-line no-console
            console.error(`${Date.now()} [error]:${tag}:${text}`);
        }
    };

export { jsonataLogger, logger };
