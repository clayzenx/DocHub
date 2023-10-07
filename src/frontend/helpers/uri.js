import config from '@front/config';
import uriTool from '@global/manifest/tools/uri.mjs';
import env from '@front/helpers/env';
import md5 from 'md5';

export default Object.assign({
    getBaseURIOfPath(path) {
        if (env.isBackendMode()) {
            return `backend://${md5(path)}/`;
        } else {
            const paths = window.Vuex?.state?.sources[path];
            if (!paths) {
                // eslint-disable-next-line no-console
                console.warn(`Не найден путь к свойству [${path}]`);
            }
            return (paths || []).slice(-1)[0];
        }
    }
}, new uriTool(config));
