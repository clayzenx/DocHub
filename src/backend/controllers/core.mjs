import datasets from '../helpers/datasets.mjs';
import jsonata from '../helpers/jsonata.mjs';
import storeManager from '../storage/manager.mjs';
import cache from '../storage/cache.mjs';
import queries from '../../global/jsonata/queries.mjs';
import helpers from './helpers.mjs';
import compression from '../../global/compress/compress.mjs';
import {getRoles, getUserName} from '../helpers/jwt.mjs';
import { logger } from '../utils/logger/index.mjs';
import {DEFAULT_ROLE, getCurrentRuleId, getCurrentRules, isRolesMode} from '../utils/rules.mjs';
import { prepareRequestBody } from '../middlewares/prepareRequestBody.mjs';
import bitbucket from '../helpers/bitbucket.mjs';
import axios from 'axios';
import { checkRepositoryAPI } from '../middlewares/checkRepositoryAPI.mjs';

const compressor = compression();

const LOG_TAG = 'controller-core';
export default (app) => {

    function checkRulesManifest(ruleName) {
        for(let key in app.storage.manifests) {
            if(key === ruleName) {
                return true;
            }
        }
        return false;
    }

    // Парсит переданные во внутреннем формате данные 
    function parseRequest(req) {
        return {
            query: req.params.query,
            params: req.query?.params ? JSON.parse(req.query?.params) : undefined,
            subject: req.query?.subject ? JSON.parse(req.query?.subject) : undefined,
            baseURI: req.query?.baseuri
        };
    }

    // Получаем тайтл из переменной окружения
    app.get('/api/title', (_, res) => {
      res.json({ title: process.env.VUE_APP_DOCHUB_TITLE || 'SEAF' });
    });

    // Выполняет произвольные запросы 
    app.get('/core/storage/jsonata/:query', async function(req, res) {
        if (!helpers.isServiceReady(app, res)) return;
        const start = Date.now();
        let userName;

        let id;
        if(isRolesMode()) {
            const roles = getRoles(req.headers);
            userName = getUserName(req.headers);
            id = await getCurrentRuleId(roles);
            const currentRules = await getCurrentRules(roles);
            app.storage = {...app.storage, roles: [...currentRules], roleId: id};
        }
        const request = parseRequest(req);
        const query = (request.query.length === 36) && queries.QUERIES[request.query]
            ? `(${queries.makeQuery(queries.QUERIES[request.query], request.params)})`
            : request.query;

        await jsonata.makeJSONataQueryResponse(app, query, res, request.params, request.subject, id);
        const jsonLog = JSON.stringify({
          userName,
          time: Date.now() - start,
          originalUrl: req.originalUrl
        });
        logger.log(jsonLog, LOG_TAG, 'info');
    });

    // Запрос на обновление манифеста
    app.put('/core/storage/reload', async function(req, res) {
        const start = Date.now();
        const reloadSecret = req.query.secret;
        if (reloadSecret !== process.env.VUE_APP_DOCHUB_RELOAD_SECRET) {
            res.status(403).json({
                error: `Error reload secret is not valid [${reloadSecret}]`
            });
            return;
        } else if(app.storage?.isCluster) {
            process.send({type:'manifest_reload'});
            res.json({ message: 'command sent' });
        } else {
            let userName;
            if(isRolesMode()) {
                app.storage = {...app.storage, manifests: null};
            }
            const oldHash = app.storage.hash;
            await storeManager.reloadManifest(app)
                .then((storage) => storeManager.applyManifest(app, storage))
                .then(() => cache.clearCache(oldHash))
                .then(() => res.json({ message: 'success' }));

            userName = getUserName(req.headers);
            const jsonLog = JSON.stringify({
              userName,
              time: Date.now() - start,
              originalUrl: req.route.path
            });
            logger.log(jsonLog, LOG_TAG, 'info');
        }
    });

    // Выполняет произвольные запросы 
    app.get('/core/storage/release-data-profile/:query', async function(req, res) {
        if (!helpers.isServiceReady(app, res)) return;
        const start = Date.now();
        let userName;

        const request = parseRequest(req);

        let storageManifest = app.storage.manifest;
        let key = {
            path: request.query,
            params: request.params
        };

        if(isRolesMode()) {
            const roles = getRoles(req.headers);
            const id = await getCurrentRuleId(roles);
            const currentRules = await getCurrentRules(roles);
            userName = getUserName(req.headers);
            app.storage = {...app.storage, roles: [...currentRules], roleId: id};
            storageManifest = app.storage.manifests[id];
            key ={
                path: request.query,
                params: request.params,
                roles: id
            };
        }

        await cache.pullFromCache(app.storage.hash, JSON.stringify(key), async() => {
                if (request.query.startsWith('/'))
                    return await datasets(app).releaseData(request.query, request.params);
                else {
                    let profile = null;
                    const params = request.params;
                    if (request.query.startsWith('{'))
                        profile = JSON.parse(request.query);
                    else
                        profile = JSON.parse(await compressor.decodeBase64(request.query));

                    const ds = datasets(app);
                    if (profile.$base) {
                        const path = ds.pathResolver(profile.$base);
                        if (!path) {
                            res.status(400).json({
                                error: `Error $base location [${profile.$base}]`
                            });
                            return;
                        }
                        return await ds.getData(path.context, profile, params, path.baseURI);
                    } 
                    if (profile.separateDatasets && typeof profile.origin === 'object') {
                        const origin = await Promise.all(Object.keys(profile.origin).map(async(id) => {
                            return { [id]: await ds.releaseData(`/datasets/${id}`) };
                        }));
                        return await ds.getData(origin, { source: profile.source}, params);
                    }
                    return await ds.getData(storageManifest, profile, params);
                }
            }, res);

            const jsonLog = JSON.stringify({
              userName,
              time: Date.now() - start,
              originalUrl: req.originalUrl
            });
            logger.log(jsonLog, LOG_TAG, 'info');
    });

    // Возвращает результат работы валидаторов
    app.get('/core/storage/problems/', async function(req, res) {
        if (!helpers.isServiceReady(app, res)) return;
        const start = Date.now();
        let userName;


        if(isRolesMode()) {
            const roles = getRoles(req.headers);
            const currentRules = await getCurrentRules(roles);
            const id = await getCurrentRuleId(roles);
            userName = getUserName(req.headers);
            app.storage = {...app.storage, roles: [...currentRules], roleId: id};

            if (!checkRulesManifest(id)) {
                app.new_rules = currentRules;
                await storeManager.createNewManifest(app);
            }
        }
        res.json(app.storage.problems || []);
        const jsonLog = JSON.stringify({
          userName,
          time: Date.now() - start,
          originalUrl: req.originalUrl
        });
        logger.log(jsonLog, LOG_TAG, 'info');
    });

    // Создает коммит в репозитории
    app.post(
        '/core/storage/put-content/:hash',
        checkRepositoryAPI,
        prepareRequestBody,
        async function requestBitbucket(req, res) {
            const hash = req.params.hash || '$unknown$';
            const startPath = app.storage?.md5Map[hash]
                .split('@')[1]
                .split('/')
                .slice(0, -1)
                .join('/');

            const userName = getUserName(req.headers);
            const { url, content } = req.body;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
            const [protocol, projectID, repositoryID, source] =
                process.env.VUE_APP_DOCHUB_ROOT_MANIFEST.split(':');

            const [branch] = source.split('@');
            const requestUri = bitbucket.makeSourceURI(projectID, repositoryID);

            const data = new URLSearchParams();
            data.append('branch', branch);
            data.append('author', userName ?? '');

            if (url) {
                data.append(`/${startPath}/` + url, content);
            } else {
                for (let url in content) {
                    data.append(`/${startPath}/` + url, content[url]);
                }
            }

            try {
                const result = await axios({
                    method: 'POST',
                    url: requestUri.toString(),
                    data
                });

                const uri = app.storage.md5Map[hash];
                const layer = app.storage.findLayers((layer) => layer.uri === uri);
                const layersToUpdate = layer.owner?.imported
                    .map(({ uri }) => uri)
                    .filter((uri) => uri !== layer.uri);

                await app.storage.onChange(layersToUpdate);

                res.status(result.status).json({message: result.statusText});
            } catch (err) {
                res.status(err.response.status).json(err.response.data);
            }

        }
    );
};

