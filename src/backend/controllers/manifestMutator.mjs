import { Router } from 'express';

const RESPONSE_STATUSES = {
  200: {
    code: 200,
    message: 'Атрибут объекта успешно обновлен'
  },
  201: {
    code: 201,
    message: 'Атрибут объекта успешно создан'
  },
  204: {
    code: 204,
    message: 'Атрибут объекта успешно удален'
  },
  400: {
    code: 400,
    message: 'Некорректный запрос'
  },
  404: {
    code: 404,
    message: 'Ресурс не найден'
  },
  409: {
    code: 409,
    message: 'Аттрибут с таким именем уже существует'
  }
};

function getObjectEntityByChainPath(object = {}, chainPath) {
  const SEPARATION_SYMBOL = '/';
  let currentEntity = object;
  let childEntity;

  const list = chainPath.split(SEPARATION_SYMBOL);

  for (let i = 0; i < list.length; i++) {
    const path = list[i];
    childEntity = currentEntity[path];

    if (childEntity && typeof childEntity === 'object') {
      currentEntity = childEntity;
      continue;
    }

    return;
  }
  return currentEntity;
}

function addDataLakeToRequest(manifestObject) {
  return function(req, res, next) {
    req.dataLake = manifestObject;
    next();
  };
}

function prepareBody(req, res, next) {
  const errorStatus = RESPONSE_STATUSES['400'];

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    if (body === '') {
      return handleError(res, errorStatus);
    }
    req.body = JSON.parse(body);
    next();
  });

  req.on('error', () => {
    return handleError(res, errorStatus);
  });
}

function validateBody(req, res, next) {
  const errorStatus = RESPONSE_STATUSES['400'];
  const { object, attribute, value } = req.body;

  if (!object || !attribute || value === undefined) {
    return handleError(res, errorStatus);
  }
  next();
}

function validateParams(req, res, next) {
  const errorStatus = RESPONSE_STATUSES['404'];
  const { object, attributeKey } = req.query;

  if (!object || !attributeKey) {
    return handleError(res, errorStatus);
  }
  next();
}

// controllers
function createEntityAttributeInDataLake(req, res) {
  const { dataLake, body } = req;
  const { object, attribute, value } = body;

  const alreadyExistError = RESPONSE_STATUSES['409'];
  const notFountError = RESPONSE_STATUSES['404'];
  const successStatus = RESPONSE_STATUSES['201'];

  const entityForMutation = getObjectEntityByChainPath(dataLake, object);

  if (!entityForMutation) {
    return handleError(res, notFountError);
  }

  if (entityForMutation[attribute]) {
    return handleError(res, alreadyExistError);
  }

  entityForMutation[attribute] = value;
  res.status(successStatus.code).json(successStatus);
}

function deleteEntityAttributeInDataLake(req, res) {
  const { dataLake, query } = req;
  const { object, attributeKey } = query;

  const notFountError = RESPONSE_STATUSES['404'];
  const successStatus = RESPONSE_STATUSES['204'];

  const entityForMutation = getObjectEntityByChainPath(dataLake, object);

  if (
    !entityForMutation ||
    (typeof entityForMutation === 'object' &&
      !Object.keys(entityForMutation).includes(attributeKey))
  ) {
    return handleError(res, notFountError);
  }
  delete entityForMutation[attributeKey];

  res.status(successStatus.code).json(successStatus);
}

function updateEntityAttributeInDataLake(req, res) {
  const { dataLake, body } = req;
  const { object, attribute, value } = body;

  const successStatus = RESPONSE_STATUSES['200'];
  const errorStatus = RESPONSE_STATUSES['404'];

  const entityForMutation = getObjectEntityByChainPath(dataLake, object);

  if (
    !entityForMutation ||
    (typeof entityForMutation === 'object' &&
      !Object.keys(entityForMutation).includes(attribute))
  ) {
    return handleError(res, errorStatus);
  }

  entityForMutation[attribute] = value;
  res.status(successStatus.code).json(successStatus);
}

function handleError(res, status) {
  res.status(status.code).json(status);
}

export default function(app) {
  const { manifest } = app.storage;

  const router = Router();
  router
    .route('/')
    .post(
      prepareBody,
      validateBody,
      addDataLakeToRequest(manifest),
      createEntityAttributeInDataLake
    )
    .delete(
      validateParams,
      addDataLakeToRequest(manifest),
      deleteEntityAttributeInDataLake
    )
    .patch(
      prepareBody,
      validateBody,
      addDataLakeToRequest(manifest),
      updateEntityAttributeInDataLake
    );

  app.use('/manifest-mutation', router);
}
