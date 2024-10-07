import { EventEmitter } from 'node:events';
import { Worker } from 'worker_threads';

export class WorkerStack {
    constructor(workerCount, source, workerTimeout, requestTimeout) {
        this.stack = [];
        this.max = workerCount;
        this.source = source;
        this.workerTimeout = workerTimeout;
        this.queueTimeout = requestTimeout;
        this.taskQueue = [];
        this.emitter = new EventEmitter();
        this.dequeue = this.dequeue.bind(this);
        this.emitter.on('ready', this.dequeue);
        if (source) {
            for (let i = 0; i < workerCount; i++) {
                this.stack.push(new Worker(source));
            }
        }
    }
    
    async execute(data) {
        const timeout = new Promise((_resolve, reject) => {
            setTimeout(() => {
                reject('Queue timeout');
            }, this.queueTimeout);
        });
        const result = new Promise((resolve, reject) => {
            this.retrieve().then((worker) => {
                worker.removeAllListeners();
                const controller = setTimeout(() => {
                    worker.terminate();
                    this.put(new Worker(this.source));
                }, this.workerTimeout);
                worker.on('exit', () => {
                    clearTimeout(controller);
                    this.put(new Worker(this.source));
                    reject('Worker terminated');
                });
                worker.on('message', (outcome) => {
                    clearTimeout(controller);
                    this.put(worker);
                    resolve(outcome);
                });
                worker.on('error', (error) => {
                    clearTimeout(controller);
                    this.put(worker);
                    reject(error);
                });
                worker.postMessage(data);
            });
        });
        return Promise.race([timeout, result]);
    }
    
    dequeue() {
        while (this.taskQueue.length > 0 && this.stack.length > 0) {
            this.taskQueue.shift()(this.stack.pop());
        }
    }
    
    put(worker) {
        if (this.stack.length < this.max) {
            this.stack.push(worker);
            if (this.stack.length === 1) {
                this.emitter.emit('ready');
            }
            return true;
        } else return false;
    }
    
    async retrieve() {
        let worker = this.stack.pop();
        if (!worker) {
            let request;
            const promise = new Promise((resolve) => {
                request = resolve;
            });
            this.taskQueue.push(request);
            worker = await promise;
        }
        return worker;
    }
}