// Обрабатывает кастомные сущности


export class BaseEntities {
	static appliedSchema = null;
	static lastKnownManifest = null;
	static entities = null;

	registerEntities(entities) {
		BaseEntities.entities = entities;
	}

	// Подключает мастер-схему для подсказок и валидации метамодели
	getMasterSchema() {
		throw new Error("Method getMasterSchema is not implemented");
	}


	// Устанавливает манифест, по которому будет сгенерирована схема при необходимости
	setManifest(manifest) {
		BaseEntities.lastKnownManifest = manifest;
	}

	// Генерирует список доступных типов документов
	// по-умолчанию, ограничением является просто строка
	makeDocTypesEnum() {
		return {
			'$doc-types': {
				type: 'string'
			}
		};
	}

	// Генерирует схему DataSet
	makeDataSetSchema(manifest) {
		return {
			$dataset: {
				type: 'string',
				enum: Object.keys(manifest.datasets || {})
			}
		};
	}


	// Генерируем схемы связей
	makeSubjectsRelationsSchema(manifest) {
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

	// Генерирует перечисления для подсказок
	makeDefsEnum($defs, $rels) {
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

	async queryEntitiesJSONSchema() {
		throw new Error("Method queryEntitiesJSONSchema is not implemented");
	}

	// загрузка схемы
	async loadSchema() {
		const queryResult = await this.queryEntitiesJSONSchema(BaseEntities.lastKnownManifest);

		const master = this.getMasterSchema();

		const $defs = {
			...master.$defs,
			...queryResult.$defs,
			...this.makeDataSetSchema(BaseEntities.lastKnownManifest)
		};

		const $rels = this.makeSubjectsRelationsSchema(BaseEntities.lastKnownManifest || {});

		// Превращаем схему в строку для передачи в плагин
		const schema = {
			...queryResult,
			properties: {
				...master.$entities,
				...queryResult.properties
			},
			$defs: {
				...$defs,
				...this.makeDefsEnum($defs, $rels),
				...this.makeDocTypesEnum()
			},
			// Добавляем схемы связей с субъектами сущностей
			$rels
		};

		// eslint-disable-next-line no-console
		console.log('schema created');

		return schema;
	}

	// Пересоздаёт схему по установленному манифесту
	// Но только в случае, что схема уже создавалась (т.е. схемой уже хотя бы раз пользовались)
	async reloadSchema() {
		if (BaseEntities.appliedSchema !== null && BaseEntities.lastKnownManifest !== null) {
			BaseEntities.appliedSchema = await this.loadSchema();
		}
	}

	// Возвращает схему (создаёт, если ещё не создавалась и известен манифест, по которому создавать)
	static async getSchema() {
		if (BaseEntities.appliedSchema === null
			&& BaseEntities.lastKnownManifest !== null
			&& BaseEntities.entities !== null) {
				BaseEntities.appliedSchema = await BaseEntities.entities.loadSchema();
		}
		return BaseEntities.appliedSchema;
	}
}
