import './helpers/env.mjs';
import { logger } from './utils/logger/index.mjs';
import express from 'express';
import middlewareCompression from './middlewares/compression.mjs';
import controllerStatic from './controllers/static.mjs';
import controllerCore from './controllers/core.mjs';
import controllerStorage from './controllers/storage.mjs';
import controllerEntity from './controllers/entity.mjs';
import middlewareAccess from './middlewares/access.mjs';
import cluster from 'node:cluster';
import {Worker} from 'node:worker_threads';
import storeManager from './storage/manager.mjs';
import {NodeStatus, ClusterCache} from './cluster/cache.mjs';
import storageCache from './storage/cache.mjs';


const LOG_TAG = 'cluster';

const CHECK_CLUSTER_STATUS_INTERVAL = 5000;

function startWorker(cluster, manifest = null) {
    const newWorker = cluster.fork();
    newWorker.once('online',
        () => setTimeout(
            () => newWorker.send({ type: 'manifest', data: manifest })
            , 1000)
    );
}

async function applyManifest(app, manifest) {
    if (manifest === null)
        return;

    await storageCache.clearMemoryCache();

    await storeManager.applyManifest(app, manifest, true, false);

    // Подключаем сжатие контента
    middlewareCompression(app);

    // API ядра
    controllerCore(app);

    // API сущностей
    controllerEntity(app);

    // Контроллер доступа к файлам в хранилище
    controllerStorage(app);

    // Статические ресурсы
    controllerStatic(app);
}

function startClusterWorker(app, serverPort, cache) {
    // Актуальный манифест
    app.storage = null;
    middlewareAccess(app);

    app.get('/health', async(req, res) => {
        const commandState = await cache?.getCommandState();
        return commandState
            ? res.status(200).json({ status: commandState })
            : res.status(503).json({ status: 'Not ready' });
    });

    // Проба readiness
    app.get('/health/readyz', (req, res) => {
        if (app.readyz) {
            return res.status(app.readyz.code).json(app.readyz.message);
        }
        return app.storage == null
            ? res.status(503).json({ status: 'loading manifest' })
            : res.status(200).json({ status: 'ready' });
    });

    // Запуск сервера
    const server = app.listen(serverPort, function() {
        logger.log(`Cluster fork ${process.pid} running on ${serverPort}`, LOG_TAG, 'info');
    });

    server.setTimeout(500000);
}

const cache = new ClusterCache();
await cache.init();

if (cluster.isPrimary) {

    const nodeId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    logger.log(`Master ${process.pid} with nodeId=${nodeId} is running`, LOG_TAG, 'info');

    const noRequestsOnLoading = (process.env.VUE_APP_DOCHUB_CLUSTER_NO_REQUESTS_ON_LOADING || 'off') === 'on';

    let livenessWorker;
    let startLivenessWorker = () => livenessWorker = new Worker('./src/backend/cluster/liveness.mjs');
    startLivenessWorker();
    livenessWorker.on('exit', (code) => {
        logger.log(`Liveness worker died with code: ${code}. Restarting...`, LOG_TAG, 'warn');
        startLivenessWorker();
    });

    let manifest = null;

    const spreadManifest = function() {
        for (const id in cluster.workers) {
            cluster.workers[id].send({type: 'manifest', data: manifest});
        }
        logger.log('Spreading manifest to workers finished', LOG_TAG, 'debug');
    };

    const spreadReadyz = function(status) {
        if (!noRequestsOnLoading)
            return;

        for (const id in cluster.workers) {
            cluster.workers[id].send({type: 'readyz', data: status});
        }
        logger.log(`Spreading readyz ${status} to workers finished`, LOG_TAG, 'debug');
    };

    logger.log(`Cluster forks: ${process.env.VUE_APP_DOCHUB_CLUSTER_FORKS}`, LOG_TAG, 'info');

    for (let i = 0; i < process.env.VUE_APP_DOCHUB_CLUSTER_FORKS; i++) {
        startWorker(cluster);
    }

    // Пробуем перезапустить рабочие воркеры, если они отвалились.
    cluster.on('exit', (worker) => {
        logger.log(`Worker ${worker.process.pid} died, restarting`, LOG_TAG, 'warn');
        startWorker(cluster, manifest);
    });

    let isLoading = false;
    // Загружаем манифест в отдельном потоке
    const loadManifest = () => {
        if (isLoading) {
            logger.log('Manifest is loading', LOG_TAG, 'info');
            return;
        }

        const manifestLoader = new Worker('./src/backend/cluster/manifest-loader.mjs');
        isLoading = true;
        cache.updateCommandState('loading manifest');
        spreadReadyz({code: 503, message: {status: 'Loading manifest'}});

        manifestLoader.once('message', (result) => {
            setTimeout(() => {
                isLoading = false;
                cache.updateCommandState('ready');
            }, CHECK_CLUSTER_STATUS_INTERVAL * 2);

            manifest = result;
            manifest.isCluster = true;
            cache.setManifest(manifest);
            spreadManifest();
            spreadReadyz();
        });
        manifestLoader.onerror = () => {
            isLoading = false;
            manifestLoader.onerror = null;
            cache.updateCommandState('error');
            spreadReadyz();
        };
    };


    setInterval(async() => {
        const status = await cache.status(nodeId);
        switch (status.status) {
            case NodeStatus.MASTER:
                // nothing to do
                break;
            case NodeStatus.SLAVE:
                if (status.manifest && status.manifest !== manifest?.hash) {
                    logger.log(`Slave. Manifest hash updated. Sync. Hash=${status.manifest}`, LOG_TAG, 'info');
                    manifest = await cache.getManifest(status.manifest);
                    if (manifest) {
                        spreadManifest();
                    }
                }
                break;
            case NodeStatus.WAIT:
                logger.log('Waiting', LOG_TAG, 'info');
                break;
            case NodeStatus.NO_MANIFEST:
                if (manifest) {
                    cache.setManifest(manifest);
                    cache.updateCommandState('ready');
                } else {
                    loadManifest();
                }
                break;
            case NodeStatus.RELOAD:
                loadManifest();
                break;
            default:
                logger.log(`Unknown cache status: ${status.status}`, LOG_TAG, 'warn');
        }
    }, CHECK_CLUSTER_STATUS_INTERVAL);

    // Обрабатываем команду на загрузку манифеста
    cluster.on('message', async(worker, message) => {
       if(message.type === 'manifest_reload') {
           const commandState = await cache.getCommandState();
           if (commandState === 'ready' || commandState === 'error') {
               await cache.setCommand('manifest_reload');
           }
       }
    });

} else {

    const app = express();
    const serverPort = process.env.VUE_APP_DOCHUB_BACKEND_PORT || 3030;

    startClusterWorker(app, serverPort, cache);

    process.on('message', (message) => {
        switch (message.type) {
            case 'manifest':
                applyManifest(app, message.data);
                break;
            case 'readyz':
                app.readyz = message.data;
                break;
            default:
                logger.log(`Unknown message type ${message.type}`, LOG_TAG, 'warn');
        }
    });


    logger.log(`Worker ${process.pid} started`, LOG_TAG, 'info');
}
