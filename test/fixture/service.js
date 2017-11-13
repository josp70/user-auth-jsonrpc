const path = require('path');
const express = require('express');
const db = require('mongodb-connection-cache');
const userAuth = require('../../index');

const app = express();

let routerRpc = express.Router();

app.use('/', routerRpc);

function mountAuth() {
    return userAuth.mount(routerRpc, {
	path: '/auth',
	db: db.get(),
	mail: {
            sender: 'test-sender@gmail.com',
            dirTemplates: path.join(__dirname, 'templates/mail'),
            templates: ['confirm-register', 'confirm-password']
        }
    });
}

let server;
function startServer() {
    server = app.listen(0, () => {
	console.log('Server listening on port ' + server.address().port);
	app.emit('ready', null);
    });
    exports.server = server;
};

function start() {
    db.connect('mongodb://localhost:27017/user_auth')
	.then(mountAuth)
	.then(startServer);
};

function close() {
    db.get().close().then(()=>{
	console.log('db closed');
	server.close();
    }).catch(err=>{
	console.log("failed closing db");
	console.log(err);
    });
}

if(process.env.NODE_ENV !== 'test') {
    start();
} else {
    exports.start = start;
    exports.close = close;
    exports.app = app;
}
