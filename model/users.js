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

const saltRounds = 5;

function insertUser(info) {
  const {email, password, profile, token, admin = false} = info;

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
}

exports.createAdminAccount = (email, password) =>
  userExists(email)
  .then((check) => {
    if (check) {
      console.log('admin user already created', email);
      return {
        email,
        profile: {},
        token: null
      };
    }
    return insertUser({
      admin: true,
      email,
      password,
      profile: {},
      token: null
    });
  });

exports.register = (email, password, profile, admin = false) => {
  const token = uuidv4();

  return userExists(email).then((check) => {
    if (check) {
      return Promise.reject(rpcErrors.entityDuplicated({
        email,
        reason: 'user already registered'
      }));
    }
    return insertUser({
      admin,
      email,
      password,
      profile,
      token
    });
  });
};

exports.setAdmin = (email, admin) =>
  db.collection('users')
  .findOneAndUpdate({email}, {'$set': {admin}}, {
    projection: {
      _id: 0,
      admin: 1,
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
      reason: `user ${email} does not exists`
    }));
  });

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

function findUser(email, options) {
    return db.collection('users')
    .findOne({email}, options)
    .then((doc) => {
      if (doc === null) {
        return Promise.reject(rpcErrors.entityNotFound({
          email,
          reason: 'user not found'
        }));
      }
      return doc;
    });
}

exports.login = (email, password) => db.collection('users')
  .findOne({email}, {
    fields: {
      _id: 0,
      admin: 1,
      hash: 1,
      permission: 1,
      tokenRegister: 1
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

exports.readProfile = (email) =>
  findUser(email, {
    fields: {
      _id: 0,
      email: 1,
      profile: 1
    }
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

exports.readPermission = (email) =>
  findUser(email, {
    fields: {
      _id: 0,
      email: 1,
      permission: 1
    }
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

exports.listUsers = () => db.collection('users').find({})
  .project({
    _id: 0,
    email: 1,
    profile: 1
  })
  .toArray();
