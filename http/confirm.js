const users = require('../model/users');
const rpcErrors = require('../errors/rpc-errors');

function getParameter(req, name) {
    const value = req.query[name];
    if(value == null) {
	throw new Error(`query parameter ${name} is required`);
    }
    return value;
}

exports.register = function(req, res) {
    // extract query parameter
    const email = getParameter(req, 'email');
    const token = getParameter(req, 'token');
    // do register
    return users.confirmRegister(email, token).then(result=>{
	//console.log(result);
	res.json({
	    message: `user account ${email} activated`,
	    result: result
	});
    }).catch(reason=>{
	const notFound = rpcErrors.entityNotFound({});
	if((reason.constructor.name === 'JsonRpcError') && (reason.code === notFound.code)) { 
	    res.status(404).json(reason.data);
	} else {
	    console.log(reason);
	    res.status(500).json({
		reason: reason,
		email: email,
		token: token
	    });
	}
    });
};

exports.password = function(req, res) {
    res.send('OK');
};










