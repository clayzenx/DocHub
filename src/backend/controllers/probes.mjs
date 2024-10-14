export default function (app) {

  // Проверка здоровья
  app.get('/health', async (_, res) => {
    return res.status(app.isReady ? 200 : 500).json({
      message: app.isReady ? 'app is alive' : 'app is dead ' + app.errorMessage
    });

  })
}
