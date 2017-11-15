const users = require('../model/users');
const rpcErrors = require('../errors/rpc-errors');

function getParameter(req, name) {
  const value = req.query[name];

  if (typeof value === 'undefined' || value === null) {
    throw new Error(`query parameter ${name} is required`);
  }
  return value;
}

exports.register = (req, res) => {
  // Extract query parameter
  const email = getParameter(req, 'email');
  const token = getParameter(req, 'token');

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
