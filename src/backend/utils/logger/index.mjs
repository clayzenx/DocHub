import winston from './logger.mjs';

const logger = process.env.VUE_APP_DOCHUB_LOGGER_LOGFILE 
    ? winston 
    : {
        log(text, tag = '') {
            // eslint-disable-next-line no-console
            console.log(`${Date.now()}:${tag}:${text}`);
        },
        info(text, tag = '') {
            // eslint-disable-next-line no-console
            console.info(`${Date.now()}:${tag}:${text}`);
        },
        error(text, tag = '') {
            // eslint-disable-next-line no-console
            console.error(`${Date.now()}:${tag}:${text}`);
        }
    };

export default logger;
