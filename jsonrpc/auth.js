const users = require('../model/users.js');
const rpcErrors = require('../errors/rpc-errors.js');
const basicAuth = require('basic-auth');
const jsonrpcLite = require('jsonrpc-lite');
const mailer = require('mailer-template');
const url = require('url');
const escape = require('escape-html');
const jwks = require('jwks-db');

jsonrpc = {};
exports.jsonrpc = jsonrpc;

function getParameter(req, name) {
    const value = req.body.params[name];
    if(value == null) {
	throw new jsonrpcLite.JsonRpcError.invalidParams({
	    message: 'missing parameter',
	    parameter: name
	});
    }
    return value;
}

function sendRegisterMail(req, infoUser) {
    const view = {
	href: url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    pathname: req.path + '/confirm/register',
	    query: {
		email: infoUser.email,
		token: infoUser.token
	    }
	}),
	profile: infoUser.profile
    }
    return mailer.sendMail(infoUser.email, 'confirm-register', view)
	.then(infoSend => {
            console.log('Message sent: %s', infoSend.messageId);

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
	    
	    if(process.env.NODE_ENV === 'test') {
		// Preview only available when sending through an Ethereal account
		console.log('Preview URL: %s', mailer.getTestMessageUrl(infoSend));
		infoUser.mail = {html: infoSend.message.html};
	    }
	    return infoUser;
	});
}

function isObject(x) {
    return (x!=null) && !Array.isArray(x) && (typeof(x)==='object') && (Object.keys(x).length>0)
};

jsonrpc.register = function(req) {
    const email = getParameter(req, 'email');
    const password = getParameter(req, 'password');
    const profile = getParameter(req, 'profile');

    if(!isObject(profile)) {
	throw new jsonrpcLite.JsonRpcError.invalidParams({
	    message: 'parameter profile must be a non empty object',
	    parameter: 'profile'
	});
    }
    
    return users.register(email, password, profile).then(result=>{
	return sendRegisterMail(req, result);
    });
};

jsonrpc.login = function(req) {
    //console.log(req.headers);
    const user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
	return Promise.reject(rpcErrors.unauthorized({
	    reason: 'Basic authorization required'
	}));
    };

    return users.login(user.name, user.pass);
};

/*
exports.confirmRegister = function(req) {
    const email = getParameter(req, 'email');
    const tokenRegister = getParameter(req, 'tokenRegister');

    return users.confirmRegister(email, tokenRegister);
};
*/

function extractJWT(token) {
    if(token == null) {
	return Promise.reject(rpcErrors.invalidJWS({
	    reason: 'missing bearer token'
	}));
    } else {
	return jwks.verifyJWS(token).then(decoded=>{
	    if(decoded.payload.sub == null) {
		return Promise.reject(rpcErrors.invalidJWS({
		    reason: 'missing claim sub'
		}));
	    } else if (decoded.payload.admin == null) {
		return Promise.reject(rpcErrors.invalidJWS({
		    reason: 'missing claim admin'
		}));
	    } else {
		return decoded;
	    }
	});
    }
};

jsonrpc.updateProfile = function(req) {
    const email = getParameter(req, 'email');
    const profile = getParameter(req, 'profile');
    return extractJWT(req.token)
	.then(decoded => {
	    if(decoded.payload.sub != email && !decoded.payload.admin) {
		return Promise.reject(rpcErrors.unauthorized({
		    reason: 'not allowed to modify user',
		    email: email,
		    sub: decoded.payload.sub
		}));
	    } else {
		return users.updateProfile(email, profile); 
	    }
	});
};

jsonrpc.updatePermission = function(req) {
    const email = getParameter(req, 'email');
    const permission = getParameter(req, 'permission');
    return extractJWT(req.token)
	.then(decoded => {
	    if(!decoded.payload.admin) {
		return Promise.reject(rpcErrors.unauthorized({
		    reason: 'only admin users are allowed to update permission',
		    sub: decoded.payload.sub
		}));
	    } else {
		return users.updatePermission(email, permission); 
	    }
	});
};





