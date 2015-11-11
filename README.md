ProtonMail Web Client
=======

#### [https://protonmail.ch](https://protonmail.ch)

Official AngularJS web client for ProtonMail users.

[![Circle CI](https://circleci.com/gh/ProtonMail/Angular.png)](https://circleci.com/gh/ProtonMail/Angular)
[![Dependency Status](https://david-dm.org/ProtonMail/Angular.png)](https://david-dm.org/ProtonMail/Angular)
[![devDependency Status](https://david-dm.org/ProtonMail/Angular/dev-status.png)](https://david-dm.org/ProtonMail/Angular#info=devDependencies)

### Basic Installation

#### If you have node `0.12` installed locally

1. `sudo npm install` (requires nodejs)
2. `sudo npm start` to start the app locally at `localhost:8080`

#### If you have docker, and prefer to not install node (or anything else) locally

- `make start` to start the app on a container (use `make localurl` to find the url where it's running)
- `make test` to build the app (actual tests are still to come)

There is a very good chance you won't be able to use the app locally because of various security headers and such. But you should be able to get the code running enough to poke around and inspect it.

We are still in Beta and will have a more refined build process, installation instructions, unit tests, and all that good stuff once we exit Beta.

### Development

We are very open to bug reports via Issues as well as Pull Requests.

### Todo

* [ ] Add member (wait back-end)
* [ ] Check domain verification modal (for **Jason**)
* [ ] View credit card (wait back-end)
* [ ] Edit credit card (wait back-end)
* [ ] Add address (wait back-end)
* [ ] Add custom domain via modal (for **Jason**)
* [ ] Buy domain with modal (wait design and back-end)
* [x] Move the loader (for **Jason**)
* [ ] Download invoice (wait back-end)
* [ ] Subscribe for a plan (wait for back-end)
* [ ] Downgrade to a plan (wait for design)
* [ ] Display placeholder for conversation
* [ ] Display placeholder for conversation list (wait for design)
* [ ] Add condition to display large toolbar button on large screen (for **Jason**)
* [x] Improve add domain modal (for **Jason**)
* [ ] Fix labels display in conversations/messages list (for **Jason**)
* [ ] How to delete account? (wait for design)
* [ ] Colorize calendar in search modal with purple color (for **Jason**)
* [ ] How to manage storage per user in users page? (wait design)
* [x] Decide on which criteria we preload messages / conversations (wait design)

### Test

* [ ] star from conversations
* [ ] star from conversation
* [ ] star from message
* [ ] unstar from conversations
* [ ] unstar from conversation
* [ ] unstar from message
* [ ] read from conversations
* [ ] read from message
* [ ] unread from conversations
* [ ] unread from message
* [ ] apply labels from conversations
* [ ] apply labels from message
* [ ] save draft message
* [ ] send message
* [ ] move message
* [ ] move conversation

### Bugs

* [ ] Select conversation, click on next page
* [ ] Delete all contact icon seems not appear
* [ ] Remove active element in list
* [ ] Problem with fonts (for **Jason**)

> Failed to decode downloaded font: http://localhost:8080/assets/fonts/Bold/OpenSans-Bold.woff2?v=1.1.0
> inbox:1 OTS parsing error: invalid version tag

### License

Copyright (c) 2013-2015

Proton Technologies A.G. (Switzerland)

Email: contact@protonmail.ch

License: https://github.com/ProtonMail/WebClient/blob/master/license.md
