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

* [ ] Add member (for back-end)
* [ ] View credit card (for back-end)
* [ ] Edit credit card (for back-end)
* [ ] Add address (for back-end)
* [ ] Download invoice (for back-end)
* [ ] Subscribe for a plan (for for back-end)
* [ ] Think about hover style (for design)
* [ ] Update dashboard (for **Jason**)
* [ ] How display spam / archive / trash / drafts tag in conversations list (for **Jason**)
* [ ] Fix problems with fonts when we load the page (for **Jason**)
* [ ] Fix style when we print a message (for **Jason**)
* [x] Build search modal with select location (for **Richard**)
* [x] Manage attachments (for **Richard**)
* [x] Review payment (for **Richard**)
* [ ] Drag and drop element (conversation and message)

### QA

* [x] star from conversations
* [x] star from conversation
* [x] star from message
* [x] unstar from conversations
* [x] unstar from conversation
* [x] unstar from message
* [ ] read from conversations
* [ ] read from message
* [ ] unread from conversations
* [ ] unread from message
* [x] apply labels from conversations
* [x] apply labels from message
* [ ] save draft message
* [ ] discard draft message
* [ ] send message
* [ ] move message
* [ ] move conversation
* [x] search messages
* [x] next page of conversations
* [ ] next page of messages (need **Bart**)
* [ ] print message
* [ ] message expired

### Bugs

* [ ] Move all elements, the main checkbox stay checked (for **Richard**)
* [ ] Next / previous conversation (for **Richard**)
* [ ] Next / previous conversations on search (for **Richard**)

### License

Copyright (c) 2013-2015

Proton Technologies A.G. (Switzerland)

Email: contact@protonmail.ch

License: https://github.com/ProtonMail/WebClient/blob/master/license.md
