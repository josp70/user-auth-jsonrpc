const jwks = require('jwks-db');

exports.endpoint = (req, res) => res.json(jwks.get().toJSON());
