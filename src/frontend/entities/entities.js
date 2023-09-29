// Обрабатывает кастомные сущности
import query from '@front/manifest/query';
import crc16 from '@global/helpers/crc16';
import env from '@front/helpers/env';
import yaml from 'yaml';
import masterSchema from '!!raw-loader!@assets/master-schema.yaml';
import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';

let appliedSchema = null;
let lastKnownManifest = null;
let appliedSchemaCRC = null;

async function loadSchema() {

  //todo Здесь нужно рефачить, чтобы запросы в бэк ходили
  const queryResult = await query
    .expression(query.entitiesJSONSchema())
    .evaluate(lastKnownManifest || {});

  const master = getMasterSchema();

  const $defs = {
    ...master.$defs,
    ...queryResult.$defs,
    ...makeDataSetSchema(lastKnownManifest)
  };

  const $rels = makeSubjectsRelationsSchema(lastKnownManifest || {});

  // Превращаем схему в строку для передачи в плагин
  const schema = {
    ...queryResult,
    properties: {
      ...master.$entities,
      ...queryResult.properties
    },
    $defs: {
      ...$defs,
      ...makeDefsEnum($defs, $rels),
      ...makeDocTypesEnum()
    },
    // Добавляем схемы связей с субъектами сущностей
    $rels
  };

  // eslint-disable-next-line no-console
  console.log('schema created');

  return schema;
}

async function reloadSchema() {
  if (appliedSchema !== null && lastKnownManifest !== null) {
    appliedSchema = await loadSchema();
  }
}

export async function getSchema() {
  if (appliedSchema === null && lastKnownManifest !== null) {
    appliedSchema = await loadSchema();
  }
  return appliedSchema;
}

// Подключает мастер-схему для подсказок и валидации метамодели
function getMasterSchema() {
    return yaml.parse(masterSchema);
}

// Генерируем схемы связей
function makeSubjectsRelationsSchema(manifest) {
	try {
		const rels = {};
		for (const entityId in manifest.entities || {}) {
			const objects = manifest.entities[entityId].objects;
			// Если сущность не публикует субъекты, то игнорируем ее
			if (!objects) continue;
			// Генерируем схемы связей с объектами
			for (const subjectId in objects) {
				const route = (objects[subjectId].route || '/').split('/');
				let location = manifest[entityId] || {};
				for (let i = 1; i < route.length; i++) {
					const pice = route[i];
					pice?.length && (location = location[route[i]] || {});
				}
				const objId = `${entityId}.${subjectId}`;
				rels[objId] = {
					type: 'string',
					minLength: 1,
					enum: Object.keys(location)
				};
			}
		}
		return rels;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Error of building of relations enumeration!');
		// eslint-disable-next-line no-console
		console.error(e);
		return {};
	}
}

// Генерирует схему DataSet
function makeDataSetSchema(manifest) {
	return {
		$dataset: {
			type: 'string',
			enum: Object.keys(manifest.datasets || {})
		}
	};
}


// Генерирует перечисления для подсказок
function makeDefsEnum($defs, $rels) {
	let items = [];
	try {
		items = Object.keys($defs).map((item) => `#/$defs/${item}`);
		Object.keys($rels).map((item) => items.push(`#/$rels/${item}`));
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Error of building of definitions enumeration!');
		// eslint-disable-next-line no-console
		console.error(e);

	}
	return {
		'$defs': {
			type: 'string',
			enum: items
		}
	};
}

// Генерирует список доступных типов документов
function makeDocTypesEnum() {
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

// Регистрирует кастомные сущности
export default function(manifest) {
  lastKnownManifest = manifest;

  if (env.isPlugin()) {
    loadSchema().then((schema) => {

      const schemaString = JSON.stringify(schema);
      // Считаем контрольную сумму
      const crc = crc16(schemaString);
      // Отправляем в плагин только если схема изменилась
      if (crc !== appliedSchemaCRC) {
        window.$PAPI.applyEntitiesSchema(schemaString);
        appliedSchemaCRC = crc;
      }
      // Отправляем в плагин только если схема изменилась
      if (schema !== appliedSchema) {
        window.$PAPI.applyEntitiesSchema(JSON.stringify(schema));
        appliedSchema = schema;
      }
      // eslint-disable-next-line no-console
    }).catch((e) => console.error(e));
	} else {
    void reloadSchema();
  }
}
