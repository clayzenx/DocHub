import datasets from '../helpers/datasets.mjs';
import cache from '../storage/cache.mjs';
import {DEFAULT_ROLE, isRolesMode} from '../utils/rules.mjs';

// Создает ответ на JSONata запрос и при необходимости кэширует ответ
// app - express app instance
// query - jsonata запрос
// [res] - http response object
// [params] - request query params
// [subject] - request query subject
// [ruleId] - current rule id
export async function makeJSONataQueryResponse(app, query, res, params, subject, ruleId) {
  let key;
  if (isRolesMode()) {
    key = { query, params, subject, ruleId };
  } else {
    key = { query, params, subject };
  }
  cache.pullFromCache(app.storage.hash, JSON.stringify(key), async () => {
    let context;
    if (isRolesMode()) {
      context = ruleId === '' ? app.storage.manifests[DEFAULT_ROLE] : app.storage.manifests[ruleId];
      storeManager.resetCustomFunctions(context);
    } else {
      context = app.storage.manifest;
    }
    return await datasets(app).parseSource(
      context,
      query,
      subject,
      params
    );
  }, res);
}

