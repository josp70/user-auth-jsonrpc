user-auth-jsonrpc
=========

This is a node package to support in the implementation of an user
authentication end-point.

This piece of software is based on the following main packages:

* express: to implement the http server
* mongodb: to persit the user information
* node-jose: to generate the authorization tokens
* nodemailer: to send confirmation mails to the user

In order to use this package your code/environment should meet the
following:

* Http routing based on express
* Storage backend based on MongoDB
* To provide options and credentials to communicate with a SMTP server


## Installation

  `npm install user-auth-jsonrpc`

## Usage

## Tests

TBD

## Contributing

In lieu of a formal style guide, take care to maintain the existing
coding style. Add unit tests for any new or changed
functionality. Lint and test your code.
