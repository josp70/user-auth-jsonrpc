const users = require('../model/users');
const rpcErrors = require('../errors/rpc-errors');

function getParameter(req, name, res) {
  const value = req.query[name];
  const http400 = 400;

  if (typeof value === 'undefined' || value === null) {
    res.status(http400).json({
      message: 'query parameter is required',
      parameter: name
    });
  }
  return value;
}

exports.register = (req, res) => {
  // Extract query parameter
  const email = getParameter(req, 'email', res);
  const token = getParameter(req, 'token', res);

  // Do register
  return users.confirmRegister(email, token)
    .then((result) => {
      res.json({
        message: `user account ${email} activated`,
        result
      });
    })
    .catch((reason) => {
      const notFound = rpcErrors.entityNotFound({});
      const http404 = 404;
      const http500 = 500;

      if (reason.constructor.name === 'JsonRpcError' &&
          reason.code === notFound.code) {
        res.status(http404).json(reason.data);
      } else {
        console.log(reason);
        res.status(http500).json({
          email,
          reason,
          token
        });
      }
    });
};

exports.password = (req, res) => res.send('OK');
