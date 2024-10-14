// Подключаем переменные среды
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMARTANTS_PATH = process.env.VUE_APP_DOCHUB_SMART_ANTS_PATH ?? 'smartants/';
const SMARTANTS_BASE = new URL(SMARTANTS_PATH, process.env.VUE_APP_DOCHUB_SMART_ANTS_ADDRESS ?? 'http://127.0.0.1');
SMARTANTS_BASE.port = process.env.VUE_APP_DOCHUB_SMART_ANTS_PORT ?? 3040;

global.$paths = {
    public: path.resolve(__dirname, '../../../public/'),
    dist: path.resolve(__dirname, '../../../dist/'),
    file_storage: (
        process.env.VUE_APP_DOCHUB_BACKEND_FILE_STORAGE 
        ? path.resolve(process.env.VUE_APP_DOCHUB_BACKEND_FILE_STORAGE) 
        : path.resolve(__dirname, '../../../public/')
    )
};

global.$listeners = {
    onFoundLoadingError: process.env.VUE_APP_DOCHUB_BACKEND_EVENT_LOADING_ERRORS_FOUND
};

global.$roles = {
    MODE: process.env.VUE_APP_DOCHUB_ROLES_MODEL,
    URI: process.env.VUE_APP_DOCHUB_ROLES
};

global.$smartants = {
    source: (
        process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE
        ? path.resolve(__dirname, `../../..${process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE}`)
        : path.resolve(__dirname, '../../assets/libs/smartants.js')
    ),
    mode: process.env.VUE_APP_DOCHUB_SMART_ANTS_MODE ?? 'frontend',
    pathUrl: SMARTANTS_PATH,
    baseUrl: SMARTANTS_BASE,
    maxWorkers: process.env.VUE_APP_DOCHUB_SMART_ANTS_MAX_THREADS ?? Math.max(os.cpus().length - 2, 1),
    workerTimeout: process.env.VUE_APP_DOCHUB_SMART_ANTS_WORKER_TIMEOUT ?? 50000
};

global.$parser = {
    source: path.resolve(__dirname, `../../global/manifest/parserWorker.mjs`),
    maxWorkers: process.env.VUE_APP_DOCHUB_PARSER_MAX_THREADS ?? Math.max(os.cpus().length - 2, 1),
    workerTimeout: process.env.VUE_APP_DOCHUB_PARSER_WORKER_TIMEOUT ?? 50000
};

export default dotenv;
