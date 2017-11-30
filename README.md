user-auth-jsonrpc
=========
![build status](https://gitlab.com/jorge.suit/user-auth-jsonrpc/badges/master/build.svg)

This is a node package to support in the implementation of an user
authentication end-point.

The implementation of user-auth-jsonrpc is based on the following main
packages:

* express: to implement the http server
* mongodb: to persit the user information
* node-jose: to generate the authorization tokens
* nodemailer: to send confirmation mails to the user

In order to use this package your code/environment should meet the
following:

* Http routing based on express
* Storage backend based on MongoDB
* To provide options and credentials to communicate with a SMTP server
* To provide the email template files with the content of the
  confirmation body sent to the users.


# Installation

  `npm install user-auth-jsonrpc`

# Tests

`npm run lint`

`npm test`

# Usage

```javascript
const express = require('express');
const userAuth = require('./user-auth-jsonrpc');
const {MongoClient} = require('mongodb');
const path = require('path');

// create the express app object
const app = express();

// create the authentication router
let routerRpc = express.Router();
app.use('/', routerRpc);

function start() {
    return MongoClient.connect('mongodb://localhost:27017/user_auth')
        .then(db => {
            // mount the router on the path '/auth'
            return userAuth.mount(routerRpc, {
                path: '/auth',
                db: db,
                mail: {
                    sender: 'sender@gmail.com',
                    dirTemplates: path.join(__dirname, 'templates/mail'),
                    templates: ['confirm-register', 'confirm-password']
                }
            });
        })
        .then(_=>{
            app.listen(0, _=>{
                console.log('Server started');
            });
        });
};

start();
```

# Email Configuration

The configuration is based on the
package
[mailer-template](https://www.npmjs.com/package/mailer-template).

In the example above we have used the following template structure:

```
├── templates
    └── mail
        ├── confirm-password.html.mst
        ├── confirm-password.json
        ├── confirm-register.html.mst
        └── confirm-register.json
```

With the following templates contents:

#### confirm-register.json
---
```javascript
{
    "subject": "Activate your account in The_Marvellouse_Account",
    "images": []
}
```

#### confirm-register.html.mst
---
```
<p>Hi {{profile.name}},</p>
<p>Thanks for signing up for The_Marvellouse_Service!</p>
<p>Please confirm your account at <a class=activate href="{{href}}">activate</a></p>
```

#### confirm-password.json
---
```javascript
{
    "subject": "Password change requested in The_Marvellouse_Account",
    "images": []
}
```

#### confirm-password.html.mst
---
```
<p>Hi, {{profile.name}}</p>
<p>You have recently requested to change the password in your account for The_Marvellouse_Service!</p>
<p>Please confirm the change at <a class=activate href="{{href}}">confirm change</a></p>
```

### Template View

Each template is renderd
using [mustache](https://www.npmjs.com/package/mustache) and the view
object which can be expanded in the templates has the following
structure:

```
{
   profile: {...},
   href: '...'
}
```

where,

* `profile` is the corresponding profile field from the user document
  in the database. You can use in the template, for instance, the name
  of the user like `{{profile.name}}`
* `href` is the link to confirm the action (register or password change)

# API

You can see the documentation of the client API for the implemented end-point at
[API doc](https://gitlab.com/jorge.suit/user-auth-jsonrpc/wikis/home#client-api)

# Contributing

In lieu of a formal style guide, take care to maintain the existing
coding style. Add unit tests for any new or changed
functionality. Lint and test your code.
