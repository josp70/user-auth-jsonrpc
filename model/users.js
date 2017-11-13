const uuidv4 = require('uuid/v4');
const bcrypt = require('bcrypt');
const rpcErrors = require('../errors/rpc-errors');
const jwks = require('jwks-db');

function userExists(email) {
    return db.collection('users').count({email: email}, {limit: 1})
	.then(count => {return Promise.resolve(count!=0)});
};

let db;
exports.setDb = function(database) {
    db = database;
};

exports.find = function(email) {
    return db.collection('users').findOne({email: email});
};

exports.remove = function(email) {
    return db.collection('users').deleteOne({email: email});
};

exports.register = function(email, password, profile, admin = false) {
    const token = uuidv4();
    const saltRounds = 5;
    return userExists(email).then(check => {
	if(check) {
	    return Promise.reject(rpcErrors.entityDuplicated({
		reason: 'user already registered',
		email: email
	    }))
	} else {
	    return bcrypt.hash(password, saltRounds).then(hash => {
		return db.collection('users').insertOne({
		    email: email,
		    hash: hash,
		    profile: profile,
		    permission: {},
		    admin: admin,
		    dateCreate: new Date(),
		    tokenRegister: token,
		    dateRegister: null,
		    hashPassword: null,
		    tokenPassword: null,
		    datePassword: null
		}).then(result=> {
		    if(result.insertedCount === 1) {
			return Promise.resolve({email: email, token: token, profile: profile});
		    } else {
			return Promise.reject(rpcErrors.dbFailInsert({
			    reason: 'failed insertOne',
			    doc: {
				email: email
			    }
			}));
		    }
		});
	    });
	}
    });
};

exports.confirmRegister = function(email, token) {
    const dte = new Date();
    return db.collection('users').findOneAndUpdate({
	email: email,
	tokenRegister: token 
    }, {
	'$set': {tokenRegister: null, dateRegister: dte}
    }, {
	projection: {_id:0, email:1, dateRegister:1},
	returnOriginal: false
    }).then(result => {
	if(result.lastErrorObject.updatedExisting) {
	    result.value.dateRegister = dte;
	    return Promise.resolve(result.value);
	} else {
	    return Promise.reject(rpcErrors.entityNotFound({
		reason: 'user may not exist or it is already registered or the token is invalid',
		email: email,
		token: token
	    }));
	}
    });
};

exports.login = function(email, password) {
    return db.collection('users').findOne({email: email}, {
	fields: {profile:0, permission:0}
    }).then(doc => {
	if(doc == null) {
	    return Promise.reject(rpcErrors.entityNotFound({
		reason: 'user not found',
		email: email
	    }));
	} else if(doc.tokenRegister != null) {
	    return Promise.reject(rpcErrors.accountNotActivated({
		reason: 'user account not activated',
		email: email
	    }));
	} else {
	    return bcrypt.compare(password, doc.hash).then(check => {
		if(check) {
		    const iat = Math.floor(Date.now()/1000);
		    const exp = iat + 365*24*60*60;
		    return jwks.generateJWS({
			sub: email,
			iat: iat,
			exp: exp,
			permission: doc.permission,
			admin: doc.admin
		    }).then(token => {
			return Promise.resolve({
			    email: email,
			    token: token
			});
		    });
		} else {
		    return Promise.reject(rpcErrors.unauthorized({
			reason: 'password does not match',
			email: email
		    }));
		}
	    });
	}
    });	
};

exports.updateProfile = function(email, profile) {
    return db.collection('users').findOneAndUpdate({
	email: email 
    }, {
	'$set': {profile: profile}
    }, {
	projection: {_id:0, email:1},
	returnOriginal: false
    }).then(result => {
	if(result.lastErrorObject.updatedExisting) {
	    return Promise.resolve(result.value);
	} else {
	    return Promise.reject(rpcErrors.entityNotFound({
		reason: 'user not found',
		email: email
	    }));
	}
    });
};

exports.updatePermission = function(email, permission) {
    return db.collection('users').findOneAndUpdate({
	email: email 
    }, {
	'$set': {permission: permission}
    }, {
	projection: {_id:0, email:1},
	returnOriginal: false
    }).then(result => {
	if(result.lastErrorObject.updatedExisting) {
	    return Promise.resolve(result.value);
	} else {
	    return Promise.reject(rpcErrors.entityNotFound({
		reason: 'user not found',
		email: email
	    }));
	}
    });
};















