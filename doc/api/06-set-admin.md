# API: setAdmin

The method `setAdmin` update the `admin` claim for the given user account.
It can only be invoked using a valid bearer token with admin rights.

## Request

**path: `POST /auth`**

**method: `setAdmin`**

The body must be a valid JSON-RPC request with the following parameters:

* `email`: the email identifying the user account.
* `admin`: a boolean value.

The method requires a bearer token in the `Authorization` header of the
http request and the token must has admin rights.

### Example

```
http -v POST http://localhost:45391/auth \
  'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ikd0M1JUdXFXZEtfQ3ZscWFHUmEyOHdFdmJTRnByU\
  HNrNm9TMWNYdGl5NzAifQ.eyJhZG1pbiI6dHJ1ZSwiZXhwIjoxNTQzNDE3NDQ5LCJpYXQiOjE1MTE4ODE0NDksInN1Yi\
  I6ImFkbWluLXRlc3RAZ21haWwuY29tIn0.NXNLaCgyQL5u9TJMhpXnAlShRB4Ls8ZKQD9yPZnyIekq1ZV4RvhfxrhEkD\
  E8QwzyFwMFDXPuRjV--SYHYvUk2fZixc2vITsYQhjxLivGTq3PsHLREWHdqyc1GrdH53cSyjTqsve4ATwxwSxJUuDiQa\
  USWPcKlk9K5yJozcDHU18' <<< \
  '{\
      "jsonrpc": "2.0",\
      "method":"setAdmin",\
      "params": {\
        "email": "user-test@gmail.com",\
        "admin": true\
       },\
      "id":0\
   }'
```


## Response

The body of the response is a JSON-RPC object which could be a valid result
in case of success or error in other case.

### Success

The result field of the response contains the admin clain just set and the email of the user
account:

```json
{
  "id": 0,
  "jsonrpc": "2.0",
  "result": {
    "admin": true,
    "email": "user-test@gmail.com"
  }
}
```

### Errors

The following error responses can be generated:

* **if any of the parameters is missing**

```json
    {
      "jsonrpc": "2.0",
      "id": "fe739f10-d44d-11e7-9a07-8d2a3b1b376f",
      "error": {
        "message": "Invalid params",
        "code": -32602,
        "data": {
          "message": "missing parameter",
          "parameter": "admin"
        }
      }
    }
```

* **if the `admin` parameter has the wrong type**

```json
    {
      "jsonrpc": "2.0",
      "id": "fe73ed30-d44d-11e7-9a07-8d2a3b1b376f",
      "error": {
        "message": "Invalid params",
        "code": -32602,
        "data": {
          "message": "invalid admin paramemeter, must be Boolean",
          "parameter": "admin",
          "value": "true"
        }
      }
    }
```

* **if no bearer token is provided**

```json
    {
      "jsonrpc": "2.0",
      "id": "fe743b50-d44d-11e7-9a07-8d2a3b1b376f",
      "error": {
        "message": "Invalid JWS",
        "code": -33008,
        "data": {
          "reason": "missing bearer token"
        }
      }
    }
```

* **if bearer token without admin rights is provided**

```json
    {
      "jsonrpc": "2.0",
      "id": "fe74d790-d44d-11e7-9a07-8d2a3b1b376f",
      "error": {
        "message": "Unauthorized",
        "code": -33005,
        "data": {
          "reason": "only admin users are allowed to modify admin status",
          "sub": "user-test@gmail.com"
        }
      }
    }
```
