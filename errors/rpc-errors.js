const jsonrpc = require('jsonrpc-lite');

const baseCode = -33000;

exports.unimplementedMethod = function(data) {
    return new jsonrpc.JsonRpcError('Unimplemented method', -33000, data);
};

exports.entityNotFound = function(data) {
    return new jsonrpc.JsonRpcError('Entity not found', -33001, data);
};

exports.entityDuplicated = function(data) {
    return new jsonrpc.JsonRpcError('Entity duplicated', -33002, data);
};

exports.invalidUser = function(data) {
    return new jsonrpc.JsonRpcError('Invalid user name', -33003, data);
};

exports.invalidPassword = function(data) {
    return new jsonrpc.JsonRpcError('Invalid password', -33004, data);
};

exports.unauthorized = function(data) {
    return new jsonrpc.JsonRpcError('Unauthorized', -33005, data);
};

exports.dbFailInsert = function(data) {
    return new jsonrpc.JsonRpcError('Failed DB insert', -33006, data);
};

exports.accountNotActivated = function(data) {
    return new jsonrpc.JsonRpcError('Account not activated', -33007, data);
};

exports.invalidJWS = function(data) {
    return new jsonrpc.JsonRpcError('Invalid JWS', -33008, data);
};
