# API: confirm register

This API does not follows the JSON-RPC approach because it must be invoked
embedded within the body of an email and the parameters to request mus be
past in the url as query parameters.

Besides, the url must be invoked with the verb GET.

## Request

**path: `GET /auth/confirm/register`**

The url is expected to contain the following query parameters:

* `email`: the user confirming the registry
* `token`: the confirmation token generated in the call to `register` 

### Example

```
http://localhost:46244/auth/confirm/register?email=user-test%40gmail.com&token=56340b44-3014-4cca-bba1-006eef60394b
```

## Response

The following http status can be returned:

* 200: if the user account could be activated and the body has the following json
```json
{
  "message": "user account user-test@gmail.com activated",
  "result": {
    "dateRegister": "2017-11-27T17:04:31.854Z",
    "email": "user-test@gmail.com"
  }
}
```

* 400: this can be generated in case some query parameter is missing and the
body has the following json
```json
{
  "message": "query parameter is required",
  "parameter": "email"
}
```

* 404: if the user account does not exist or it is already activated 
```json
{
  "email": "user-test@gmail.com",
  "reason": "user may not exist or it is already registered or the token is invalid",
  "token": "fc02fc19-ac9e-4dfd-a705-b7a623f8001f"
}
```
