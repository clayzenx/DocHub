import './helpers/env.mjs';
import { logger } from './utils/logger/index.mjs';
import express from 'express';
import middlewareCompression from './middlewares/compression.mjs';
import controllerStatic from './controllers/static.mjs';
import controllerCore from './controllers/core.mjs';
import controllerStorage from './controllers/storage.mjs';
import controllerEntity from './controllers/entity.mjs';
import middlewareAccess from './middlewares/access.mjs';
import middlewareCluster from './middlewares/cluster.mjs';
import cluster from 'node:cluster';
import {Worker} from 'node:worker_threads';
import storeManager from './storage/manager.mjs';

const LOG_TAG = 'cluster';

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

    await storeManager.applyManifest(app, manifest, true, false);
    // Подключаем драйвер кластера
    await middlewareCluster(app, storeManager);

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

function startClusterWorker(app, serverPort) {
    // Актуальный манифест
    app.storage = null;
    middlewareAccess(app);

    // Проба readiness
    app.get('/health/readyz', (req, res) => {
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

if (cluster.isPrimary) {
    logger.log(`Master ${process.pid} is running`, LOG_TAG, 'info');

    new Worker('./src/backend/cluster/liveness.mjs');

    let manifest = null;

    logger.log(`Cluster forks: ${process.env.VUE_APP_DOCHUB_CLUSTER_FORKS}`, LOG_TAG, 'info');

    for (let i = 0; i < process.env.VUE_APP_DOCHUB_CLUSTER_FORKS; i++) {
        startWorker(cluster);
    }

    // Пробуем перезапустить рабочие воркеры, если они отвалились.
    // Теоретически сюда может попасть liveness воркер, и он будет перезапущен как обычный. Но, скорее всего в этом
    // случае до этого момента k8s уже прибьет этот под
    cluster.on('exit', (worker) => {
        logger.log(`Worker ${worker.process.pid} died, restarting`, LOG_TAG, 'warn');
        startWorker(worker, manifest);
    });

    // Загружаем манифест в отдельном потоке
    const loadManifest = () => {
        const manifestLoader = new Worker('./src/backend/cluster/manifest_loader.mjs');
        manifestLoader.on('message', (result) => {
            manifest = result;
            for (const id in cluster.workers) {
                cluster.workers[id].send({type: 'manifest', data: manifest});
            }
            logger.log('Spreading manifest to workers finished', LOG_TAG, 'debug');
        });
    };

    // Обрабатываем команду на загрузку манифеста
    cluster.on('message', (worker, message) => {
       if(message.type === 'manifest_reload') {
           loadManifest();
       }
    });

    // костыль. Загрузка манифеста мешает нормальному старту кластера. Нужно разбираться.
    setTimeout(() => loadManifest(), 10000);

} else {

    const app = express();
    const serverPort = process.env.VUE_APP_DOCHUB_BACKEND_PORT || 3030;

    startClusterWorker(app, serverPort);

    process.on('message', (message) => {
        switch (message.type) {
            case 'manifest':
                applyManifest(app, message.data);
                break;
            default:
                logger.log(`Unknown message type ${message.type}`, LOG_TAG, 'warn');
        }
    });


    logger.log(`Worker ${process.pid} started`, LOG_TAG, 'info');
}
