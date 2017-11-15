const uuidv4 = require('uuid/v4');
const bcrypt = require('bcrypt');
const rpcErrors = require('../errors/rpc-errors');
const jwks = require('jwks-db');

let db = {};

function userExists(email) {
  return db.collection('users').count({email}, {limit: 1})
    .then((count) => Promise.resolve(count !== 0));
}

exports.setDb = (database) => {
  db = database;
};

exports.find = (email) => db.collection('users').findOne({email});

exports.remove = (email) =>
  db.collection('users').deleteOne({email});

exports.register = (email, password, profile, admin = false) => {
  const token = uuidv4();
  const saltRounds = 5;

  return userExists(email).then((check) => {
    if (check) {
      return Promise.reject(rpcErrors.entityDuplicated({
        email,
        reason: 'user already registered'
      }));
    }
    return bcrypt.hash(password, saltRounds)
      .then((hash) =>
            db.collection('users').insertOne({
              admin,
              dateCreate: new Date(),
              datePassword: null,
              dateRegister: null,
              email,
              hash,
              hashPassword: null,
              permission: {},
              profile,
              tokenPassword: null,
              tokenRegister: token
            })
            .then((result) => {
              if (result.insertedCount > 0) {
                return Promise.resolve({
                  email,
                  profile,
                  token
                });
              }
              return Promise.reject(rpcErrors.dbFailInsert({
                doc: {email},
                reason: 'failed insertOne'
              }));
            }));
  });
};

exports.confirmRegister = (email, token) => {
  const dte = new Date();

  return db.collection('users')
    .findOneAndUpdate({
      email,
      tokenRegister: token
    }, {
      '$set': {
        dateRegister: dte,
        tokenRegister: null
      }
    }, {
      projection: {
        _id: 0,
        dateRegister: 1,
        email: 1
      },
      returnOriginal: false
    })
    .then((result) => {
      if (result.lastErrorObject.updatedExisting) {
        result.value.dateRegister = dte;
        return Promise.resolve(result.value);
      }
      return Promise.reject(rpcErrors.entityNotFound({
        email,
        reason: 'user may not exist or it is already registered or the token is invalid',
        token
      }));
    });
};

exports.login = (email, password) => db.collection('users')
  .findOne({email}, {
    fields: {
      permission: 0,
      profile: 0
    }
  })
  .then((doc) => {
    if (doc === null) {
      return Promise.reject(rpcErrors.entityNotFound({
        email,
        reason: 'user not found'
      }));
    }
    if (doc.tokenRegister !== null) {
      return Promise.reject(rpcErrors.accountNotActivated({
        email,
        reason: 'user account need activation'
      }));
    }
    return bcrypt.compare(password, doc.hash)
      .then((check) => {
        if (check) {
          const mil2sec = 1000;
          const iat = Math.floor(Date.now() / mil2sec);
          const days = 365;
          const hours = 24;
          const min = 60;
          const sec = 60;
          const exp = iat + (days * hours * min * sec);

          return jwks.generateJWS({
            admin: doc.admin,
            exp,
            iat,
            permission: doc.permission,
            sub: email
          })
            .then((token) => Promise.resolve({
              email,
              token
            }));
        }
        return Promise.reject(rpcErrors.unauthorized({
          email,
          reason: 'password does not match'
        }));
      });
  });

exports.updateProfile = (email, profile) =>
  db.collection('users')
    .findOneAndUpdate({email}, {
      '$set': {profile}
    }, {
      projection: {
        _id: 0,
        email: 1
      },
      returnOriginal: false
    })
    .then((result) => {
      if (result.lastErrorObject.updatedExisting) {
        return Promise.resolve(result.value);
      }
      return Promise.reject(rpcErrors.entityNotFound({
        email,
        reason: 'user not found'
      }));
    });

exports.updatePermission = (email, permission) =>
  db.collection('users')
  .findOneAndUpdate({email}, {
    '$set': {permission}
  }, {
    projection: {
      _id: 0,
      email: 1
    },
    returnOriginal: false
  })
  .then((result) => {
    if (result.lastErrorObject.updatedExisting) {
      return Promise.resolve(result.value);
    }
    return Promise.reject(rpcErrors.entityNotFound({
        email,
      reason: 'user not found'
    }));
  });
