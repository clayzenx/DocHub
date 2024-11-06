import './helpers/env.mjs';
import logger from './utils/logger.mjs';
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


if (cluster.isPrimary) {
    logger.log(`Master ${process.pid} is running`, LOG_TAG);

    let manifest = null;

    logger.log(`Cluster forks: ${process.env.VUE_APP_DOCHUB_CLUSTER_FORKS}`, LOG_TAG);

    for (let i = 0; i < process.env.VUE_APP_DOCHUB_CLUSTER_FORKS; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        logger.log(`Worker ${worker.process.pid} died, restarting`, LOG_TAG);
        const newWorker = cluster.fork();

        newWorker.once('online', () => {
            if (manifest !== null) {
                newWorker.send({ type: 'manifest', data: manifest });
            }
        });
    });

    const loadManifest = () => {
        const manifestLoader = new Worker('./src/backend/utils/manifest_loader.mjs');
        manifestLoader.on('message', async(result) => {
            const app = {};
            await storeManager.applyManifest(app, result, true, true);
            manifest = app.storage;
            for (const id in cluster.workers) {
                cluster.workers[id].send({type: 'manifest', data: app.storage});
            }
        });
    };

    cluster.on('message', (worker, message) => {
       if(message.type === 'manifest_reload') {
           loadManifest();
       }
    });

    loadManifest();

    const app = express();

    app.get('/live', async(_, res) => {
        return res.status(200).json({
            message: 'app is live'
        });
    });

    app.listen(8090, () => console.log('Live check server running on port 8090'));

} else {

    const app = express();
    const serverPort = process.env.VUE_APP_DOCHUB_BACKEND_PORT || 3030;

    // Актуальный манифест
    app.storage = null;
    middlewareAccess(app);

    app.get('/health', (req, res) => {
        return res.status(app.storage == null ? 503 : 200).json({
            message: app.storage == null ? 'Loading...' : 'Ready'
        });
    });

    const server = app.listen(serverPort, function() {
        logger.log(`Cluster fork ${process.pid} running on ${serverPort}`, LOG_TAG);
    });

    server.setTimeout(500000);

    process.on('message', async(message) => {
       if (message.type === 'manifest') {
            await storeManager.applyManifest(app, message.data, true, false);
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
    });


    logger.log(`Worker ${process.pid} started`, LOG_TAG);
}
