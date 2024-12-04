export default {
    log(text, tag = '', level = 'info') {
        // eslint-disable-next-line no-console
        // console.log(`${Date.now()} [${level}]:${tag}:${text}`);
    },
    info(text, tag = '') {
      // eslint-disable-next-line no-console
      // console.info(`${Date.now()} [info]:${tag}:${text}`);
    },
    error(text, tag = '') {
      // eslint-disable-next-line no-console
      // console.error(`${Date.now()} [error]:${tag}:${text}`);
    }
};

