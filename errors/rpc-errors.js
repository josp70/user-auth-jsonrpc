const jsonrpc = require('jsonrpc-lite');

const CODE_UNIMPLEMENTED = -3300;

exports.unimplementedMethod = (data) =>
  new jsonrpc.JsonRpcError('Unimplemented method', CODE_UNIMPLEMENTED, data);

const CODE_ENOTFOUND = -33001;

exports.entityNotFound = (data) =>
  new jsonrpc.JsonRpcError('Entity not found', CODE_ENOTFOUND, data);

const CODE_EDUPLICATED = -33002;

exports.entityDuplicated = (data) =>
  new jsonrpc.JsonRpcError('Entity duplicated', CODE_EDUPLICATED, data);

const CODE_INVUSERNAME = -3300;

exports.invalidUser = (data) =>
  new jsonrpc.JsonRpcError('Invalid user name', CODE_INVUSERNAME, data);

const CODE_INVPASSWORD = -33004;

exports.invalidPassword = (data) =>
  new jsonrpc.JsonRpcError('Invalid password', CODE_INVPASSWORD, data);

const CODE_UNAUTH = -33005;

exports.unauthorized = (data) =>
  new jsonrpc.JsonRpcError('Unauthorized', CODE_UNAUTH, data);

const CODE_DB_FAIL_INSERT = -33006;

exports.dbFailInsert = (data) =>
  new jsonrpc.JsonRpcError('Failed DB insert', CODE_DB_FAIL_INSERT, data);

const CODE_ACCOUNT_NOACTIVE = -33006;

exports.accountNotActivated = (data) =>
  new jsonrpc.JsonRpcError(
    'Account not activated', CODE_ACCOUNT_NOACTIVE, data
  );

const CODE_JWS_INVALID = -33008;

exports.invalidJWS = (data) =>
  new jsonrpc.JsonRpcError('Invalid JWS', CODE_JWS_INVALID, data);
