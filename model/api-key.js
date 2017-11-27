const rpcErrors = require('../errors/rpc-errors.js');

let apiKey = '';

exports.setApiKey = (key) => {
    apiKey = key;
};

exports.getApiKey = () => apiKey;

exports.check = (req) => {
    const value = req.get('X-API-KEY');

    if (typeof value === 'string') {
        if (value === apiKey) {
            return;
        }
        throw rpcErrors.unauthorized({reason: 'Invalid X-API-KEY header'});
    }
    throw rpcErrors.unauthorized({reason: 'Expected X-API-KEY header'});
};
