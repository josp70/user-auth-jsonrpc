# API: listUsers

The method `listUsers` return the list of user accounts registered
in the database. It can only be invoked using a valid bearer token
with admin rights.

## Request

**path: `POST /auth`**

**method: `listUsers`**

This  method does not expect any parameter and it requires a bearer
token in the `Authorization` header of the http request and the token
must has admin rights.

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
      "method":"listUsers",\
      "id":0\
   }'
```


## Response

The body of the response is a JSON-RPC object which could be a valid result
in case of success or error in other case.

### Success

The result field of the response is an array with one item per each user account:

```json
{
  "jsonrpc": "2.0",
  "id": "ccd638c0-d6b7-11e7-b9ab-6d74abf41540",
  "result": [
    {
      "email": "admin-test@gmail.com",
      "profile": {}
    },
    {
      "email": "user-test@gmail.com",
      "profile": {
        "name": "Paco",
        "surname": "Perico",
        "company": "Sus labores",
        "otherField": "otro campo"
      }
    }
  ]
}

```

### Errors

The following error responses can be generated:

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
          "reason": "only admin users are allowed to list users",
          "sub": "user-test@gmail.com"
        }
      }
    }
```
