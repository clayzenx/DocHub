import { parentPort } from 'worker_threads';
import cache from '../../backend/storage/cache.mjs';

parentPort.on('message', async (message) => {
  const { uri } = message;

  try {
    const response = await cache.request(uri, '/');

    parentPort.postMessage({ success: true, uri, response });
  } catch (error) {
    parentPort.postMessage({ success: false, uri, error: serializeError(error) });
  }
});

function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    uri: error.uri || null,
  };
}

