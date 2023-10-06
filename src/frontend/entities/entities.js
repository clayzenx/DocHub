import {BaseEntities} from '@global/entities/entities.mjs';
import env from '@front/helpers/env';
import crc16 from '@global/helpers/crc16';
import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';
import query from '@front/manifest/query';
import yaml from 'yaml';
import masterSchema from '!!raw-loader!@assets/master-schema.yaml';

let appliedSchemaCRC = null;

class FrontEntities extends BaseEntities {

  // Подключает мастер-схему для подсказок и валидации метамодели
  getMasterSchema() {
    return yaml.parse(masterSchema);
  }

  async queryEntitiesJSONSchema(manifest) {
    return query
      .expression(query.entitiesJSONSchema())
      .evaluate(manifest || {});
  }

  // Генерирует список доступных типов документов
  makeDocTypesEnum() {
    const result = [];
    try {
      for (const id in DocTypes) {
        result.push(DocTypes[id]);
      }
      window?.DocHub?.documents?.fetch().map((item) => result.push(item));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error of building of document types enumeration!');
      // eslint-disable-next-line no-console
      console.error(e);
    }
    return {
      '$doc-types': {
        type: 'string',
        enum: result
      }
    };
  }
}

// Регистрирует кастомные сущности
export default function(manifest) {
  const entities = new FrontEntities();
  entities.registerEntities(entities);
  entities.setManifest(manifest);

  if (env.isPlugin()) {
    entities.loadSchema().then((schema) => {

      entities.updateSchema(schema);

      const schemaString = JSON.stringify(schema);
      // Считаем контрольную сумму
      const crc = crc16(schemaString);
      // Отправляем в плагин только если схема изменилась
      if (crc !== appliedSchemaCRC) {
        window.$PAPI.applyEntitiesSchema(schemaString);
        appliedSchemaCRC = crc;
      }

      // eslint-disable-next-line no-console
    }).catch((e) => console.error(e));
	} else {
    void entities.reloadSchema();
  }
}
