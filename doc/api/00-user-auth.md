# API: user-auth-jsonrpc `/auth`
___

This document describes the API for each method implemented in the
`user-auth-jsonrpc` service. This is merely a documentation for the
consumer of the service.

This documents includes a brief introduction about the JSON-RPC
protocol on which every service is implemented. The clients of the
service must also obey this protocol in order to successfully
comunicate with the service.

Some of the method are protected by an API key. That API key must be
defined throught the evironment variable `API_KEY`.

It is recommended to create an admin account the first time the
service is run in order to perform admin tasks. The credential for
this first admin account must be specified using the environment
variables:

* `ADMIN_USER`: the email of the account
* `ADMIN_PASSWORD`: the password of the account

The account is created if it does not exist and it is not needed to
confirm the register process.

You need to set the variables for the first admin account only once,
and be sure to store it in a secure place.

