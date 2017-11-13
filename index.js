const mailer = require('mailer-template');
const jsonrpc = require('jsonrpc2-express')
const bearerToken = require('express-bearer-token');
const jwks = require('jwks-db');
const confirm = require('./http/confirm');
const authRpc = require('./jsonrpc/auth');
const users = require('./model/users');

function configDb(options) {
    if(!options.db) {
	throw Error('mongodb connection required in options.db');
    }
    users.setDb(options.db);
    return options;
}

function configMail(options) {
    if(!options.mail) {
	throw Error('mail options required in options.mail');
    }
    return mailer.connect(options.mail).then(_ => {
	console.log('mailer connected');
	return options;
    })
}

function configJWKS(options) {
    if(!options.db) {
	throw Error('mongodb connection required in options.db');
    }
    return jwks.connect(options.db).then(_ => {return options;});
}


function configRouter(router, options) {
    if(!options.path) {
	throw Error('url path required in options.path, ej. "/auth');
    }
    router.use(bearerToken());
    router.get(options.path + '/confirm/register', confirm.register);
    router.get(options.path + '/confirm/password', confirm.password);
	      
    jsonrpc(options.path, router, {
	methods: authRpc.jsonrpc
    });
    return Promise.resolve(options);
}

exports.mount = function(router, options) {
    return configRouter(router,options)
	.then(configDb)
	.then(configMail)
	.then(configJWKS);
};

exports.errors = require('./errors/rpc-errors');
