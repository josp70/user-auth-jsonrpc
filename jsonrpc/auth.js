const users = require('../model/users.js');
const rpcErrors = require('../errors/rpc-errors.js');
const basicAuth = require('basic-auth');
const jsonrpcLite = require('jsonrpc-lite');
const mailer = require('mailer-template');
const url = require('url');
const jwks = require('jwks-db');

const jsonrpc = {};

exports.jsonrpc = jsonrpc;

function isUndefined(value) {
  return typeof value === 'undefined' || value === null;
}

function getParameter(req, name) {
  const value = req.body.params[name];

  if (isUndefined(value)) {
    throw jsonrpcLite.JsonRpcError.invalidParams({
      message: 'missing parameter',
      parameter: name
    });
  }
  return value;
}

function sendRegisterMail(req, infoUser) {
  const view = {
    href: url.format({
      host: req.get('host'),
      pathname: `${req.path}/confirm/register`,
      protocol: req.protocol,
      query: {
        email: infoUser.email,
        token: infoUser.token
      }
    }),
    profile: infoUser.profile
  };

  return mailer.sendMail(infoUser.email, 'confirm-register', view)
    .then((infoSend) => {
      console.log('Message sent: %s', infoSend.messageId);

      /* eslint no-process-env: 0 */
      if (process.env.NODE_ENV === 'test') {
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
        infoUser.mail = {html: infoSend.message.html};
      }
      return infoUser;
    });
}

function isObject(obj) {
  return (obj !== null) &&
    !Array.isArray(obj) &&
    typeof obj === 'object' &&
    Object.keys(obj).length > 0;
}

jsonrpc.register = (req) => {
  const email = getParameter(req, 'email');
  const password = getParameter(req, 'password');
  const profile = getParameter(req, 'profile');

  if (!isObject(profile)) {
    throw jsonrpcLite.JsonRpcError.invalidParams({
      message: 'parameter profile must be a non empty object',
      parameter: 'profile'
    });
  }

  return users.register(email, password, profile)
    .then((result) => sendRegisterMail(req, result));
};

jsonrpc.login = (req) => {
  const user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return Promise.reject(rpcErrors.unauthorized({
      reason: 'Basic authorization required'
    }));
  }

  return users.login(user.name, user.pass);
};

function extractJWT(token) {
  if (isUndefined(token)) {
    return Promise.reject(rpcErrors.invalidJWS({
      reason: 'missing bearer token'
    }));
  }
  return jwks.verifyJWS(token)
    .then((decoded) => {
      if (isUndefined(decoded.payload.sub)) {
        return Promise.reject(rpcErrors.invalidJWS({
          reason: 'missing claim sub'
        }));
      }
      if (isUndefined(decoded.payload.admin)) {
        return Promise.reject(rpcErrors.invalidJWS({
          reason: 'missing claim admin'
        }));
      }
      return decoded;
    });
}

jsonrpc.updateProfile = (req) => {
  const email = getParameter(req, 'email');
  const profile = getParameter(req, 'profile');

  return extractJWT(req.token)
    .then((decoded) => {
      if (decoded.payload.sub !== email && !decoded.payload.admin) {
        return Promise.reject(rpcErrors.unauthorized({
          email,
          reason: 'not allowed to modify user',
          sub: decoded.payload.sub
        }));
      }
      return users.updateProfile(email, profile);
    });
};

jsonrpc.updatePermission = (req) => {
  const email = getParameter(req, 'email');
  const permission = getParameter(req, 'permission');

  return extractJWT(req.token)
    .then((decoded) => {
      if (!decoded.payload.admin) {
        return Promise.reject(rpcErrors.unauthorized({
          reason: 'only admin users are allowed to update permission',
          sub: decoded.payload.sub
        }));
      }
      return users.updatePermission(email, permission);
    });
};
