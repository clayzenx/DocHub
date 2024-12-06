export function prepareRequestBody(req, res, next) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    if (body === '') {
      res.status(400).json({ message: 'Отсуствует тело запроса' });
    }
    req.body = JSON.parse(body);
    next();
  });

  req.on('error', () => {
    return res.status(500).json({ message: 'Ошибка на сервере' });
  });
}
