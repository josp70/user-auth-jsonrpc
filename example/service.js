const express = require('express');
const userAuth = require('user-auth-jsonrpc');
const {MongoClient} = require('mongodb');
const path = require('path');

// Create the express app object
const app = express();

// Create the authentication router
const routerRpc = new express.Router();

app.use('/', routerRpc);

function start() {
  return MongoClient.connect('mongodb://localhost:27017/user_auth')
    .then((db) =>
          // Mount the router on the path '/auth'
          userAuth.mount(routerRpc, {
            db,
            mail: {
              dirTemplates: path.join(__dirname, 'templates/mail'),
              sender: 'sender@gmail.com',
              templates: [
                'confirm-register',
                'confirm-password'
              ]
            },
            path: '/auth'
          }))
    .then(() => {
      const port = 0;

      app.listen(port, () => {
        console.log('Server started');
      });
    });
}

start();
