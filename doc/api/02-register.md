# API: register

The method `register` create a new user account given email and
profile data for the user.

## Request

The body must be a valid JSON-RPC request, with the following parameters:

* `email`: the user email, will be considered as the user identifier
* `password`: the user password
* `profile`: the user profile, must be a non empty object. In next
  release this object will be validated with respected to a json
  scheme.

### Example

```json
{
  "jsonrpc": "2.0",
  "id": "a9368c30-d2d9-11e7-864c-9fd13ae41559",
  "method": "register",
  "params": {
    "email": "user-test@gmail.com",
    "password": "password",
    "profile": {
      "name": "Paco",
      "surname": "Perico",
      "company": "Vago"
    }
  }
}
```

## Response

In case of success an email is sent to the user with a confirmation url and a 'SUCCESS' JSON-RPC is returned. The result contains the email of the user registered.

### Success

The result field of the success response

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "a9368c30-d2d9-11e7-864c-9fd13ae41559",
  "result": {
    "email": "user-test@gmail.com"
  }
}
```

### Errors

The following error responses can be generated:

#### Invalid params

```json
{
  "jsonrpc": "2.0",
  "id": "79b35250-d2dd-11e7-bf97-e5a10b620ed7",
  "error": {
    "message": "Invalid params",
    "code": -32602,
    "data": {
      "message": "missing parameter",
      "parameter": "email"
    }
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": "17443c50-d2de-11e7-88b3-5f372623f503",
  "error": {
    "message": "Invalid params",
    "code": -32602,
    "data": {
      "message": "parameter profile must be a non empty object",
      "parameter": "profile"
    }
  }
}
```

#### Entity duplicated
```json
{
  "jsonrpc": "2.0",
  "id": "1802d160-d2de-11e7-88b3-5f372623f503",
  "error": {
    "message": "Entity duplicated",
    "code": -33002,
    "data": {
      "email": "user-test@gmail.com",
      "reason": "user already registered"
    }
  }
}
```
