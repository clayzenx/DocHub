import request from './request.mjs';
import datasetDriver from '../../global/datasets/driver.mjs';
import jsonataDriver from '../helpers/jsonata.mjs';
import pathTool from '../../global/manifest/tools/path.mjs';
import entities from '../entities/entities.mjs';
import {isRolesMode, DEFAULT_ROLE} from '../utils/rules.mjs';
import md5 from 'md5';
import source from '../../global/datasets/source.mjs';
import cache from '../storage/cache.mjs';


export default function(app) {

	let currentContext;

	if(isRolesMode()) {
		currentContext = app.storage.roleId === DEFAULT_ROLE ? app.storage.manifests[DEFAULT_ROLE] : app.storage.manifests[app.storage.roleId];
		entities(currentContext);
	} else {
		currentContext = app.storage.manifest;
	}

	const result = Object.assign({}, datasetDriver,
		{
			// Возвращаем метаданных об объекте
			pathResolver(path) {
				return {
					context: currentContext,
					subject: pathTool.get(currentContext, path),
					baseURI: app.storage.md5Map[md5(path)]
				};
			},
			// Драйвер запросов к ресурсам
			request,
			// Драйвер запросов JSONata
			jsonataDriver,
			// Включает/выключает трассировку запросов JSONata
			traceJsonata: process.env.VUE_APP_DOCHUB_JSONATA_ANALYZER?.toLowerCase() === 'y',
			async parseSource(context, data, subject, params, baseURI) {
				const sourceType = source.type(data);
				if (sourceType === 'id') {
					return await cache.pullFromCache(app.storage.hash, `{"path":"/datasets/${data}"}`, async() => {
						return await this.parentParseSource(context, data, subject, params, baseURI);
					});
				} else {
					return await this.parentParseSource(context, data, subject, params, baseURI);
				}
			}
		});

	result.parentParseSource = datasetDriver.parseSource.bind(result);

	return result;
}
