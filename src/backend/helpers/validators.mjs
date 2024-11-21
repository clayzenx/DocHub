import validators from '../../global/rules/validators.mjs';
import datasets from './datasets.mjs';
import { logger } from '../utils/logger/index.mjs';
import {isRolesMode} from '../utils/rules.mjs';

const LOG_TAG = 'validators';

const waitForStackToClear = async (context) => {
	return new Promise((resolve) => {
		context.events.on('stackEmpty', () => {
			context.events.removeAllListeners('stackEmpty');
			resolve();
		});
		if(!context.stack.length) context.events.emit('stackEmpty');
	});
}

// Выполняет валидаторы и накладывает исключения
export default async function(app) {
	app.storage.problems = app.storage.problems || [];
	const pushValidator = (validator) => {
		app.storage.problems.push(validator);
	};
	let storageManifest = app.storage.manifest;
	if(isRolesMode()) {
		storageManifest = app.storage.manifests[app.storage.roleId];
	}
	logger.log(`Executing validators.. ${storageManifest}`, LOG_TAG);
	const context = validators(datasets(app), storageManifest, pushValidator, pushValidator);

	await waitForStackToClear(context);
	logger.log('Done.', LOG_TAG, 'info');
}
