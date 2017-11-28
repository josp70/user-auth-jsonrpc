# API: read profile

The method `readProfile` returns the profile object for the given user account.
It can only be invoked using a valid bearer token.

## Request

**path: `POST /auth`**

**method: `readProfile`**

The body must be a valid JSON-RPC request with the following parameters:

* `email`: the email identifying the user account.

The method requires a bearer token in the `Authorization` header of the
http request.  The sub claim of the token should match the user email or
has admin rights (`admin==true`).

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
      "method":"readProfile",\
      "params": {\
        "email": "user-test@gmail.com"
       },\
      "id":0\
   }'
```


## Response

The body of the response is a JSON-RPC object which could be a valid result
in case of success or error in other case.

### Success

The result field of the response contains the email of the user account
and an object profile for that user. 

```json
    {
        "id": 0, 
        "jsonrpc": "2.0", 
        "result": {
            "email": "user-test@gmail.com", 
            "profile": {
                "company": "Sus labores", 
                "name": "Paco", 
                "otherField": "otro campo", 
                "surname": "Perico"
            }
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
          "parameter": "email"
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

* **if bearer token is not admin or does not match the user account**

```json
    {
      "jsonrpc": "2.0",
      "id": "fe74d790-d44d-11e7-9a07-8d2a3b1b376f",
      "error": {
        "message": "Unauthorized",
        "code": -33005,
        "data": {
          "reason": "not allowed to read user profile",
          "sub": "user-other@gmail.com"
        }
      }
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
