import { logger } from '../utils/logger/index.mjs';
import redis from '../drivers/redis.mjs';

const LOG_TAG = 'cluster-cache';

const CLUSTER_MASTER_INFO = 'SEAF.master';
const CLUSTER_MASTER_COMMAND = 'SEAF.master.command';
const CLUSTER_MASTER_COMMAND_STATE = 'SEAF.master.state';
const CLUSTER_MANIFEST = 'SEAF.manifest.';
const CLUSTER_CACHE_PREFIX = 'SEAF.cache.';

const CLUSTER_MASTER_TIMEOUT = 60000;
const MASTER_SET_CHECK = 2;
const CLEAR_CACHE_DELAY = 60000;

export const NodeStatus = Object.freeze({
    MASTER: 0,
    WAIT: 1,
    SLAVE: 2,
    NO_MANIFEST: 3,
    RELOAD: 4
});


export class ClusterCache {

    async updateCommandState(state) {
        try {
            await this.redis.set(CLUSTER_MASTER_COMMAND_STATE, state);
        } catch (error) {
            logger.log(`Update command state ${state} in redis failed. Error ${error}`, LOG_TAG, 'error');
        }
    }

    async getCommandState() {
        try {
            return await this.redis.get(CLUSTER_MASTER_COMMAND_STATE);
        } catch (error) {
            logger.log(`Get command state from redis failed. Error ${error}`, LOG_TAG, 'warn');
        }
        return undefined;
    }

    async setCommand(command) {
        try {
            await this.redis.set(CLUSTER_MASTER_COMMAND, command);
        } catch (error) {
            logger.log(`Set command ${command} to redis failed. Error ${error}`, LOG_TAG, 'warn');
        }
    }

    async status(nodeId) {
        try {

            const info = JSON.parse(await this.redis.get(CLUSTER_MASTER_INFO) || '{}');

            if (!info.updated || Date.now() - info.updated > CLUSTER_MASTER_TIMEOUT) {
                await this.redis.set(CLUSTER_MASTER_INFO, JSON.stringify({
                    id: nodeId,
                    counter: MASTER_SET_CHECK,
                    updated: Date.now()
                }));
                await this.updateCommandState('Not ready');
                return {status: NodeStatus.WAIT};
            } else if (info.id === nodeId) {
                if (info.counter > 0 || !info.manifest) {
                    await this.redis.set(CLUSTER_MASTER_INFO, JSON.stringify({
                        id: nodeId,
                        counter: Math.max(info.counter - 1, 0),
                        updated: Date.now()
                    }));
                    return {status: info.counter <= 1 ? NodeStatus.NO_MANIFEST : NodeStatus.WAIT};
                } else {
                    info.updated = Date.now();
                    await this.redis.set(CLUSTER_MASTER_INFO, JSON.stringify(info));
                    const command = await this.redis.get(CLUSTER_MASTER_COMMAND);
                    if (command === 'manifest_reload') {
                        await this.redis.del(CLUSTER_MASTER_COMMAND);
                        return {status: NodeStatus.RELOAD};
                    }
                    return {status: NodeStatus.MASTER, manifest: info.manifest};
                }
            } else {
                return {status: info.manifest ? NodeStatus.SLAVE : NodeStatus.WAIT, manifest: info.manifest};
            }
        } catch (error) {
            logger.log(`Status communication to redis failed. Error ${error}`, LOG_TAG, 'warn');
        }
        return {status: NodeStatus.WAIT};
    }

    async setManifest(storage) {
        try {
            await this.redis.set(CLUSTER_MANIFEST + storage.hash, JSON.stringify(storage));
            const info = JSON.parse(await this.redis.get(CLUSTER_MASTER_INFO));
            info.updated = Date.now();
            info.manifest = storage.hash;
            await this.redis.set(CLUSTER_MASTER_INFO, JSON.stringify(info));
            setTimeout(() => this.clearCache(info.manifest), CLEAR_CACHE_DELAY);
        } catch (error) {
            logger.log(`Set manifest to redis failed. Error ${error}`, LOG_TAG, 'warn');
        }
    }

    async getManifest(hash) {
        try {
            return JSON.parse(await this.redis.get(CLUSTER_MANIFEST + hash));
        } catch (error) {
            logger.log(`Get manifest from redis failed. Error ${error}`, LOG_TAG, 'warn');
        }
        return undefined;
    }

    async clearCache(hash) {
        try {
            let cursor = 0;
            do {
                const scanResult = await this.redis.scan(cursor, '*');
                const keysToDelete = scanResult.keys.filter((key) => {
                    const keyStr = key.toString();
                    return keyStr.startsWith(CLUSTER_MANIFEST) && !keyStr.startsWith(CLUSTER_MANIFEST + hash)
                        || keyStr.startsWith(CLUSTER_CACHE_PREFIX) && !keyStr.startsWith(CLUSTER_CACHE_PREFIX + hash);
                });
                if (keysToDelete.length > 0) {
                    await this.redis.del(keysToDelete);
                }
                cursor = scanResult.cursor;
            } while (cursor !== 0);
        } catch (error) {
            logger.log(`Clear redis cache failed. Error ${error}`, LOG_TAG, 'warn');
        }
    }

    async init() {
        this.redis = await redis();
        if (!this.redis) {
            const message = 'I can not create a cluster because connecting to Redis is impossible';
            logger.error(message, LOG_TAG);
            throw new Error(message);
        }
    }

    constructor() {
    }
}
