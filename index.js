/* eslint no-process-env: "off" */

const mailer = require('mailer-template');
const jsonrpc = require('jsonrpc2-express');
const bearerToken = require('express-bearer-token');
const jwks = require('jwks-db');
const confirm = require('./http/confirm');
const authRpc = require('./jsonrpc/auth');
const users = require('./model/users');
const apiKey = require('./model/api-key');

function configDb(options) {
  if (!options.db) {
    throw Error('mongodb connection required in options.db');
  }
  users.setDb(options.db);
  return options;
}

function configMail(options) {
  if (!options.mail) {
    throw Error('mail options required in options.mail');
  }
  return mailer.connect(options.mail).then(() => {
    console.log('mailer connected');
    return options;
  });
}

function configJWKS(options) {
  if (!options.db) {
    throw Error('mongodb connection required in options.db');
  }
  return jwks.connect(options.db).then(() => options);
}


function configRouter(router, options) {
  if (!options.path) {
    throw Error('url path required in options.path, ej. "/auth');
  }
  router.use(bearerToken());
  jsonrpc(options.path, router, {
    methods: authRpc.jsonrpc
  });
  router.get(`${options.path}/confirm/register`, confirm.register);
  router.get(`${options.path}/confirm/password`, confirm.password);
  return Promise.resolve(options);
}

function configAdmin(options) {
  if (process.env.ADMIN_USER) {
    if (process.env.ADMIN_USER === '' ||
       (typeof process.env.ADMIN_PASSWORD === 'undefined' ||
        process.env.ADMIN_PASSWORD === '')) {
      return Promise.reject(new Error('Invalid ADMIN_USER/ADMIN_PASSWORD'));
    }
    return users.createAdminAccount(process.env.ADMIN_USER,
                                  process.env.ADMIN_PASSWORD)
      .then(() => options);
  }
  return Promise.resolve(options);
}

function configApiKey(options) {
  const key = process.env.API_KEY || '';

  apiKey.setApiKey(key);
  return Promise.resolve(options);
}

exports.mount = (router, options) => configRouter(router, options)
  .then(configDb)
  .then(configMail)
  .then(configJWKS)
  .then(configAdmin)
  .then(configApiKey);

exports.errors = require('./errors/rpc-errors');
