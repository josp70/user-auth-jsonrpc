/* eslint max-lines: "off" */
/* eslint max-statements: "off" */
/* eslint no-process-env: "off" */
/* global describe, it, after, before */

// During the test the env variable is set to test

process.env.NODE_ENV = 'test';
process.env.ADMIN_USER = 'admin-test@gmail.com';
process.env.ADMIN_PASSWORD = 'admin';

const cheerio = require('cheerio');
const chakram = require('chakram');
const {expect} = chakram;
const uuidv1 = require('uuid/v1');
const API_KEY = uuidv1();

process.env.API_KEY = API_KEY;

const jsonrpcLite = require('jsonrpc-lite');
const service = require('./fixture/service');
const rpcErrors = require('../errors/rpc-errors');
const users = require('../model/users');
const jose = require('node-jose');

const HTTP200 = 200;
const HTTP400 = 400;
const HTTP404 = 404;

function buildRequest(method, params) {
  const id = uuidv1();

  return jsonrpcLite.request(id, method, params);
}

function expectInvalidParam(id, response, name) {
  expect(response)
    .to.comprise
    .json(jsonrpcLite.error(id,
                            jsonrpcLite
                            .JsonRpcError.invalidParams({parameter: name})));
}

function expectUnauthorized(id, response, data) {
  expect(response)
    .to.comprise
    .json(jsonrpcLite.error(id, rpcErrors.unauthorized(data)));
}

function expectInvalidJWS(id, response, data = {}) {
  expect(response)
    .to.comprise
    .json(jsonrpcLite.error(id, rpcErrors.invalidJWS(data)));
}

function expectEntityNotFound(id, response, data = {}) {
  expect(response)
    .to.comprise
    .json(jsonrpcLite.error(id, rpcErrors.entityNotFound(data)));
}

describe('USER-AUTH-JSONRPC', () => {
  const dataTester = {};

  let port = 0,
      url = '',
      schemaSuccess = {},
      schemaError = {};
  const userNormal = 'user-test@gmail.com';
  const userAdmin = process.env.ADMIN_USER;
  const passNormal = 'password';
  const passAdmin = process.env.ADMIN_PASSWORD;
  const profileNormal = {
    name: 'Paco',
    surname: 'Perico',
    company: 'Sus labores'
  };

  const Kb = 1024;
  const permissionTest = {
    gidml: {
      maxcpu: 10,
      maxsize: Kb * Kb * Kb
    }
  };

  before('start server', (done) => {
    service.start();
    service.app.on('ready', () => {
      ({port} = service.server.address());
      url = `http://localhost:${port}`;
      schemaSuccess = {
        'type': 'object',
        'properties': {
          'jsonrpc': {
            'type': 'string',
            'pattern': '^2.0$'
          },
          'id': {
            'type': [
              'integer',
              'string'
            ]
          },
          'result': {
            'type': 'object'
          }
        },
        'required': [
          'id',
          'jsonrpc',
          'result'
        ],
        'additionalProperties': false
      };
      schemaError = {
        'type': 'object',
        'properties': {
          'jsonrpc': {
            'type': 'string',
            'pattern': '^2.0$'
          },
          'id': {
            'type': [
              'integer',
              'string'
            ]
          },
          'error': {
            'type': 'object',
            'properties': {
              'code': {'type': 'integer'},
              'message': {'type': 'string'},
              'data': {'type': 'object'}
            },
            'required': [
              'code',
              'data',
              'message'
            ],
            'additionalProperties': false
          }
        },
        'required': [
          'id',
          'jsonrpc',
          'error'
        ],
        'additionalProperties': false
      };
      console.log('service is ready');
      users.remove(userNormal).then((result) => {
        if (result.deletedCount) {
          console.log(`removed test user ${userNormal}`);
        } else {
          console.log(`not removed test user ${userNormal}`);
        }
        users.login(userAdmin, passAdmin)
          .then((logged) => {
            console.log(logged.token);
            dataTester.tokenAdmin = logged.token;
            done();
          });
      });
    });
  });

  describe('/auth register', () => {
    it('it return 200 & missing parameter when email is undefined', () => {
      const jsonReq = buildRequest('register', {
        password: passNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when email is empty', () => {
      const jsonReq = buildRequest('register', {
        email: '',
        password: passNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when email is not a string', () => {
      const jsonReq = buildRequest('register', {
        email: {},
        password: passNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when password is undefined', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'password');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when password is empty', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: '',
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'password');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when password is not a string', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: {},
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'password');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is undefined', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'profile');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is an empty object', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passNormal,
        profile: {}
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'profile');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is not an object', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passNormal,
        profile: 'hello world!'
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'profile');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('it return 200 on register', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };

      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaSuccess);

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait().then((result) => {
        dataTester.tokenRegister = response.valueOf().body.result.token;
        dataTester.mail = response.valueOf().body.result.mail;
        return Promise.resolve(result);
      });
    });
    it('it return 200 & duplicatedEntity for an already registered user', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.entityDuplicated({
                                  email: userNormal
                                })));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth/confirm/register', () => {

    it('it return 200 & accountNotActivated on login when account not activated', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        'auth': {
          'user': userNormal,
          'pass': passNormal
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.accountNotActivated({
                                  email: userNormal})));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 when confirming email link', () => {
      const dom = cheerio.load(dataTester.mail.html);
      const href = dom('.activate').attr('href');
      // console.log('href = ' + href);
      const response = chakram.get(href);

      expect(response).to.have.status(HTTP200);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 404 when confirming a confirmed user', () => {
      const dom = cheerio.load(dataTester.mail.html);
      const href = dom('.activate').attr('href');
      // console.log('href = ' + href);
      const response = chakram.get(href);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 400 when confirming with no query', () => {
      const response = chakram.get(`${url}/auth/confirm/register`);

      expect(response).to.have.status(HTTP400);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth changePassword', () => {
    it('should test changePassword: UNIMPLEMENTED', () => {
      expect(1).to.equal(1);
      return chakram.wait();
    });
  });

  describe('/auth confirmPassword', () => {
    it('should test confirmPassword: UNIMPLEMENTED', () => {
      expect(1).to.equal(1);
      return chakram.wait();
    });
  });

  describe('/auth login', () => {
    it('it return 200 & unauthorized when no auth header', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response,
                         {reason: 'Basic authorization required'});
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & unauthorized when no X-API-KEY header', () => {
      const jsonReq = buildRequest('login');
      const badUser = 'user_not_found@gmail.com';
      const options = {
        'headers': {'Content-Type': 'application/json'},
        'auth': {
          'user': badUser,
          'pass': 'wrong_password'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response,
        {reason: 'Expected X-API-KEY header'});

      return chakram.wait();
    });

    it('it return 200 & unauthorized when X-API-KEY header does not match', () => {
      const jsonReq = buildRequest('login');
      const badUser = 'user_not_found@gmail.com';
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'X-API-KEY': `${API_KEY}xxx`
        },
        'auth': {
          'user': badUser,
          'pass': 'wrong_password'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response,
        {reason: 'Invalid X-API-KEY header'});

      return chakram.wait();
    });

    it('it return 200 & entityNotFound when wrong user', () => {
      const jsonReq = buildRequest('login');
      const badUser = 'user_not_found@gmail.com';
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        'auth': {
          'user': badUser,
          'pass': 'wrong_password'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectEntityNotFound(jsonReq.id, response, {email: badUser});

      return chakram.wait();
    });

    it('it return 200 & unauthorized when wrong password', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        'auth': {
          'user': userNormal,
          'pass': 'wrong_password'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response, {
        email: userNormal,
        reason: 'password does not match'
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & JWS token', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY
        },
        'auth': {
          'user': userNormal,
          'pass': passNormal
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaSuccess);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait().then((resultToken) => {
        dataTester.tokenLogin = response.valueOf().body.result.token;
        return Promise.resolve(resultToken);
      });
    });
  });

  describe('/auth readProfile', () => {
    it('should return 200 & success when user read its own profile', () => {
      const jsonReq = buildRequest('readProfile', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal,
                                   profile: profileNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('should return 200 & success when admin user read another user profile', () => {
      const jsonReq = buildRequest('readProfile', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal,
                                   profile: profileNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('should return 200 & error when email parameter is missing', () => {
      const jsonReq = buildRequest('readProfile', {
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no bearer token is provided', () => {
      const jsonReq = buildRequest('readProfile', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.invalidJWS({})));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth updateProfile', () => {
    it('it return 200 & error when no bearer token is provided', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.invalidJWS({})));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no email parameter is provided', () => {
      const jsonReq = buildRequest('updateProfile', {
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no profile parameter is provided', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'profile');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when normal user try to modify another user', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: 'another-user@gmail.com',
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response, {
        email: jsonReq.params.email,
        sub: userNormal
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    /*
    it('it return 200 & error when and invalid token is provided', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}xx`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.unauthorized({
                                  email: jsonReq.params.email,
                                  sub: userNormal
                                })));
      after(() => {
        console.log(response.valueOf().body);
      });
      return chakram.wait();
    }); */

    it('it return 200 & error when admin user try to modify account not found', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: 'user-not-found@gmail.com',
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.entityNotFound({
                                  email: jsonReq.params.email
                                })));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & success when admin user try to modify a valid', () => {
      const jsonReq = buildRequest('updateProfile', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & success on valid token matching email', () => {
      const profile = profileNormal;

      profile.otherField = 'otro campo';
      const jsonReq = buildRequest('updateProfile', {
        email: userNormal,
        profile
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth updatePermission', () => {
    it('it return 200 & error when no bearer token is provided', () => {
      const jsonReq = buildRequest('updatePermission', {
        email: userNormal,
        permission: permissionTest
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.invalidJWS({})));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no email parameter is provided', () => {
      const jsonReq = buildRequest('updatePermission', {
        permisson: permissionTest
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no permission parameter is provided', () => {
      const jsonReq = buildRequest('updatePermission', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'permission');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when normal user try to modify a normal user', () => {
      const jsonReq = buildRequest('updatePermission', {
        email: userNormal,
        permission: permissionTest
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response, {
        sub: userNormal
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when admin user try to modify account not found', () => {
      const jsonReq = buildRequest('updatePermission', {
        email: 'user-not-found@gmail.com',
        permission: permissionTest
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.entityNotFound({
                                  email: jsonReq.params.email
                                })));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & success when admin user try to modify a valid account', () => {
      const jsonReq = buildRequest('updatePermission', {
        email: userNormal,
        permission: permissionTest
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth readPermission', () => {
    it('should return 200 & success when admin read an user permission', () => {
      const jsonReq = buildRequest('readPermission', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
          .json(jsonrpcLite.success(jsonReq.id,
                                    {email: userNormal,
                                     permission: permissionTest}));

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('should return 200 & error when normal user try to read its own permission', () => {
      const jsonReq = buildRequest('readPermission', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response, {
        email: userNormal,
        sub: userNormal
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('should return 200 & error when email parameter is missing', () => {
      const jsonReq = buildRequest('readPermission', {
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no bearer token is provided', () => {
      const jsonReq = buildRequest('readPermission', {
        email: userNormal,
        profile: profileNormal
      });
      const options = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.invalidJWS({})));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth setAdmin', () => {
    it('it return 200 & success when admin user setAdmin true', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal,
        admin: true
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & success when admin user setAdmin false', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal,
        admin: false
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);
      expect(response).to.comprise
        .json(jsonrpcLite.success(jsonReq.id,
                                  {email: userNormal}));
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when email parameter is missing', () => {
      const jsonReq = buildRequest('setAdmin', {
        admin: true
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'email');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when admin parameter is missing', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'admin');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when admin parameter is not Boolean', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal,
        admin: 'true'
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenAdmin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidParam(jsonReq.id, response, 'admin');
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no bearer token is provided', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal,
        admin: false
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectInvalidJWS(jsonReq.id, response);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('it return 200 & error when no admin bearer token is provided', () => {
      const jsonReq = buildRequest('setAdmin', {
        email: userNormal,
        admin: false
      });
      const options = {
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataTester.tokenLogin}`
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaError);
      expectUnauthorized(jsonReq.id, response, {sub: userNormal});
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('/auth getPublicKeyStore', () => {
    it('it return 200 & success always', () => {
      const jsonReq = buildRequest('getPublicKeyStore', {});
      const options = {
        'headers': {
          'Content-Type': 'application/json'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.schema(schemaSuccess);

      after(() => {
        // console.log(JSON.stringify(response.valueOf().body));
      });

      // now try to decode the tokenLogin
      return chakram.wait()
        .then((result) => jose.JWK.asKeyStore(response
                                              .valueOf()
                                              .body.result.keys)
              .then((ks) => jose.JWS.createVerify(ks)
                    .verify(dataTester.tokenLogin)
                    .then((decoded) => {
                      const payload = JSON.parse(decoded.payload.toString());

                      expect(payload).to.deep.include({
                        admin: false,
                        sub: userNormal
                      });
                      return result;
                    })));
    });
  });

  after('stop service', (done) => {
    service.close();
    done();
  });
});
