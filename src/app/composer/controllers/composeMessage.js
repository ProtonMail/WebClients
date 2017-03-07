angular.module('proton.composer')
.controller('ComposeMessageController', (
    $filter,
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
    messageModel,
    messageApi,
    embedded,
    networkActivityTracker,
    composerRequestModel,
    attachmentModel,
    messageBuilder,
    notify,
    pmcw,
    tools,
    AppModel,
    ComposerRequestStatus
) => {

    const unsubscribe = [];

    const MESSAGES_ERROR = {
        stillUploading: gettextCatalog.getString('Wait for attachment to finish uploading or cancel upload.', null, 'Error'),
        invalidEmails(total) {
            return gettextCatalog.getString(`Invalid email(s): ${total}.`, null, 'Error');
        },
        maxBodyLength: gettextCatalog.getString('The maximum length of the message body is 16,000,000 characters.', null, 'Error'),
        noRecipient: gettextCatalog.getString('Please enter at least one recipient.', null, 'Error'),
        maxSubjectLength: gettextCatalog.getString(`The maximum length of the subject is ${CONSTANTS.MAX_TITLE_LENGTH}.`, null, 'Error'),
        maxRecipients(total) {
            return gettextCatalog.getString(`The maximum number (${total}) of Recipients is 25.`, null, 'Error');
        }
    };

    $scope.messages = [];
    $scope.uid = 1;

    // Listeners
    unsubscribe.push($scope.$watch('messages.length', () => {
        if ($scope.messages.length > 0) {
            AppModel.set('activeComposer', true);

            window.onbeforeunload = () => {
                return gettextCatalog.getString('By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.', null);
            };
            hotkeys.unbind(); // Disable hotkeys
        } else {
            AppModel.set('activeComposer', false);
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


    const isSent = ({ Type } = {}) => Type === CONSTANTS.INBOX_AND_SENT || Type === CONSTANTS.SENT;
    unsubscribe.push($rootScope.$on('app.event', (event, { type, data }) => {
        switch (type) {
            case 'activeMessages': {
                // If you send the current draft from another tab/app we need to remove it from the composerList
                const removed = $scope.messages.filter(({ ID = '' }) => {
                    const msg = _.findWhere(data.messages, { ID });
                    return (msg && isSent(msg));
                });

                removed.length && removed.forEach((message) => {
                    closeComposer(message);
                    !message.sending && notify(gettextCatalog.getString('Your message was sent from another session', null, 'Info'));
                });

                break;
            }
        }
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

            case 'close.panel': {
                $scope.closePanel(data.message);
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
        const limit = ($scope.messages.length >= CONSTANTS.MAX_NUMBER_COMPOSER) || ($scope.messages.length === 1 && AppModel.is('mobile'));

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
            AppModel.set('maximizedComposer', true);
        }

        message.attachmentsToggle = (message.Attachments.length - message.NumEmbedded) > 0 && (message.Attachments.length > message.NumEmbedded);
        message.ccbcc = false;
        message.autocompletesFocussed = false;

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
            .catch(() => {
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

    /**
     * Delay the saving
     * @param {Object} message
     */
    $scope.saveLater = (message) => !message.sending && recordMessage(message, { autosaving: true, loader: false });

    $scope.validate = (message) => {
        const deferred = $q.defer();
        const reject = (label) => deferred.reject(new Error(label));
        message.setDecryptedBody(tools.fixImages(message.getDecryptedBody()));
        angular.element('input').blur();

        // We delay the validation to let the time for the autocomplete
        $timeout(() => {
            // Check if there is an attachment uploading
            if (message.uploading > 0) {
                return reject(MESSAGES_ERROR.stillUploading);
            }

            // Check all emails to make sure they are valid
            const allEmails = _.map(message.ToList.concat(message.CCList, message.BCCList), ({ Address = '' } = {}) => Address.trim());
            const invalidEmails = _.filter(allEmails, (email) => !tools.validEmail(email));
            const totalDestEmails = message.ToList.length + message.BCCList.length + message.CCList.length;

            if (invalidEmails.length > 0) {
                return reject(MESSAGES_ERROR.invalidEmails(invalidEmails.join(',')));
            }

            // MAX 25 to, cc, bcc
            if (totalDestEmails > 25) {
                return reject(MESSAGES_ERROR.maxRecipients(totalDestEmails));
            }

            if (totalDestEmails === 0) {
                return reject(MESSAGES_ERROR.noRecipient);
            }

            // Check title length
            if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
                return reject(MESSAGES_ERROR.maxSubjectLength);
            }

            // Check body length
            if (message.getDecryptedBody().length > 16000000) {
                return reject(MESSAGES_ERROR.maxBodyLength);
            }

            deferred.resolve();
        }, 500, false);

        return deferred.promise;
    };

    $scope.save = (message, notification = false, autosaving = false) => {
        const msg = messageModel(message);
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
    function draftRequest(parameters, message, type) {
        const CREATE = 1;
        const UPDATE = 2;
        const errorMessage = gettextCatalog.getString('Saving draft failed, please try again', null, 'Info');
        let promise;

        if (type === UPDATE) {
            promise = messageApi.updateDraft(parameters);
        } else if (type === CREATE) {
            promise = messageApi.createDraft(parameters);
        }

        return promise.then(({ data = {} } = {}) => {

            if ((data.Code === ComposerRequestStatus.SUCCESS || data.Code === ComposerRequestStatus.DRAFT_NOT_EXIST)) {
                return data;
            }

            // Message Already sent
            if (data.Code === ComposerRequestStatus.MESSAGE_ALREADY_SEND) {
                closeComposer(message);
            }

            throw new Error(data.Error || errorMessage);
        })
        .catch((error) => {
            throw (error || new Error(errorMessage));
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
            return draftRequest(parameters, message, actionType)
            .then((result) => {

                if (result.Code === ComposerRequestStatus.SUCCESS) {
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
                } else if (result.Code === ComposerRequestStatus.DRAFT_NOT_EXIST) {
                    // Case where the user delete draft in an other terminal
                    delete parameters.id;
                    messageApi.createDraft(parameters)
                    .then(({ data = {} } = {}) => deferred.resolve(data.Message));
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

                    if (data.Code !== ComposerRequestStatus.SUCCESS) {
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
        const message = messageModel(msg);
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
                return messageApi.send(parameters);
            })
            .then(({ data = {} } = {}) => {
                const { ErrorDescription, Code } = data;
                // Check if there is an error coming from the server, then reject the process
                if (data.Error) {
                    const msg = ErrorDescription ? `${data.Error}: ${ErrorDescription}` : data.Error;
                    const error = new Error(msg);
                    error.code = Code;
                    throw error;
                }
                return data;
            })
            .then((data = {}) => {
                const { Parent, Sent = {} } = data;
                const events = [];
                const conversation = cache.getConversationCached(Sent.ConversationID);
                const numMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
                const numUnread = angular.isDefined(conversation) ? conversation.NumUnread : 0;

                result.Sent.Senders = [Sent.Sender]; // The back-end doesn't return Senders so need a trick
                result.Sent.Recipients = _.uniq(message.ToList.concat(message.CCList).concat(message.BCCList)); // The back-end doesn't return Recipients
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
                            message: messageModel(Sent)
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
        AppModel.set('maximizedComposer', false);
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
        AppModel.set('maximizedComposer', true);
    };

    $scope.normalize = (message) => {

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmall = (width <= 640 || height <= 500);

        message.minimized = false;
        message.maximized = isSmall;
        AppModel.set('maximizedComposer', isSmall);

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
    $scope.close = closeComposer;
    function closeComposer(msg, discard, save) {
        const message = messageModel(msg);
        const process = () => {
            // Remove message in composer controller
            $scope.messages = removeMessage($scope.messages, message);
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

        AppModel.set('activeComposer', false);
        AppModel.set('maximizedComposer', false);
        $timeout.cancel(message.defferredSaveLater);

        if (save === true) {
            recordMessage(message, { autosaving: true }).then(process);
        } else {
            process();
        }
    }

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
