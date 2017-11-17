const path = require('path');
const express = require('express');
const db = require('mongodb-connection-cache');
const userAuth = require('../../index');

const app = express();

const routerRpc = new express.Router();

app.use('/', routerRpc);

function mountAuth() {
  return userAuth.mount(routerRpc, {
    db: db.get(),
    mail: {
      dirTemplates: path.join(__dirname, 'templates/mail'),
      sender: 'test-sender@gmail.com',
      templates: [
        'confirm-register',
        'confirm-password'
      ]
    },
    path: '/auth'
  });
}

let server = {};

function startServer() {
  const port = 0;

  server = app.listen(port, () => {
    console.log(`Server listening on port ${server.address().port}`);
    app.emit('ready', null);
  });
  exports.server = server;
}

function start() {
  db.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/user_auth')
    .then(mountAuth)
    .then(startServer)
    .catch((error) => {
      console.log(error);
    });
}

function close() {
  db.get().close()
    .then(() => {
      console.log('db closed');
      server.close();
    })
    .catch((error) => {
      console.log('failed closing db');
      throw error;
    });
}

/* eslint no-process-env: "off" */
if (process.env.NODE_ENV === 'test') {
  exports.start = start;
  exports.close = close;
  exports.app = app;
} else {
  start();
}
