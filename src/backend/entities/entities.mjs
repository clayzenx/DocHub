import {BaseEntities} from '../../global/entities/entities.mjs';
import queries from '../../global/jsonata/queries.mjs';
import driver from '../helpers/jsonata.mjs';
import yaml from 'yaml';
import {loadFromAssets} from '../storage/cache.mjs';

class BackendEntities extends BaseEntities {

  // Подключает мастер-схему для подсказок и валидации метамодели
  getMasterSchema() {
    return yaml.parse(loadFromAssets('master-schema.yaml'));
  }
  async queryEntitiesJSONSchema(manifest) {
    const query = queries.makeQuery(queries.QUERIES[queries.IDS.JSONSCEMA_ENTITIES]);
    let result = null;
    try {
      result = await driver
        .expression(query)
        .evaluate(manifest);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        throw e;
      }
      return result;
  }
}


// Регистрирует кастомные сущности
export default function(manifest, schema) {
  const entities = new BackendEntities();
  entities.registerEntities(entities);
  entities.setManifest(manifest);
  if (schema) {
    entities.updateSchema(schema);
  } else {
    void entities.reloadSchema();
  }
}
