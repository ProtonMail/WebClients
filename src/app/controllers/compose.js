angular.module('proton.controllers.Compose', ['proton.constants'])
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
    tools
) => {

    const unsubscribe = [];

    $scope.addresses = authentication.user.Addresses;
    $scope.messages = [];
    $scope.isOver = false;
    $scope.queuedSave = false;
    $scope.preventDropbox = false;
    $scope.maxExpiration = CONSTANTS.MAX_EXPIRATION_TIME;
    $scope.uid = 1;
    $scope.isAppleDevice = navigator.userAgent.match(/(iPod|iPhone|iPad)/); // Determine if user navigated from Apple device
    $scope.oldProperties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments', 'ExpirationTime'];
    $scope.numTags = [];
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

        if (!limitReached) {
            initMessage(messageBuilder.create(type, message));
        }
    }));

    unsubscribe.push($rootScope.$on('composer.load', (event, { ID }) => {
        const found = _.findWhere($scope.messages, { ID });
        const limitReached = checkComposerNumber();

        if (!found && !limitReached) {
            cache.getMessage(ID)
            .then((message) => {
                message.clearTextBody()
                .then(() => initMessage(message));
            });
        }
    }));

    unsubscribe.push($rootScope.$on('sendMessage', (event, element, msg) => {
        if (element) {
            const composer = $(element).parents('.composer');
            const index = $('.composer').index(composer);
            const message = $scope.messages[index];

            message && $scope.send(message);
        }

        msg && $scope.send(msg);
    }));

    unsubscribe.push($scope.$on('closeMessage', (event, element) => {
        const composer = $(element).parents('.composer');
        const index = $('.composer').index(composer);
        const message = $scope.messages[index];

        if (angular.isDefined(message)) {
            $scope.close(message, false, false);
        }
    }));

    unsubscribe.push($rootScope.$on('editorLoaded', (event, element, editor, message) => {
        if (message) {
            message.editor = editor;
            editor && listenEditor(message);
            $scope.focusComposer(message);
        }
    }));

    unsubscribe.push($rootScope.$on('message.updated', (e, { message }) => {
        // save when DOM is updated
        recordMessage(message, false, true);
    }));

    unsubscribe.push($rootScope.$on('attachment.upload', (e, { type, data }) => {
        (type === 'remove.success') && recordMessage(data.message, false, true);
    }));

    unsubscribe.push($scope.$on('editorFocussed', (event, element) => {
        const composer = $(element).parents('.composer');
        const index = $('.composer').index(composer);
        const message = $scope.messages[index];

        if (angular.isDefined(message)) {
            $scope.focusComposer(message);
            $scope.$applyAsync(() => {
                message.autocompletesFocussed = false;
                message.attachmentsToggle = false;
                message.ccbcc = false;
            });
        }

    }));

    unsubscribe.push($scope.$on('subjectFocussed', (event, message) => {
        const current = _.findWhere($scope.messages, { uid: message.uid });
        current.autocompletesFocussed = false;
        current.ccbcc = false;
        current.attachmentsToggle = false;
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

    function onOrientationChange() {
        _.each($scope.messages, (message) => {
            $scope.focusComposer(message);
        });
    }

    function onDragOver() {


        /*
            event.preventDefault();
            if we disable the default behavior then
            the text can't be draged inside the iframe.
        */

        $interval.cancel($scope.intervalComposer);
        $interval.cancel($scope.intervalDropzone);

        $scope.intervalComposer = $interval(() => {
            $scope.isOver = false;
            $interval.cancel($scope.intervalComposer);
        }, 100);

        if ($scope.isOver === false) {
            $scope.isOver = true;
        }
    }

    function onDragEnter() {
        /* /!\ force digest over state change */
        $scope.$applyAsync(() => {
            $scope.isOver = true;
        });
    }

    function onDragStart() {
        $scope.preventDropbox = true;
    }

    function onDragEnd(event) {
        event.preventDefault();
        $scope.preventDropbox = false;
        $scope.isOver = false;
    }

    $(window).on('resize', onResize);
    $(window).on('orientationchange', onOrientationChange);
    // $(window).on('dragover', onDragOver);
    // $(window).on('dragstart', onDragStart);
    // $(window).on('dragend', onDragEnd);
    // $(window).on('mouseover', onMouseOver);

    $scope.$on('$destroy', () => {
        $(window).off('resize', onResize);
        $(window).off('dragover', onDragOver);
        // $(window).off('mouseover', onMouseOver);
        $interval.cancel($scope.intervalComposer);
        $interval.cancel($scope.intervalDropzone);
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

    $scope.disabledNotify = () => {
        notify({ message: 'Attachments and inline images must be removed first before changing sender', classes: 'notification-danger' });
    };

    $scope.slideDown = (message) => {
        message.attachmentsToggle = !message.attachmentsToggle;
    };

    $scope.onFocusSubject = (message) => {
        $rootScope.$broadcast('subjectFocussed', message);
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
        message.ccbcc = !!message.CCList.length || !!message.BCCList.length;
        message.autocompletesFocussed = message.ccbcc;

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

        $scope
            .$applyAsync(() => {
                const size = $scope.messages.unshift(message);
                $scope.isOver = false;

                recordMessage(message, false, false).then(() => { // message, notification, autosaving
                    $rootScope.$emit('composer.update', { type: 'loaded', data: { size } });
                }, (error) => {
                    $log.error(error);
                });
            });
    }

    /**
     * Insert / Update signature in the message body
     * @param {Object} message
     */
    $scope.focusComposer = (message) => {

        $scope.selected = message;
        if (!message.focussed) {
            // calculate z-index
            const index = $scope.messages.indexOf(message);

            if (tools.findBootstrapEnvironment() === 'xs') {

                _.each($scope.messages, (element, iteratee) => {
                    if (iteratee > index) {
                        $(element).css('z-index', ($scope.messages.length + (iteratee - index)) * 100);
                    } else {
                        $(element).css('z-index', ($scope.messages.length) * 100);
                    }
                });

                const bottom = $('.composer').eq($('.composer').length - 1);
                const bottomTop = bottom.css('top');
                const bottomZ = bottom.css('zIndex');
                const clicked = $('.composer').eq(index);
                const clickedTop = clicked.css('top');
                let clickedZ = clicked.css('zIndex');

                if (clickedZ === 'auto') {
                    clickedZ = 100; // fix for mobile safari issue
                }

                // TODO: swap ???
                bottom.css({
                    top: clickedTop,
                    zIndex: clickedZ
                });
                clicked.css({
                    top: bottomTop,
                    zIndex: bottomZ
                });
            } else {
                _.each($scope.messages, (element, iteratee) => {
                    if (iteratee > index) {
                        element.zIndex = ($scope.messages.length - (iteratee - index)) * 100;
                    } else {
                        element.zIndex = ($scope.messages.length) * 100;
                    }
                });
            }

            // focus correct field
            const composer = angular.element('#uid' + message.uid);
            const { ToList = [], CCList = [], BCCList = [] } = message;

            if ([].concat(ToList).concat(CCList).concat(BCCList).length === 0) {
                if (!$state.includes('secured.drafts.**')) {
                    $scope.focusTo(message);
                } else {
                    message.editor && message.editor.focus();
                }
            } else if (message.Subject.length === 0) {
                $(composer).find('.subject').focus();
            } else if (message.editor) {
                message.editor.focus();
            }

            _.each($scope.messages, (m) => {
                m.focussed = false;
            });

            message.focussed = true;
        }
    };

    /**
     * Watcher onInput to find and remove attachements if we remove an embedded
     * image from the input
     * @return {Function} Taking message as param
     */
    function removerEmbeddedWatcher() {
        let latestCids = [];

        return (message) => {
            const input = message.editor.getHTML() || '';

            // Extract CID per embedded image
            const cids = (input.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
                .map((value) => value.split(/rel="|data-embedded-img="/)[1].slice(0, -1));

            // If we add or remove an embedded image, the diff is true
            if (cids.length < latestCids.length) {
                // Find attachements not in da input
                const AttToRemove = message
                    .Attachments
                    .filter(({ uploading, Headers = {} }) => {

                        // If the file is uploading it means: its first time
                        if (uploading) {
                            return false;
                        }

                        const cid = Headers['content-id'];
                        if (cid) {
                            return cids.indexOf(cid.replace(/[<>]+/g, '')) === -1;
                        }

                        return false;

                    });

                $rootScope.$emit('attachment.upload', {
                    type: 'remove.all',
                    data: {
                        message,
                        list: AttToRemove
                    }
                });
            }

            latestCids = cids;
        };
    }

    function listenEditor(message) {

        const watcherEmbedded = removerEmbeddedWatcher();

        // Check if we need to remove embedded after a delay
        message.editor.addEventListener('input', _.throttle(() => {
            watcherEmbedded(message);
        }, 300));


        /**
         * There is an input triggered on load (thx to the signature ?)
         * so we will set the listener after a delay.
         * Then the message will be saved every 3s.
         */
        message.defferredSaveLater = $timeout(() => {
            message.editor.addEventListener('input', _.debounce(() => {
                $scope.saveLater(message);
            }, CONSTANTS.SAVE_TIMEOUT_TIME));
        }, CONSTANTS.SAVE_TIMEOUT_TIME, false);

        message.editor.addEventListener('dragstart', onDragStart);
        message.editor.addEventListener('dragend', onDragEnd);
        message.editor.addEventListener('dragenter', onDragEnter);
        message.editor.addEventListener('dragover', onDragOver);

    }

    $scope.toggleCcBcc = (message) => {
        message.ccbcc = !message.ccbcc;
        message.autocompletesFocussed = true;
        message.attachmentsToggle = false;
    };

    $scope.hideFields = (message) => {
        message.ccbcc = false;
    };

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
    $scope.saveLater = (message) => !message.sending && recordMessage(message, false, true);

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

    /**
     * Call when the user change the FROM
     * @param {Resource} message - Message to save
     */
    $scope.changeFrom = (message) => {
        message.AddressID = message.From.ID;
        message.editor && message.editor.fireEvent('refresh', {
            action: 'message.changeFrom'
        });
    };

    /**
     * For some reason IE focus is lost
     * cause a rendering bug of the options widths
     */
    $scope.setFocusFrom = ({ target }) => {
        target.focus();
    };

    $scope.save = (message, notification, autosaving) => {
        const msg = new Message(message);
        return embedded
            .parser(msg, 'cid')
            .then((result) => {
                msg.Body = result;
                return recordMessage(msg, notification, autosaving);
            });
    };

    /**
     * Handle the draft request
     * @param {Object} parameters
     * @param {Integer} type
     * @return {Promise}
     */
    function draftRequest(parameters, type) {
        const deferred = $q.defer();
        const CREATE = 1;
        const UPDATE = 2;
        const errorMessage = gettextCatalog.getString('Saving draft failed, please try again', null, 'Info');
        let promise;

        if (type === UPDATE) {
            promise = Message.updateDraft(parameters).$promise;
        } else if (type === CREATE) {
            promise = Message.createDraft(parameters).$promise;
        }

        promise
        .then((data) => {
            if (data && (data.Code === 1000 || data.Code === 15033)) {
                deferred.resolve(data);
            } else if (data && data.Error) {
                deferred.reject(data.Error);
            } else {
                deferred.reject(errorMessage);
            }
        }, () => {
            deferred.reject(errorMessage);
        });

        return deferred.promise;
    }

    /**
     * Save the Message
     * @param {Resource} message - Message to save
     * @param {Boolean} notification - Add a notification when the saving is complete
     * @param {Boolean} autosaving
     */
    function recordMessage(message, notification, autosaving) {
        // Variables
        const CREATE = 1;
        const UPDATE = 2;
        let actionType;
        const deferred = $q.defer();
        const parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead')
        };

        message.saving = true;
        message.autosaving = autosaving || false;
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

        if (autosaving === false) {
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

    /**
     * Generate a sessionKey for attachements if they don't have one
     * @param  {Message} message
     * @return {Promise}
     */
    function getSessionKey(message) {
        const keys = authentication.getPrivateKeys(message.AddressID);
        const promises = _.chain(message.Attachments)
            .filter((attachment) => !attachment.sessionKey)
            .map((attachment) => {
                // decode key packets
                const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
                return pmcw
                    .decryptSessionKey(keyPackets, keys)
                    .then((sessionKey) => (attachment.sessionKey = sessionKey, attachment))
                    .catch($log.error);
            })
            .value();

        return $q.all(promises);
    }

    function encryptUserBody(message, deferred, Packages) {
        const insideUser = (key, Address) => {
            return message
                .encryptBody(key)
                .then((Body) => {
                    return getSessionKey(message)
                        .then(() => message.encryptPackets(key))
                        .then((KeyPackets) => (Packages.push({ Address, Type: 1, Body, KeyPackets }), Body));
                }, deferred.reject);
        };

        const outsideUser = (Token, Address) => {
            return pmcw
                .encryptMessage(Token, [], message.Password)
                .then((EncToken) => {
                    // return getSessionKey(message)
                    //     .then(pmcw.encryptMessage(message.getDecryptedBody(), [], message.Password))
                    return pmcw
                        .encryptMessage(message.getDecryptedBody(), [], message.Password)
                        .then((Body) => {
                            return message
                                .encryptPackets('', message.Password)
                                .then((KeyPackets) => {
                                    return Packages
                                        .push({
                                            Type: 2,
                                            PasswordHint: message.PasswordHint,
                                            Address, Token, Body, KeyPackets, EncToken
                                        });
                                });
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
        .then(() => recordMessage(message, false, false))
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
                    return deferred.reject(new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.'));
                }

                message.encrypting = false;
                dispatchMessageAction(message);
                return Message.send(parameters).$promise;
            })
            .then((result = {}) => {

                // Check if there is an error coming from the server, then reject the process
                if (result.Error) {

                    let error;
                    // Internal recipient not found
                    if (result.Code === 15198) {
                        const { ErrorDescription } = result;
                        const msg = ErrorDescription ? `${result.Error}: ${ErrorDescription}` : result.Error;

                        error = new Error(msg);
                    } else {
                        error = new Error(result.Error);
                    }

                    deferred.reject(error);
                    return $q.reject(error);
                }

                return result;
            })
            .then((result = {}) => {
                const { Parent, Sent = {} } = result;
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
                            message: new Message(Sent)
                        }
                    });
                }, 500, false);
                deferred.resolve(result); // Resolve finally the promise
            })
            .catch((error) => {
                setStateSending(false);
                message.encrypting = false;
                dispatchMessageAction(message);
                error.message = 'Sending failed, please try again';
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
        const messageFocussed = !!message.focussed;
        const isFocusable = _.find($scope.messages, (x) => x.minimized === false);
        if (messageFocussed && !angular.isUndefined(isFocusable)) {
            $scope.focusComposer(isFocusable);
        }
    };

    $scope.minimize = (message) => {
        message.minimized = true;
        message.previousMaximized = message.maximized;
        message.maximized = false;
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

    $scope.openCloseModal = (message) => {

        if (message.editor) {
            message.editor.removeEventListener('input');
            message.editor.removeEventListener('DOMNodeRemoved');
            message.editor.removeEventListener('dragenter', onDragEnter);
            message.editor.removeEventListener('dragover', onDragOver);
            message.editor.removeEventListener('dragstart', onDragStart);
            message.editor.removeEventListener('dragend', onDragEnd);
        }

        delete message.editor;
        $scope.close(message, false, true);
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

            // Message closed and focussed?
            $scope.focusFirstComposer(message);

            $rootScope.$emit('composer.update', { type: 'close', data: {
                size: $scope.messages.length
            } });
        };

        if (discard === true) {
            const ids = [message.ID];

            $rootScope.$emit('messageActions', { action: 'delete', data: { ids } });
        }

        $rootScope.activeComposer = false;
        $rootScope.maximizedComposer = false;
        $timeout.cancel(message.defferredSaveLater);

        if (save === true) {
            recordMessage(message, false, true).then(process);
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
                    $scope.close(message, true, false);
                    notify({ message: gettextCatalog.getString('Message discarded', null), classes: 'notification-success' });
                    confirmModal.deactivate();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Transform the recipients list to a string
     * @param {Object} message
     * @return {String}
     */
    $scope.recipients = ({ ToList = [], CCList = [], BCCList = [] }) => {
        const formatAddresses = (key) => (contact, index) => {
            const name = $filter('contact')(contact, 'Name');

            return (index === 0) ? `${key}: ${name}` : name;
        };

        return []
            .concat(ToList.map(formatAddresses(gettextCatalog.getString('To', null, 'Title'))))
            .concat(CCList.map(formatAddresses(gettextCatalog.getString('CC', null, 'Title'))))
            .concat(BCCList.map(formatAddresses(gettextCatalog.getString('BCC', null, 'Title'))))
            .join(', ');
    };

    /**
     * Display fields (To, Cc, Bcc) and focus the input in the To field.
     * @param {Object} message
     */
    $scope.focusTo = (message) => {
        const input = document.querySelector(`#uid${message.uid} .toRow input`);

        $timeout(() => {
            message.autocompletesFocussed = true;
            input && input.focus();
        }, 250, true);
    };

    $scope.focusNextInput = (event) => {
        angular
            .element(event.target)
            .parent()
            .find('input')
            .eq(0)
            .focus();
    };

    /**
     * Give the focus inside the content editor
     * @param {Object} message
     * @param {Object} event
     */
    $scope.focusEditor = (message, event) => {
        event.preventDefault();
        message.editor.focus();
    };

    /**
     * Return if emails value has correct format
     * @param {Object} message
     * @return {Boolean}
     */
    $scope.emailsAreValid = (message) => {
        const emails = message.ToList.concat(message.CCList).concat(message.BCCList);
        return _.where(emails, { invalid: true }).length === 0;
    };
});
