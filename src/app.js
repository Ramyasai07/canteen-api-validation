const express = require('express');
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestId);
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', routes);

  // Demo route for testing the 500 path. Disabled unless ENABLE_DEMO_ROUTES=true.
  if (process.env.ENABLE_DEMO_ROUTES === 'true') {
    app.get('/api/demo/crash', () => {
      const secret = null;
      return secret.value; // deliberate bug: TypeError
    });
  }

  app.use(notFound);      // 1. unknown routes become NotFoundError
  app.use(errorHandler);  // 2. LAST middleware: every error ends here
  return app;
}

module.exports = createApp;
