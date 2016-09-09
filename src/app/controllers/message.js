angular.module("proton.controllers.Message", ["proton.constants"])

.controller("MessageController", function(
    $compile,
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $sce,
    $scope,
    $state,
    $stateParams,
    $templateCache,
    $timeout,
    $window,
    action,
    alertModal,
    attachments,
    authentication,
    cache,
    confirmModal,
    CONSTANTS,
    gettextCatalog,
    ical,
    Label,
    Message,
    messageBuilder,
    networkActivityTracker,
    notify,
    pmcw,
    prepareContent,
    tools
) {
    $scope.mailbox = tools.currentMailbox();
    $scope.isPlain = false;
    $scope.labels = authentication.user.Labels;
    $scope.elementPerPage = CONSTANTS.ELEMENTS_PER_PAGE;

    const unsubscribe = [];

    function loadMessage(action) {
        var msg = messageBuilder.create(action, $scope.message);
        $rootScope.$emit('loadMessage', msg);
    }

    unsubscribe.push($scope.$on('refreshMessage', function(event) {
        var message = cache.getMessageCached($scope.message.ID);

        if (angular.isDefined(message)) {
            angular.extend($scope.message, message);
        }
    }));

    unsubscribe.push($scope.$on('replyConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('reply');
        }
    }));

    unsubscribe.push($rootScope.$on('embedded.injected', (event) => {
        if ($rootScope.printMode === true) {
            $scope.$applyAsync(() => {
                $window.print();
            });
        }
    }));

    unsubscribe.push($scope.$on('replyAllConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('replyall');
        }
    }));

    unsubscribe.push($scope.$on('forwardConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('forward');
        }
    }));

    unsubscribe.push($scope.$on('move', function(event, name) {
        if ($scope.message === $scope.markedMessage) {
            $scope.move(name);
        }
    }));

    unsubscribe.push($scope.$on('read', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.read();
        }
    }));

    unsubscribe.push($scope.$on('unread', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.unread();
        }
    }));

    unsubscribe.push($scope.$on('openMarked', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.toggle();
            $scope.$apply();
        }
    }));

    unsubscribe.push($rootScope.$on('toggleMessage', function(event, messageID) {
        if ($scope.message.ID === messageID) {
            $scope.toggle();
        }
    }));

    // Listner when we destroy this message controller
    $scope.$on('$destroy', function(event) {
        $scope.message.expand = false;
        unsubscribe.forEach(cb => cb());
        unsubscribe.length = 0;
    });

    // Get all recipients
    $scope.recipients = function() {
        var recipients = [];

        if ($scope.message.ToList) {
            recipients = recipients.concat($scope.message.ToList);
        }

        if ($scope.message.CCList) {
            recipients = recipients.concat($scope.message.CCList);
        }

        if ($scope.message.BCCList) {
            recipients = recipients.concat($scope.message.BCCList);
        }

        return recipients;
    };

    /**
     * Toggle message in conversation view
     */
    $scope.toggle = function() {
        // If this message is a draft
        if ($scope.message.Type === 1) {
            // Open the message in composer if it's a draft
            $scope.openComposer($scope.message.ID, true); // MessageID, force saving to get attachment IDs
        } else {
            if (angular.isUndefined($scope.message.expand)) {
                networkActivityTracker.track($scope.initView());
            } else if ($scope.message.expand === false) {
                $scope.message.expand = true;
            } else {
                $scope.message.expand = false;
            }
        }
    };

    /**
     * Check if the current message is a sent
     * @return {Boolean}
     */
    $scope.sent = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.sent) !== -1;
    };

    /**
     * Check if the current message is a archive
     * @return {Boolean}
     */
    $scope.archive = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.archive) !== -1;
    };

    /**
     * Check if the current message is a draft
     * @return {Boolean}
     */
    $scope.draft = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
    };

    /**
     * Check if the current message is in trash
     * @return {Boolean}
     */
    $scope.trash = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.trash) !== -1;
    };

    /**
     * Check if the current message is in spam
     * @return {Boolean}
     */
    $scope.spam = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.spam) !== -1;
    };

    /**
     * Method called to display message content
     * @return {Promise}
     */
    $scope.initView = function() {
        var deferred = $q.defer();

        // If the message is a draft
        if ($scope.message.Type === 1) {
            if ($state.is('secured.drafts.view') === true) {
                // Open the message in composer if it's a draft
                $scope.openComposer($scope.message.ID, true);
            }

            deferred.resolve();
        } else {
            // Display content
            if (angular.isDefined($scope.message.Body)) {
                displayContent(true);
                deferred.resolve();
            } else {
                cache.getMessage($scope.message.ID).then(function(message) {
                    _.extend($scope.message, message);
                    displayContent();
                    deferred.resolve();
                });
            }
        }

        return deferred.promise;
    };

    /**
     * Open the message in the composer window
     * @param {String} id
     * @param {Boolean} save
     */
    $scope.openComposer = function(id, save) {
        cache.getMessage(id).then(function(message) {
            var copy = angular.copy(message);

            copy.decryptBody().then(function(content) {
                copy.setDecryptedBody(content);
                $rootScope.$broadcast('loadMessage', copy, save);
            }, function(error) {
                notify({message: gettextCatalog.getString('Error during the decryption of the message', null, 'Error'), classes: 'notification-danger'});
                $log.error(error); // TODO send to back-end
            });
        }, function(error) {
            notify({message: gettextCatalog.getString('Error during the getting message', null, 'Error'), classes: 'notification-danger'});
            $log.error(error); // TODO send to back-end
        });
    };

    /**
     * Method called at the initialization of this controller
     */
    function initialization() {
        if ($rootScope.printMode === true) {
            networkActivityTracker.track(cache.getMessage($stateParams.id).then(function(message) {
                $scope.message = message;
                $scope.initView();
            }));
        } else if ($rootScope.expandMessage.ID === $scope.message.ID) {
            $scope.initView();
        }
    }

    $scope.getMessage = function() {
        return [$scope.message];
    };


    /**
     * Order to the conversation controller to scroll to this message
     */
    $scope.scrollToMe = function() {
        if (angular.isFunction($scope.scrollToMessage)) {
            $scope.scrollToMessage($scope.message.ID);
        }
    };

    /**
     * Open modal to alert the user that he cannot download
     */
    $scope.openSafariWarning = function() {
        alertModal.activate({
            params: {
                title: gettextCatalog.getString('Download', null, 'Title'),
                alert: 'alert-warning',
                message: gettextCatalog.getString('Safari does not fully support downloading contacts.<br /><br />Please login with a different browser to download contacts.', null, 'Error'),
                ok: function() {
                    alertModal.deactivate();
                }
            }
        });
    };

    /**
     * Get the decrypted content and fix images inside
     */
    $scope.displayImages = function() {
        $scope.message.showImages = true;
        $scope.message.setDecryptedBody(prepareContent($scope.message.getDecryptedBody(), $scope.message, ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']));
    };

    /**
     * Load embedded content from attachments
     */
    $scope.displayEmbedded = function() {
        $scope.message.showEmbedded = true;
        $scope.message.setDecryptedBody(prepareContent($scope.message.getDecryptedBody(), $scope.message, ['transformLinks', 'transformRemote', 'transformWelcome', 'transformBlockquotes']));
    };

    /**
     * Decrypt the content of the current message and store it in 'message.decryptedBody'
     * @param {Boolean} force
     */
    function displayContent(force) {
        // Mark message as expanded
        $scope.message.expand = true;

        $scope.message.decrypting = false;

        // Mark message as read
        if ($scope.message.IsRead === 0) {
            $scope.read();
        }

        if (!$scope.message.getDecryptedBody() || force === true) {
            $scope.message.clearTextBody().then(function(result) {

                var showMessage = function(content) {

                    // var deferred = $q.defer();
                    // Clear content with DOMPurify before anything happen!
                    content = DOMPurify.sanitize(content, {
                        ADD_ATTR: ['target'],
                        FORBID_TAGS: ['style', 'input', 'form']
                    });

                    // Safari warning
                    if (!$rootScope.isFileSaverSupported) {
                        $scope.safariWarning = true;
                    }

                    // NOTE Plain text detection doesn't work. Check #1701
                    // var isHtml = tools.isHtml(content);

                    content = prepareContent(content, $scope.message);

                    // Detect type of content
                    // if (isHtml === true) {
                        $scope.isPlain = false;
                        $scope.message.viewMode = 'html';
                        $scope.message.setDecryptedBody(content);
                        // deferred.resolve();
                    // } else {
                    //     $scope.isPlain = true;
                    //     $scope.message.viewMode = 'plain';
                    // }

                    // Broken images
                    $(".email").find("img").error(function () {
                        $(this).unbind("error").addClass("pm_broken");
                    });

                    $scope.scrollToMe();

                    // return deferred.promise;
                };

                // PGP/MIME case
                if ($scope.message.IsEncrypted === 8) {
                    var mailparser = new MailParser({
                        defaultCharset: 'UTF-8'
                    });

                    mailparser.on('end', function(mail) {
                        var content;

                        if (mail.html) {
                            content = mail.html;
                        } else if (mail.text) {
                            content = mail.text;
                        } else {
                            content = "Empty Message";
                        }

                        if (mail.attachments) {
                            content = "<div class='alert alert-danger'><span class='pull-left fa fa-exclamation-triangle'></span><strong>PGP/MIME Attachments Not Supported</strong><br>This message contains attachments which currently are not supported by ProtonMail.</div><br>"+content;
                        }

                        $scope.$applyAsync(function() {
                            showMessage(content);
                        });
                    });

                    mailparser.write(result);
                    mailparser.end();

                } else {
                    $scope.$applyAsync(function() {
                        showMessage(result);
                    });
                }
            }, function(err) {
                $scope.togglePlainHtml();
                //TODO error reporter?
                $log.error(err);
            });
        } else {
            $scope.scrollToMe();
        }
    }

    /**
     * Mark current message as read
     */
    $scope.read = function() {
        var ids = [$scope.message.ID];

        $scope.message.expand = true;

        action.readMessage(ids);
    };

    /**
     * Mark current message as unread
     */
    $scope.unread = function() {
        var ids = [$scope.message.ID];

        $scope.message.expand = false;
        action.unreadMessage(ids);
        $scope.back();
    };

    $scope.decryptAttachment = function(event, att, message) {
        event.preventDefault();

        var link = event.currentTarget;
        var href = link.getAttribute('href');

        if (href && href.search(/^data.*/)!==-1) {
            alert('Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.');
            return false;
        }

        // get enc attachment
        const attachmentPromise = attachments.get(att.ID, att.Name);

        att.decrypting = true;

        // decode key packets
        const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(att.KeyPackets));
        // get user's pk
        const pk = authentication.getPrivateKeys(message.AddressID);
        const key = pmcw.decryptSessionKey(keyPackets, pk);

        // when we have the session key and attachment:
        $q.all({ attObject: attachmentPromise, key })
            .then(({ key, attObject }) => {

                const { attachment, isCache } = attObject;

                // It's coming from the cache ? So we can download it
                if (isCache) {
                    att.decrypting = false;
                    return $scope.downloadAttachment({
                        data: attachment.data,
                        Name: attachment.name,
                        MIMEType: attachment.MIMEType,
                        el: link
                    });
                }

                // create new Uint8Array to store decryted attachment
                let at = new Uint8Array(attObject.attachment);

                // decrypt the att
                pmcw
                    .decryptMessage(at, key.key, true, key.algo)
                    .then(({ data, filename } = {}) => {
                        // Store attachment decrypted
                        attachments.push({
                            ID: att.ID,
                            data,
                            name: filename
                        });
                        // Call download function
                        $scope.downloadAttachment({
                            data,
                            Name: filename,
                            MIMEType: att.MIMEType,
                            el: link
                        });
                        att.decrypting = false;
                        att.decrypted = true;
                        if(!$rootScope.isFileSaverSupported) {
                            // display a download icon
                            att.decrypted = true;
                        }
                        $scope.$apply();
                        at = null;
                    })
                    .catch($log.error);
            })
            .catch((error) => {
                att.decrypting = false;
                confirmModal
                    .activate({
                        params: {
                            title: 'Unable to decrypt attachment.',
                            message: '<p>We were not able to decrypt this attachment. The technical error code is:</p><p> <pre>'+error+'</pre></p><p>Email us and we can try to help you with this. <kbd>support@protonmail.com</kbd></p>',
                            confirm() {
                                confirmModal.deactivate();
                            },
                            cancel() {
                                confirmModal.deactivate();
                            }
                        }
                    });
            });
    };

    /**
     * @param {Object} attachment
     */
    $scope.downloadAttachment = function(attachment) {
        try {
            var blob = new Blob([attachment.data], {type: attachment.MIMEType});
            var link = $(attachment.el);

            if ($rootScope.isFileSaverSupported) {
                saveAs(blob, attachment.Name);
            } else {
                // Bad blob support, make a data URI, don't click it
                var reader = new FileReader();

                reader.onloadend = function () {
                    link.attr('href', reader.result);
                };

                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Return label
     * @param {String} labelID
     */
    $scope.getLabel = function(labelID) {
        return _.findWhere(authentication.user.Labels, {ID: labelID});
    };

    /**
     * Return style for label
     * @param {String} labelID
     */
    $scope.getColorLabel = function(labelID) {
        var label = _.findWhere(authentication.user.Labels, {ID: labelID});

        return {
            borderColor: label.Color,
            color: label.Color
        };
    };

    /**
     * Go to label folder + reset parameters
     * @param {String} labelID
     */
    $scope.goToLabel = function(labelID) {
        var params = {page: undefined, filter: undefined, sort: undefined, label: labelID};

        $state.go('secured.label', params);
    };

    /**
     * Method call when the user submit some labels to apply to this message
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var messages = [$scope.message];

        action.labelMessage(messages, labels, alsoArchive);
    };

    /**
     * Detach label to the current message
     * @param {Object} label
     */
    $scope.detachLabel = function(labelID) {
        var events = [];
        var copy = angular.copy($scope.message);
        var labelIDs = [];
        var REMOVE = 0;
        var messages = cache.queryMessagesCached(copy.ConversationID);

        // Generate event for the message
        events.push({Action: 3, ID: copy.ID, Message: {ID: copy.ID, LabelIDsRemoved: [labelID]}});

        // Generate event for the conversation
        _.each(messages, function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        labelIDs.splice(labelIDs.indexOf(labelID), 1); // Remove one labelID

        events.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDs: _.uniq(labelIDs)}});

        // Send to cache manager
        cache.events(events);

        // Send request to detach the label
        copy.updateLabels(labelID, REMOVE, [copy.ID]);
    };

    $scope.sendMessageTo = function(email) {
        var message = new Message();

        _.defaults(message, {
            ToList: [email], // contains { Address, Name }
            CCList: [],
            BCCList: [],
            Attachments: [],
            Subject: '',
            PasswordHint: ''
        });

        $rootScope.$broadcast('loadMessage', message);
    };

    /**
     * Check if the sender is the current user
     * @param {Object} message
     * @return {Boolean} result
     */
    $scope.senderIsMe = function(message) {
        var result = false;

        _.each(authentication.user.Addresses, function(address) {
            if(address.Email === message.Sender.Address) {
                result = true;
            }
        });

        return result;
    };

    /**
     * Move current message
     * @param {String} mailbox
     */
    $scope.move = function(mailbox) {
        var ids = [$scope.message.ID];

        action.moveMessage(ids, mailbox);
    };

    /**
     * Delete current message
     */
    $scope.delete = function() {
        var ids = [$scope.message.ID];

        action.deleteMessage(ids);
    };

    /**
     * Back to element list
     */
    $scope.back = function() {
        $state.go("secured." + $scope.mailbox, {
            id: null // remove ID
        });
    };

    /**
     * Print current message
     * @param {Integer} index
     */
    $scope.print = function(index) {
        // NOTE postMessage still broken on IE11
        const postMessageSupport = $.browser.msie !== true || $.browser.edge === true;

        if (postMessageSupport) {
            const tab = $state.href('printer', {messageID: $scope.message.ID}, {absolute: true});
            const url = window.location.href;
            const arr = url.split('/');
            const targetOrigin = arr[0] + '//' + arr[2];
            const sendMessage = (event) => {
                if (event.data === $scope.message.ID) {
                    const message = $scope.message;
                    const element = document.getElementById('message' + index);

                    if (element) {
                        const bodyDecrypted = element.querySelector('.bodyDecrypted');

                        message.content = bodyDecrypted.innerHTML;
                        event.source.postMessage(JSON.stringify($scope.message), targetOrigin);
                        window.removeEventListener('message', sendMessage, false);
                    }
                }
            };

            window.addEventListener('message', sendMessage, false);
            window.open(tab, '_blank');
        } else {
            window.print();
        }
    };

    /**
     * Display PGP
     */
    $scope.viewPgp = function() {
        var content = $scope.message.Header + '\n\r' + $scope.message.Body;
        var filename = 'pgp.txt';

        if(navigator.msSaveBlob) { // IE 10+
            content = content.replace(/\n/g, "\r\n");
            var blob = new Blob([content], { type: 'data:text/plain;base64;' });
            navigator.msSaveBlob(blob, filename);
        } else {
            window.open('data:text/plain;base64,' + btoa(content), '_blank');
        }
    };

    $scope.togglePlainHtml = function() {
        if ($scope.message.viewMode === 'plain') {
            $scope.message.viewMode = 'html';
        } else {
            $scope.message.viewMode = 'plain';
        }
    };

    initialization();
});
