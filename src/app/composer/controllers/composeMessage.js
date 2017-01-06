angular.module('proton.composer')
.controller('ComposeMessageController', (
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    authentication,
    cache,
    confirmModal,
    CONSTANTS,
    Contact,
    hotkeys,
    Message,
    embedded,
    networkActivityTracker,
    composerRequestModel,
    attachmentModel,
    messageBuilder,
    notify,
    pmcw,
    tools,
    AppModel
) => {

    const unsubscribe = [];

    $scope.messages = [];
    $scope.uid = 1;
    $scope.weekOptions = [
        { label: '0', value: 0 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 }
    ];
    $scope.dayOptions = [
        { label: '0', value: 0 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 },
        { label: '6', value: 6 }

    ];
    $scope.hourOptions = [
        { label: '0', value: 0 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '5', value: 5 },
        { label: '6', value: 6 },
        { label: '7', value: 7 },
        { label: '8', value: 8 },
        { label: '9', value: 9 },
        { label: '10', value: 10 },
        { label: '11', value: 11 },
        { label: '12', value: 12 },
        { label: '13', value: 13 },
        { label: '14', value: 14 },
        { label: '15', value: 15 },
        { label: '16', value: 16 },
        { label: '17', value: 17 },
        { label: '18', value: 18 },
        { label: '19', value: 19 },
        { label: '20', value: 20 },
        { label: '21', value: 21 },
        { label: '22', value: 22 },
        { label: '23', value: 23 }
    ];

    // Listeners
    unsubscribe.push($scope.$watch('messages.length', () => {
        if ($scope.messages.length > 0) {
            $rootScope.activeComposer = true;
            window.onbeforeunload = () => {
                return gettextCatalog.getString('By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.', null);
            };
            hotkeys.unbind(); // Disable hotkeys
        } else {
            $rootScope.activeComposer = false;
            window.onbeforeunload = undefined;

            if (authentication.user.Hotkeys === 1) {
                hotkeys.bind();
            } else {
                hotkeys.unbind();
            }
        }
    }));

    unsubscribe.push($scope.$on('updateUser', () => {
        $scope.addresses = authentication.user.Addresses;
    }));

    unsubscribe.push($scope.$on('onDrag', () => {
        _.each($scope.messages, (message) => {
            $scope.togglePanel(message, 'attachments');
        });
    }));

    // When the user delete a conversation and a message is a part of this conversation
    unsubscribe.push($scope.$on('deleteConversation', (event, ID) => {
        _.each($scope.messages, (message) => {
            if (ID === message.ID) {
                // Close the composer
                $scope.close(message, false, false);
            }
        });
    }));

    // When a message is updated we try to update the message
    unsubscribe.push($rootScope.$on('message.refresh', (event, messageIDs) => {
        $scope.messages.forEach((message) => {
            const { ID } = message;
            if (messageIDs.indexOf(ID) > -1) {
                const messageCached = cache.getMessageCached(ID);

                if (messageCached) {
                    message.Time = messageCached.Time;
                    message.ConversationID = messageCached.ConversationID;
                }
            }
        });
    }));

    unsubscribe.push($rootScope.$on('composer.new', (event, { message, type }) => {
        const limitReached = checkComposerNumber();
        if (!limitReached && AppModel.is('onLine')) {
            initMessage(messageBuilder.create(type, message));
        }

        !AppModel.is('onLine') && notify({
            message: 'No Internet connection found.',
            classes: 'notification-danger'
        });
    }));

    unsubscribe.push($rootScope.$on('composer.load', (event, { ID }) => {
        const found = _.findWhere($scope.messages, { ID });
        const limitReached = checkComposerNumber();

        if (!found && !limitReached) {
            cache.queryMessage(ID)
            .then((message) => {
                message.clearTextBody()
                    .then(() => initMessage(message))
                    .catch((error) => {
                        notify({ message: error.message, classes: 'notification-danger' });
                    });
            });
        }
    }));

    unsubscribe.push($rootScope.$on('composer.update', (e, { type, data }) => {
        switch (type) {

            case 'editor.focus': {
                const { message, isMessage } = data;
                isMessage && $scope.$applyAsync(() => {
                    message.autocompletesFocussed = false;
                    message.attachmentsToggle = false;
                    message.ccbcc = false;
                });
                break;
            }

            case 'send.message': {
                $scope.send(data.message);
                break;
            }

            case 'close.message': {
                $scope.close(data.message, false, false);
                break;
            }
        }
    }));

    unsubscribe.push($rootScope.$on('message.updated', (e, { message }) => {
        // save when DOM is updated
        recordMessage(message, { autosaving: true });
    }));

    unsubscribe.push($rootScope.$on('squire.editor', (e, { type, data }) => {
        (type === 'input') && $scope.saveLater(data.message);
    }));

    unsubscribe.push($rootScope.$on('attachment.upload', (e, { type, data }) => {
        (type === 'remove.success') && recordMessage(data.message, { autosaving: true });
    }));

    const onResize = _.debounce(() => {
        $rootScope.$emit('composer.update', {
            type: 'refresh',
            data: { size: $scope.messages.length }
        });
    }, 1000);

    /**
     * Check if the user reach the composer number limit
     * @return {Boolean}
     */
    function checkComposerNumber() {
        const limit = ($scope.messages.length >= CONSTANTS.MAX_NUMBER_COMPOSER) || ($scope.messages.length === 1 && $rootScope.mobileMode);

        if (limit) {
            notify({ message: gettextCatalog.getString('Maximum composer reached', null, 'Error'), classes: 'notification-danger' });
        }

        return limit;
    }

    $(window).on('resize', onResize);

    $scope.$on('$destroy', () => {
        $(window).off('resize', onResize);

        window.onbeforeunload = undefined;

        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });

    /**
      * Convert data-uri to blob
      * @param {String} dataURI
      * @return {Blob}
      */
    function dataURItoBlob(dataURI = '') {
        const [mime = '', byte = ''] = dataURI.split(',');
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        const byteString = atob(byte);
        // separate out the mime component
        const mimeString = mime.split(':')[1].split(';')[0];
        // write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);
        const dw = new DataView(ab);

        for (let i = 0; i < byteString.length; i++) {
            dw.setUint8(i, byteString.charCodeAt(i));
        }

        // write the ArrayBuffer to a blob, and you're done
        return new Blob([ab], { type: mimeString });
    }

    /**
    * Transform every data-uri in the message content to embedded attachment
    * @param {Resource} message
    * @return {Promise}
    */
    function extractDataURI(message) {
        const content = message.getDecryptedBody();
        const testDiv = document.createElement('DIV');

        testDiv.innerHTML = content;

        const images = testDiv.querySelectorAll('img');

        const promises = _.chain([].slice.call(images))
            .filter(({ src }) => /data:image/.test(src)) // only data:uri image
            .filter(({ src }) => src.includes(',')) // remove invalid data:uri
            .map((image) => {
                const cid = embedded.generateCid(image.src, message.From.Email);
                const setEmbeddedImg = () => {
                    image.setAttribute('data-embedded-img', cid);

                    return Promise.resolve();
                };

                if (embedded.exist(message, cid)) {
                    return setEmbeddedImg();
                }

                const file = dataURItoBlob(image.src);

                file.name = image.alt || 'image' + Date.now();
                file.inline = 1;

                return attachmentModel.create(file, message, true, cid).then(setEmbeddedImg);
            })
            .value();

        return Promise.all(promises)
            .then(() => {
                message.setDecryptedBody(testDiv.innerHTML);
                return message;
            });
    }

    $scope.slideDown = (message) => {
        message.attachmentsToggle = !message.attachmentsToggle;
    };

    $scope.isEmbedded = (attachment) => {
        return embedded.isEmbedded(attachment);
    };


    /**
     * Bind the From configuration to a message and update the AddressID if we need to
     * @param  {String} options.AddressID
     * @return {Object}
     */
    function bindFrom({ AddressID }) {

        const addresses = _.chain(authentication.user.Addresses)
            .where({ Status: 1, Receive: 1 })
            .sortBy('Send')
            .value();

        if (AddressID) {
            // If you try to create a reply from a disabled alias, bind the first Address.
            const adr = _.findWhere(addresses, { ID: AddressID });
            return {
                From: adr || addresses[0],
                AddressID: adr ? AddressID : addresses[0].ID
            };
        }
        return {
            From: addresses[0],
            AddressID: addresses[0].ID
        };
    }

    /**
     * Add message in composer list
     * @param {Object} message
     */
    function initMessage(message) {

        if (authentication.user.Delinquent < 3) {
            // Not in the delinquent state
        } else {
            // In delinquent state
            notify({ message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger' });
            return false;
        }

        if (authentication.user.ComposerMode === 1) {
            message.maximized = true;
            $rootScope.maximizedComposer = true;
        }

        message.attachmentsToggle = (message.Attachments.length - message.NumEmbedded) > 0 && (message.Attachments.length > message.NumEmbedded);
        message.ccbcc = false;
        message.autocompletesFocussed = false;

        // Mark message as read
        if (message.IsRead === 0) {
            const ids = [message.ID];
            $rootScope.$emit('messageActions', { action: 'read', data: { ids } });
        }

        // if tablet we maximize by default
        if (tools.findBootstrapEnvironment() === 'sm') {
            message.maximized = true;
            if ($scope.messages.length > 0) {
                notify.closeAll();
                notify({ message: gettextCatalog.getString('Maximum composer reached', null, 'Error'), classes: 'notification-danger' });
                return;
            }
        }

        message.uid = $scope.uid++;
        message.pendingAttachements = [];
        message.askEmbedding = false;
        delete message.asEmbedded;
        message.uploading = 0;
        message.sending = false;

        const { From, AddressID } = bindFrom(message);
        message.From = From;
        message.AddressID = AddressID;

        $scope.$applyAsync(() => {
            const size = $scope.messages.unshift(message);

            recordMessage(message)
            .then(() => {
                $rootScope.$emit('composer.update', {
                    type: 'loaded',
                    data: { size, message }
                });
            })
            .catch((error) => {
                console.error(error);
                const [, ...list] = $scope.messages;
                $scope.messages = list;
            });

        });
    }

    $scope.togglePanel = (message, panelName) => {
        if (message.displayPanel === true) {
            $scope.closePanel(message);
        } else {
            $scope.openPanel(message, panelName);
        }
    };

    $scope.openPanel = (message, panelName) => {
        message.displayPanel = true;
        message.panelName = panelName;

        if (panelName === 'encrypt') {
            $timeout(() => {
                angular.element('#uid' + message.uid + ' input[name="outsidePw"]').focus();
            }, 100, false);
        }
    };

    $scope.closePanel = (message) => {
        message.displayPanel = false;
        message.panelName = '';
    };

    $scope.setEncrypt = (message, params) => {
        if (params.password.length === 0) {
            notify({ message: 'Please enter a password for this email.', classes: 'notification-danger' });
            return false;
        }

        if (params.password !== params.confirm) {
            notify({ message: 'Message passwords do not match.', classes: 'notification-danger' });
            return false;
        }

        message.IsEncrypted = 1;
        message.Password = params.password;
        message.PasswordHint = params.hint;
        $scope.closePanel(message);
    };

    $scope.clearEncrypt = (message, params, form) => {
        params.password = '';
        params.confirm = '';
        params.hint = '';
        form.$setUntouched();
        delete message.PasswordHint;
        message.IsEncrypted = 0;
        $scope.closePanel(message);
    };

    /**
     * Intialize the expiration panel
     * @param {Object} message
     * @param {Object} params
     */
    $scope.initExpiration = (message, params) => {
        let hours = 0;
        let days = 0;
        let weeks = 0;

        if (angular.isDefined(message.ExpirationTime)) {
            const deltaHours = message.ExpirationTime / 3600;
            const deltaDays = Math.floor(deltaHours / 24);
            hours = deltaHours % 24;
            weeks = Math.floor(deltaDays / 7);
            days = deltaDays % 7;
        }

        params.expirationWeeks = _.findWhere($scope.weekOptions, { value: weeks });
        params.expirationDays = _.findWhere($scope.dayOptions, { value: days });
        params.expirationHours = _.findWhere($scope.hourOptions, { value: hours });
    };

    /**
     * Set expiration time if valid value
     * @param {Object} message
     * @param {Object} params
     */
    $scope.setExpiration = (message, params) => {
        const hours = params.expirationHours.value + params.expirationDays.value * 24 + params.expirationWeeks.value * 24 * 7;
        let error = false;

        if (parseInt(hours, 10) > CONSTANTS.MAX_EXPIRATION_TIME) { // How can we enter in this situation?
            notify({ message: 'The maximum expiration is 4 weeks.', classes: 'notification-danger' });
            error = true;
        }

        if (isNaN(hours)) {
            notify({ message: 'Invalid expiration time.', classes: 'notification-danger' });
            error = true;
        }

        if (error === false) {
            message.ExpirationTime = hours * 3600; // seconds
        }
    };

    /**
     * Remove expiration time value
     * @param {Object} message
     */
    $scope.clearExpiration = (message) => {
        delete message.ExpirationTime;
        $scope.closePanel(message);
    };

    /**
     * Delay the saving
     * @param {Object} message
     */
    $scope.saveLater = (message) => !message.sending && recordMessage(message, { autosaving: true, loader: false });

    $scope.validate = (message) => {
        const deferred = $q.defer();

        angular.element('input').blur();

        message.setDecryptedBody(tools.fixImages(message.getDecryptedBody()));

        // We delay the validation to let the time for the autocomplete
        $timeout(() => {
            // Check if there is an attachment uploading
            if (message.uploading > 0) {
                deferred.reject('Wait for attachment to finish uploading or cancel upload.');
                return false;
            }

            // Check all emails to make sure they are valid
            const allEmails = _.map(message.ToList.concat(message.CCList).concat(message.BCCList), ({ Address = '' } = {}) => Address.trim());
            const invalidEmails = _.filter(allEmails, (email) => !tools.validEmail(email));

            if (invalidEmails.length > 0) {
                deferred.reject('Invalid email(s): ' + invalidEmails.join(',') + '.');
                return false;
            }

            // MAX 25 to, cc, bcc
            if ((message.ToList.length + message.BCCList.length + message.CCList.length) > 25) {
                deferred.reject('The maximum number (25) of Recipients is 25.');
                return false;
            }

            if (message.ToList.length === 0 && message.BCCList.length === 0 && message.CCList.length === 0) {
                deferred.reject('Please enter at least one recipient.');
                return false;
            }

            // Check title length
            if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
                deferred.reject('The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.');
                return false;
            }

            // Check body length
            if (message.getDecryptedBody().length > 16000000) {
                deferred.reject('The maximum length of the message body is 16,000,000 characters.');
                return false;
            }

            deferred.resolve();
        }, 500, false);

        return deferred.promise;
    };

    $scope.save = (message, notification = false, autosaving = false) => {
        const msg = new Message(message);
        return embedded.parser(msg, 'cid')
            .then((result) => {
                msg.Body = result;
                return recordMessage(msg, { notification, autosaving });
            });
    };

    /**
     * Handle the draft request
     * @param {Object} parameters
     * @param {Integer} type
     * @return {Promise}
     */
    function draftRequest(parameters, type) {
        const CREATE = 1;
        const UPDATE = 2;
        const errorMessage = gettextCatalog.getString('Saving draft failed, please try again', null, 'Info');
        let promise;

        if (type === UPDATE) {
            promise = Message.updateDraft(parameters).$promise;
        } else if (type === CREATE) {
            promise = Message.createDraft(parameters).$promise;
        }

        return promise.then((data = {}) => {
            if ((data.Code === 1000 || data.Code === 15033)) {
                return data;
            }
            throw new Error(data.Error || errorMessage);
        }, () => {
            throw new Error(errorMessage);
        });
    }

    /**
     * Save the Message
     * @param {Resource} message - Message to save
     * @param {Boolean} notification - Add a notification when the saving is complete
     * @param {Boolean} autosaving
     */
    function recordMessage(message, { notification = false, autosaving = false, loader = true } = {}) {
        // Variables
        const CREATE = 1;
        const UPDATE = 2;
        let actionType;
        const deferred = $q.defer();
        const parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead')
        };

        message.saving = true;
        message.autosaving = autosaving;
        dispatchMessageAction(message);

        if (angular.isUndefined(parameters.Message.Subject)) {
            parameters.Message.Subject = '';
        }

        if (angular.isString(parameters.Message.ToList)) {
            parameters.Message.ToList = [];
        }

        if (angular.isString(parameters.Message.CCList)) {
            parameters.Message.CCList = [];
        }

        if (angular.isString(parameters.Message.BCCList)) {
            parameters.Message.BCCList = [];
        }

        if (angular.isDefined(message.ParentID)) {
            parameters.ParentID = message.ParentID;
            parameters.Action = message.Action;
        }

        if (angular.isDefined(message.ID)) {
            parameters.id = message.ID;
        } else {
            parameters.Message.IsRead = 1;
        }

        if (autosaving === false) {
            parameters.Message.IsRead = 1;
        }

        parameters.Message.AddressID = message.AddressID;
        parameters.Message.Packages = [];

        // Encrypt message body with the first public key for the From address
        composerRequestModel.chain(message)
        .then(([{ ID } = {}]) => {
            if (ID) {
                message.ID = ID;
                parameters.id = ID;
            }
            return embedded.parser(message, 'cid');
        })
        .then((body) => (message.setDecryptedBody(body), message))
        .then(() => {
            if (autosaving && message.Attachments.length && message.Attachments.every(({ uploading }) => uploading !== true)) {
                return encryptUserBody(message, deferred, parameters.Message.Packages)
                    .insideUser(message.From.Keys[0].PublicKey, message.From.Email);
            }

            return message.encryptBody(message.From.Keys[0].PublicKey);
        })
        .then((result) => {
            // Set encrypted body
            parameters.Message.Body = result;

            if (message.ID) {
                actionType = UPDATE;
            } else {
                actionType = CREATE;
            }

            // Save draft before to send
            return draftRequest(parameters, actionType)
            .then((result) => {
                if (result.Code === 1000) {
                    const events = [];
                    const conversation = cache.getConversationCached(result.Message.ConversationID);
                    const numUnread = angular.isDefined(conversation) ? conversation.NumUnread : 0;
                    let numMessages;

                    if (actionType === CREATE) {
                        numMessages = angular.isDefined(conversation) ? (conversation.NumMessages + 1) : 1;
                        message.ID = result.Message.ID;
                    } else if (actionType === UPDATE) {
                        numMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
                    }

                    message.IsRead = result.Message.IsRead;
                    message.Time = result.Message.Time;
                    message.Type = result.Message.Type;
                    message.LabelIDs = result.Message.LabelIDs;

                    if (result.Message.Attachments.length > 0) {
                        message.Attachments = syncAttachmentsRemote(message.Attachments, result.Message.Attachments);
                    }

                    result.Message.Senders = [result.Message.Sender]; // The back-end doesn't return Senders so need a trick
                    result.Message.Recipients = _.uniq(result.Message.ToList.concat(result.Message.CCList).concat(result.Message.BCCList)); // The back-end doesn't return Recipients

                    // Update draft in message list
                    events.push({ Action: actionType, ID: result.Message.ID, Message: result.Message });

                    // Generate conversation event
                    const firstConversation = {
                        Recipients: result.Message.Recipients,
                        Senders: result.Message.Senders,
                        Subject: result.Message.Subject
                    };

                    // Generate conversation event
                    events.push({
                        Action: 3,
                        ID: result.Message.ConversationID,
                        Conversation: angular.extend({
                            NumAttachments: result.Message.Attachments.length, // it's fine
                            NumMessages: numMessages,
                            NumUnread: numUnread,
                            ID: result.Message.ConversationID,
                            LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
                        }, numMessages === 1 ? firstConversation : {})
                    });

                    // Send events
                    cache.events(events);

                    if (notification === true) {
                        notify({ message: gettextCatalog.getString('Message saved', null), classes: 'notification-success' });
                    }

                    message.saving = false;
                    message.autosaving = false;
                    dispatchMessageAction(message);
                    deferred.resolve(result.Message);
                } else if (result.Code === 15033) {
                    // Case where the user delete draft in an other terminal
                    delete parameters.id;
                    Message.createDraft(parameters).$promise.then((result) => deferred.resolve(result.Message));
                }
            });
        })
        .catch((error) => {
            message.saving = false;
            message.autosaving = false;
            dispatchMessageAction(message);
            composerRequestModel.clear(message);
            deferred.reject(error);
        });

        if (autosaving === false || loader) {
            networkActivityTracker.track(deferred.promise);
        }

        composerRequestModel.save(message, deferred);

        return deferred.promise;
    }

    /**
     * Extend local attachements for a message with remote's
     * @param  {Array} collection Attachements from the message
     * @param  {Array} list       Attachements from the remote
     * @return {Array}            Merge
     */
    function syncAttachmentsRemote(collection, list) {
        return list
            .reduce((acc, att = {}) => {
                // Find if attachement already exists
                const item = _.filter(collection, ({ AttachmentID, ID }) => ID === att.ID || AttachmentID === att.ID)[0];

                const data = angular.extend({}, item, att);

                acc.push(data);
                return acc;
            }, []);
    }

    /**
     * Return the subject title of the composer
     */
    $scope.subject = (message) => {
        return message.Subject || gettextCatalog.getString('New message', null, 'Title');
    };

    /**
     * Check if the subject of this message is empty
     * And ask the user to send anyway
     * @param {Object} message
     */
    function checkSubject({ Subject }) {
        const deferred = $q.defer();
        const title = gettextCatalog.getString('No subject', null, 'Title');
        const text = gettextCatalog.getString('No subject, send anyway?', null, 'Info');

        if (!Subject) {
            confirmModal.activate({
                params: {
                    title,
                    message: text,
                    confirm() {
                        confirmModal.deactivate();
                        deferred.resolve();
                    },
                    cancel() {
                        confirmModal.deactivate();
                        deferred.reject();
                    }
                }
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    }

    function dispatchMessageAction(message) {
        $rootScope.$emit('actionMessage', message);
    }

    function encryptUserBody(message, deferred, Packages) {
        const insideUser = (key, Address) => {
            return Promise
                .all([message.encryptBody(key), message.encryptPackets(key)])
                .then(([Body, KeyPackets]) => (Packages.push({ Address, Type: 1, Body, KeyPackets }), Body))
                .catch(deferred.reject);
        };

        const outsideUser = (Token, Address) => {

            return Promise
                .all([
                    pmcw.encryptMessage(Token, [], message.Password),
                    pmcw.encryptMessage(message.getDecryptedBody(), [], message.Password),
                    message.encryptPackets('', message.Password)
                ])
                .then(([EncToken, Body, KeyPackets]) => {
                    return Packages
                        .push({
                            Type: 2,
                            PasswordHint: message.PasswordHint,
                            Address, Token, Body, KeyPackets, EncToken
                        });
                })
                .catch((error) => {
                    message.encrypting = false;
                    dispatchMessageAction(message);
                    $log.error(error);
                });
        };


        const getPromises = (emails, keys = {}) => {

            let outsiders = false;
            // We remove duplicatas
            const promises = _.chain(emails)
                .uniq()
                .reduce((acc, email) => {
                    // Inside user
                    if (keys[email] && keys[email].length > 0) {
                        // Encrypt content body in with the public key user
                        acc.push(insideUser(keys[email], email));
                        return acc;
                    }
                    // Outside user
                    outsiders = true;

                    if (message.IsEncrypted === 1) {
                        acc.push(outsideUser(message.generateReplyToken(), email));
                    }

                    return acc;
                }, [])
                .value();

            return { outsiders, promises };
        };

        return { getPromises, insideUser };
    }

    function encryptBodyFromEmails(message, emails, parameters, deferred) {

        // Wrap the promise to isolate its chaining
        return new Promise((resolve, reject) => {
            message
                .getPublicKeys(emails)
                .then(({ data = {} } = {}) => {

                    if (data.Code !== 1000) {
                        message.encrypting = false;
                        dispatchMessageAction(message);
                        const error = new Error('Error during get public keys user request');
                        deferred.reject(error);
                        return reject(error);
                    }

                    const keys = data; // Save result in keys variables
                    parameters.Packages = [];

                    const encryptingBody = encryptUserBody(message, deferred, parameters.Packages)
                        .getPromises(emails, keys);

                    const outsiders = encryptingBody.outsiders; // Initialize to false a Boolean variable to know if there are outsiders email in recipients list

                    const promises = encryptingBody.promises;

                    // If there are some outsiders
                    if (outsiders === true && message.Password.length === 0) {
                        parameters.AttachmentKeys = [];
                        parameters.ClearBody = message.getDecryptedBody(); // Add a clear body in parameter

                        if (message.Attachments.length > 0) {
                            // Add clear attachments packet in parameter
                            promises.push(
                                message
                                    .clearPackets()
                                    .then((packets) => parameters.AttachmentKeys = packets)
                                    .catch(deferred.reject)
                            );
                        }
                    }

                    resolve({ outsiders, promises });
                })
                .catch((error) => {
                    message.encrypting = false;
                    dispatchMessageAction(message);
                    error.message = 'Error getting the public key';
                    deferred.reject(error);
                    reject(error);
                });
        });
    }

    /**
     * Try to send message specified
     * @param {Object} message
     */
    $scope.send = (msg) => {
        // Prevent mutability
        const message = new Message(msg);
        const setStateSending = (is) => message.sending = msg.sending = is;

        message.Password = message.Password || '';
        message.PasswordHint = message.PasswordHint || '';
        setStateSending(true);

        dispatchMessageAction(message);

        const deferred = $q.defer();
        const parameters = {};

        $scope.validate(message)
        .then(() => checkSubject(message))
        .then(() => extractDataURI(message))
        .then(() => recordMessage(message))
        .then((messageSaved) => (message.ID = messageSaved.ID, message))
        .then(() => {
            message.encrypting = true;
            dispatchMessageAction(message);
            parameters.id = message.ID;
            parameters.ExpirationTime = message.ExpirationTime;
            return message.emailsToString();
        })
        .then((emails) => encryptBodyFromEmails(message, emails, parameters, deferred))
        .then(({ promises = [], outsiders }) => {
            // When all promises are complete
            $q.all(promises).then(() => {
                if (outsiders === true && message.Password.length === 0 && message.ExpirationTime) {
                    $log.error(message);
                    message.encrypting = false;
                    setStateSending(false);
                    dispatchMessageAction(message);

                    // Reject the error => to see the notification, and break the sending process
                    const error = new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.');
                    deferred.reject(error);
                    throw error;
                }

                message.encrypting = false;
                dispatchMessageAction(message);
                return Message.send(parameters).$promise;
            })
            .then((data = {}) => {
                const { ErrorDescription, Code } = data;
                // Check if there is an error coming from the server, then reject the process
                if (data.Error) {
                    const msg = ErrorDescription ? `${data.Error}: ${ErrorDescription}` : data.Error;
                    const error = new Error(msg);
                    error.code = Code;
                    return Promise.reject(error);
                }
                return data;
            })
            .then((data = {}) => {
                const { Parent, Sent = {} } = data;
                const events = [];
                const conversation = cache.getConversationCached(Sent.ConversationID);
                const numMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
                const numUnread = angular.isDefined(conversation) ? conversation.NumUnread : 0;

                Sent.Senders = [Sent.Sender]; // The back-end doesn't return Senders so need a trick
                Sent.Recipients = _.uniq(message.ToList.concat(message.CCList).concat(message.BCCList)); // The back-end doesn't return Recipients
                events.push({ Action: 3, ID: Sent.ID, Message: Sent }); // Generate event for this message

                if (Parent) {
                    events.push({ Action: 3, ID: Parent.ID, Message: Parent });
                }

                events.push({
                    Action: 3,
                    ID: Sent.ConversationID,
                    Conversation: {
                        NumMessages: numMessages,
                        NumUnread: numUnread,
                        Recipients: Sent.Recipients,
                        Senders: Sent.Senders,
                        Subject: Sent.Subject,
                        ID: Sent.ConversationID,
                        LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.sent],
                        LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
                    }
                });

                cache.events(events, false, true); // Send events to the cache manager
                notify({ message: gettextCatalog.getString('Message sent', null), classes: 'notification-success' }); // Notify the user

                $scope.close(message, false, false); // Close the composer window
                $timeout(() => {
                    $rootScope.$emit('message.open', {
                        type: 'save.success',
                        data: {
                            message: new Message(Sent)
                        }
                    });
                }, 500, false);
                deferred.resolve(data); // Resolve finally the promise
            })
            .catch((error) => {
                setStateSending(false);
                message.encrypting = false;
                dispatchMessageAction(message);
                deferred.reject(error);
            });
        })
        .catch((error) => {
            setStateSending(false);
            message.encrypting = false;
            dispatchMessageAction(message);
            deferred.reject(error);
        });
        networkActivityTracker.track(deferred.promise);
        return deferred.promise;
    };

    /**
     * Focus the first not minimized composer window
     * @param {Object} message
     * @param {Boolean} discard
     * @param {Boolean} save
     */

    $scope.focusFirstComposer = (message) => {
        $rootScope.$emit('composer.update', {
            type: 'focus.first',
            data: { message }
        });
    };

    $scope.minimize = (message) => {
        message.minimized = true;
        message.previousMaximized = message.maximized;
        message.maximized = false;
        message.ccbcc = false;
        $rootScope.maximizedComposer = false;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        $scope.focusFirstComposer(message);
    };

    $scope.unminimize = (message) => {
        message.minimized = false;
        message.maximized = message.previousMaximized;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
    };

    $scope.maximize = (message) => {
        message.maximized = true;
        $rootScope.maximizedComposer = true;
    };

    $scope.normalize = (message) => {
        message.minimized = false;
        message.maximized = false;
        $rootScope.maximizedComposer = false;
    };

    $scope.openCloseModal = (message, discard = false) => {
        $scope.close(message, discard, !discard);
    };


    /**
     * Remove a message from the list of messages
     * @param  {Array} list    List of messages
     * @param  {Ressource} message Message to remove
     * @return {Array}
     */
    function removeMessage(list, message) {
        return _.filter(list, (item) => message.uid !== item.uid);
    }

    /**
     * Close the composer window
     * @param {Object} message
     * @param {Boolean} discard
     * @param {Boolean} save
     */
    $scope.close = (message, discard, save) => {
        const process = () => {
            // Remove message in composer controller
            $scope.messages = removeMessage($scope.messages, message);

            $rootScope.$emit('composer.close', message);
            composerRequestModel.clear(message);

            // Hide all the tooltip
            $('.tooltip').not(this).hide();

            $rootScope.$emit('composer.update', {
                type: 'close',
                data: {
                    size: $scope.messages.length,
                    message
                }
            });
        };

        if (discard === true) {
            const ids = [message.ID];

            $rootScope.$emit('messageActions', { action: 'delete', data: { ids } });
        }

        $rootScope.activeComposer = false;
        $rootScope.maximizedComposer = false;
        $timeout.cancel(message.defferredSaveLater);

        if (save === true) {
            recordMessage(message, { autosaving: true }).then(process);
        } else {
            process();
        }
    };

    /**
     * Move draft message to trash
     * @param {Object} message
     * @return {Promise}
     */
    $scope.discard = (message) => {
        const title = gettextCatalog.getString('Delete', null);
        const question = gettextCatalog.getString('Permanently delete this draft?', null);

        confirmModal.activate({
            params: {
                title,
                message: question,
                confirm() {
                    $scope.openCloseModal(message, true);
                    notify({ message: gettextCatalog.getString('Message discarded', null), classes: 'notification-success' });
                    confirmModal.deactivate();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };
});
