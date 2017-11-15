/* eslint max-lines: "off" */
/* eslint max-statements: "off" */
/* eslint no-process-env: "off" */
/* global describe, it, after, before */

// During the test the env variable is set to test

process.env.NODE_ENV = 'test';
const cheerio = require('cheerio');
const chakram = require('chakram');
const {expect} = chakram;
const uuidv1 = require('uuid/v1');
const jsonrpcLite = require('jsonrpc-lite');
const service = require('./fixture/service');
const rpcErrors = require('../errors/rpc-errors');
const users = require('../model/users');

const HTTP200 = 200;
const HTTP404 = 404;

function buildRequest(method, params) {
  const id = uuidv1();

  return jsonrpcLite.request(id, method, params);
}

describe('MSVC-USER', () => {
  const dataTester = {};

  let port = 0,
      url = '',
      schemaSuccess = {},
      schemaError = {};
  const userNormal = 'user-test@gmail.com';
  const userAdmin = 'admin-test@gmail.com';
  const passTest = 'password';
  const profileNormal = {
    name: 'Paco',
    surname: 'Perico',
    company: 'Sus labores'
  };
  const profileAdmin = {
    name: 'Pepito',
    surname: 'Grillo',
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
        users.register(userAdmin, passTest, profileAdmin, true)
          .then((resultAdmin) => {
            console.log('created admin user');
            console.log(resultAdmin);
            return users.confirmRegister(resultAdmin.email, resultAdmin.token);
          })
          .catch((reason) => {
            if (reason.constructor.name === 'JsonRpcError') {
              console.log(reason.message);
              console.log(reason.data);
            } else {
              console.log(reason);
            }
          })
            .then(() => {
              users.login(userAdmin, passTest)
                .then((logged) => {
                  console.log(logged.token);
                  dataTester.tokenAdmin = logged.token;
                  done();
                });
            });
      });
    });
  });

  describe('/auth register', () => {
    it('it return 200 & missing parameter when email is undefined', () => {
      const jsonReq = buildRequest('register', {
        password: passTest,
        profile: profileAdmin
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
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'email'
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
    it('it return 200 & missing parameter when password is undefined', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        profile: profileAdmin
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'password'
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is undefined', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passTest
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'profile'
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is an empty object', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passTest,
        profile: {}
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'profile'
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
    it('it return 200 & missing parameter when profile is not an object', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passTest,
        profile: 'hello world!'
      });
      const options = {
        'headers': {'Content-Type': 'application/json'}
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'profile'
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
    it('it return 200 on register', () => {
      const jsonReq = buildRequest('register', {
        email: userNormal,
        password: passTest,
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

        /* console.log('======================');
           console.log(response.valueOf().body)
           console.log('======================'); */
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
        password: passTest,
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
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
  });

  describe('/auth/confirm/register', () => {

    it('it return 200 & accountNotActivated on login when account not activated', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {'Content-Type': 'application/json'},
        'auth': {
          'user': userNormal,
          'pass': passTest
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
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });

    it('it return 200 when confirming email link', () => {
      const dom = cheerio.load(dataTester.mail.html);
      const href = dom('.activate').attr('href');
      // console.log('href = ' + href);
      const response = chakram.get(href);

      expect(response).to.have.status(HTTP200);
      after(() => {
        // console.log(response.valueOf().body)
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
        // console.log(response.valueOf().body)
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id, rpcErrors.unauthorized({})));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });

    it('it return 200 & entityNotFound when wrong user', () => {
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.entityNotFound({email: badUser})));
      return chakram.wait();
    });

    it('it return 200 & unauthorized when wrong password', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {'Content-Type': 'application/json'},
        'auth': {
          'user': userNormal,
          'pass': 'wrong_password'
        }
      };
      const response = chakram.post(`${url}/auth`, jsonReq, options);

      expect(response).to.have.status(HTTP200);
      expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
      expect(response).to.have.schema(schemaError);
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.unauthorized({email: userNormal})));
      return chakram.wait();
    });

    it('it return 200 & JWS token', () => {
      const jsonReq = buildRequest('login');
      const options = {
        'headers': {'Content-Type': 'application/json'},
        'auth': {
          'user': userNormal,
          'pass': passTest
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
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait().then((resultToken) => {
        dataTester.tokenLogin = response.valueOf().body.result.token;
        return Promise.resolve(resultToken);
      });
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
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'email'
                                })));
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'profile'
                                })));
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.unauthorized({
                                  email: jsonReq.params.email,
                                  sub: userNormal
                                })));
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });

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
      // after(() => {console.log(response.valueOf().body)});
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
      // after(() => {console.log(response.valueOf().body)});
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
      // after(() => {console.log(response.valueOf().body)});
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
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'email'
                                })));
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response)
        .to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                jsonrpcLite.JsonRpcError.invalidParams({
                                  parameter: 'permission'
                                })));
      // after(() => {console.log(response.valueOf().body)});
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
      expect(response).to.comprise
        .json(jsonrpcLite.error(jsonReq.id,
                                rpcErrors.unauthorized({
                                  sub: userNormal
                                })));
      // after(() => {console.log(response.valueOf().body)});
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
      // after(() => {console.log(response.valueOf().body)});
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
      // after(() => {console.log(response.valueOf().body)});
      return chakram.wait();
    });
  });

  after('stop service', (done) => {
    service.close();
    done();
  });
});
