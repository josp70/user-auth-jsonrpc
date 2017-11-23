# JSON-RPC Protocol
___

## Specification

JSON-RPC is a stateless, light-weight remote procedure call (RPC)
protocol. Primarily this specification defines several data structures
and the rules around their processing. It is transport agnostic in
that the concepts can be used within the same process, over sockets,
over http, or in many various message passing environments. It uses
JSON (RFC 4627) as data format.

The full specification can be found at <http://www.jsonrpc.org/>. In
our implementation we are adopting the JSON-RPC 2.0 specification,
see <http://www.jsonrpc.org/specification>

## Transport

We are using the http transport to implement the JSON-RPC in which
each service implement a single end-point wating for a POST request.

The content type for the request and the response is
"application/json". The authorization is implemented based on a bearer
token so the `Authorization: Bearer` http header is required.

The body of the request contains the json for the JSON-RPC
request. The service should always return status code 200, other
status codes returned must considered as unexpected errors. In case of
success (code=200) the body of the response contains the json with
result or error as specified by the JSON-RPC standard.

### Examples

**HTTP Call**

```
http  -v POST http://localhost:40685/auth \
  'Authorization: Basic dXNlci10ZXN0QGdtYWlsLmNvbTpwYXNzd29yZA==' \
  <<< '{"jsonrpc": "2.0", "method":"login", "id":0}'
```

**HTTP Request**

```
POST /auth HTTP/1.1
Accept: application/json
Accept-Encoding: gzip, deflate
Authorization:  Basic dXNlci10ZXN0QGdtYWlsLmNvbTpwYXNzd29yZA==
Connection: keep-alive
Content-Length: 45
Content-Type: application/json
Host: localhost:40685
User-Agent: HTTPie/0.9.2

{
    "id": 0,
    "jsonrpc": "2.0",
    "method": "login"
}
```

**HTTP Response**

```
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 442
Content-Type: application/json; charset=utf-8
Date: Wed, 22 Nov 2017 17:06:07 GMT
ETag: W/"1ba-ybuEi8ATVr+lQ9dgR4Pctn2ruqg"
X-Powered-By: Express

{
    "id": 0,
    "jsonrpc": "2.0",
    "result": {
        "email": "user-test@gmail.com",
        "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ikd0M1JUdXFXZEtfQ3ZscWFHUmEyOHdFdmJTRnByUHNrNm9TMWNYdGl5NzAifQ.eyJhZG1pbiI6ZmFsc2UsImV4cCI6MTU0MjkwNjM2NywiaWF0IjoxNTExMzcwMzY3LCJzdWIiOiJ1c2VyLXRlc3RAZ21haWwuY29tIn0.aTcini25piGMymd9H6m_3aVRn_vVPl5NuJwTwRqPirr_cq5kWvZqMGKH9YPu4q5vuhNAldDz57NkuH6Zom2mVXhODgeCCy-WXr17g4UW1pA1Lcn5lqxnzm8fyRTbtllcQPBAaDzpToJ8hGpfyrMlrfqmCSpwTlP9icvcEqp9tFA"
    }
}
```

**JSON-RPC Response**

```javascript
{
    "id": 0,
    "jsonrpc": "2.0",
    "result": {
        "email": "user-test@gmail.com",
        "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ikd0M1JUdXFXZEtfQ3ZscWFHUmEyOHdFdmJTRnByUHNrNm9TMWNYdGl5NzAifQ.eyJhZG1pbiI6ZmFsc2UsImV4cCI6MTU0MjkwNjM2NywiaWF0IjoxNTExMzcwMzY3LCJzdWIiOiJ1c2VyLXRlc3RAZ21haWwuY29tIn0.aTcini25piGMymd9H6m_3aVRn_vVPl5NuJwTwRqPirr_cq5kWvZqMGKH9YPu4q5vuhNAldDz57NkuH6Zom2mVXhODgeCCy-WXr17g4UW1pA1Lcn5lqxnzm8fyRTbtllcQPBAaDzpToJ8hGpfyrMlrfqmCSpwTlP9icvcEqp9tFA"
    }
}
```
