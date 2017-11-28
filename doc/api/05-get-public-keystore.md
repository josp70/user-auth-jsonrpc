# API: getPublicKeyStore

The method `getPublicKeyStore` return JWKS which is a JSON object
that represents a set of JWKs. The JSON object MUST have a keys member,
which is an array of JWKs. Each JWK is a JSON object that represents the
public cryptographic key.

The JWKS objects is needed in order to decode the JWS token generated in
the call to the method `login`.

## Request

**path: `POST /auth`**
**method: `getPublicKeyStore`**

The body must be a valid JSON-RPC request without parameters
(params field empty or omitted).

### Example

```
http  -v POST http://localhost:34074/auth  \
  <<< '{"jsonrpc": "2.0", "method":"getPublicKeyStore", "id":0}'
```

## Response

The response is always a valid result JSON-RPC.

```json
{
  "id": 0,
  "jsonrpc": "2.0",
  "result": {
    "keys": [
      {
        "e": "AQAB",
        "kid": "Gt3RTuqWdK_CvlqaGRa28wEvbSFprPsk6oS1cXtiy70",
        "kty": "RSA",
        "n": "jcDhk-YUAVm9W2d4Kb-0uzAiIlswsBWASWvWwqW1KW4S8EihaDoTX7FSXsH1WDfrbRgpxADF2yt0DqHwNlU9IN\
        gkVdG4ORMFwpUjOvIWuY2UYimwZvWX4UMZejSkJCnrBU3Mzq1OKX32vUYsGYe90XiFuAleHO5c4-s47w9stCs"
      }
    ]
  }
}
```

