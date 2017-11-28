# API: login

The method `login` validate the user credentials and if they are valid it
returns a JWS token with the authorization claims.

## Request

**path: `POST /auth`**

**method: `login`**

The body must be a valid JSON-RPC request without parameters
(params field empty or omitted).

The request use basic access authentication method to receive the user credentials.

This method is also protected with an API key which is expected to be provided
in the http header `X-API-KEY`.

### Example

```
http  -v POST http://localhost:34074/auth  \
  'Authorization: Basic dXNlci10ZXN0QGdtYWlsLmNvbTpwYXNzd29yZA=='\
  'X-API-KEY: apikey'  <<< '{"jsonrpc": "2.0", "method":"login", "id":0}'
```

## Response

The body of the response is a JSON-RPC object which could be a valid result
in case of success or error in other case.

### Success

The result field of the response contains the JWS token generated.

```json
{
  "id": 0,
  "jsonrpc": "2.0",
  "result": {
    "email": "user-test@gmail.com",
    "token": \
    "eyJhbGciOiJSUzI1NiIsImtpZCI6Ikd0M1JUdXFXZEtfQ3ZscWFHUmEyOHdFdmJTRnByUHNrNm9TMWNYdG\
    l5NzAifQ.eyJhZG1pbiI6ZmFsc2UsImV4cCI6MTU0MzQzODE3NSwiaWF0IjoxNTExOTAyMTc1LCJwZXJtaX\
    NzaW9uIjp7ImdpZG1sIjp7Im1heGNwdSI6MTAsIm1heHNpemUiOjEwNzM3NDE4MjR9fSwic3ViIjoidXNlc\
    i10ZXN0QGdtYWlsLmNvbSJ9.ShyoY4___ewi_sslCsoiiVk7VZ_HFzD_HN_zNwQ7Aj0RcSD-z5hwy4BawWo\
    Vu1XV3BS2LVoGZZr_pGK6PfDEY5pmPxIh4qHtNSiZMRQt4cbjC-NRPexJagyvmz9sOqOO1fQ5lxoye-BGZP\
    -xEPPYE2wBmscGmzLegf8rGv9TJ7Q"
  }
}
```

The payload of the token contains the following claims:

* `admin`: boolean field indicating if the account has admin rights.
* `exp`: the expiration time on or after which the JWT MUST NOT be accepted for
         processing.
* `iat`: the time at which the token was issued.
* `permission`: the permission field of the user account.
* `sub`: the account identifier.

The following is an example of payload:

```json
{
  "admin": false,
  "exp": 1543438175,
  "iat": 1511902175,
  "permission": {
    "gidml": {
      "maxcpu": 10,
      "maxsize": 1073741824
    }
  },
  "sub": "user-test@gmail.com"
}
```

### Errors

The following error responses can be generated:

* **if no X-API-KEY is provided**
```json
    {
      "error": {
        "code": -33005,
        "data": {
          "reason": "Expected X-API-KEY header"
        },
        "message": "Unauthorized"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```

* **if not basic authorization is provided**
```json
    {
      "error": {
        "code": -33005,
        "data": {
          "reason": "Basic authorization required"
        },
        "message": "Unauthorized"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```

* **if a wrong API key is provided**
```json
    {
      "error": {
        "code": -33005,
        "data": {
          "reason": "Invalid X-API-KEY header"
        },
        "message": "Unauthorized"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```

* **if wrong password**
```json
    {
      "error": {
        "code": -33005,
        "data": {
          "email": "user-test@gmail.com",
          "reason": "password does not match"
        },
        "message": "Unauthorized"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```

* **if user not found**
```json
    {
      "error": {
        "code": -33001,
        "data": {
          "email": "admin-test@gmail.comx",
          "reason": "user not found"
        },
        "message": "Entity not found"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```

* **if user account is not activated**
```json
    {
      "error": {
        "code": -33006,
        "data": {
          "email": "user-test@gmail.com",
          "reason": "user account need activation"
        },
        "message": "Account not activated"
      },
      "id": 0,
      "jsonrpc": "2.0"
    }
```
