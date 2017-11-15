const express = require('express');
const userAuth = require('./user-auth-jsonrpc');
const {MongoClient} = require('mongodb');
const path = require('path');

// create the express app object
const app = express();

// create the authentication router
let routerRpc = express.Router();
app.use('/', routerRpc);

function start() {
    return MongoClient.connect('mongodb://localhost:27017/user_auth')
        .then(db => {
            // mount the router on the path '/auth'
            return userAuth.mount(routerRpc, {
                path: '/auth',
                db: db,
                mail: {
                    sender: 'sender@gmail.com',
                    dirTemplates: path.join(__dirname, 'templates/mail'),
                    templates: ['confirm-register', 'confirm-password']
                }
            });
        })
        .then(_=>{
            app.listen(0, _=>{
                console.log('Server started');
            });
        });
};

start();
