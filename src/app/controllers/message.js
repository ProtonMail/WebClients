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
    embedded,
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
    $scope.attachmentsStorage = [];
    $scope.elementPerPage = CONSTANTS.ELEMENTS_PER_PAGE;

    function loadMessage(action) {
        var msg = messageBuilder.create(action, $scope.message);
        $rootScope.$emit('loadMessage', msg);
    }

    $scope.$on('refreshMessage', function(event) {
        var message = cache.getMessageCached($scope.message.ID);

        if (angular.isDefined(message)) {
            angular.extend($scope.message, message);
        }
    });

    $scope.$on('replyConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('reply');
        }
    });

    $scope.$on('replyAllConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('replyall');
        }
    });

    $scope.$on('forwardConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            loadMessage('forward');
        }
    });

    $scope.$on('initMessage', function(event, ID, scroll) {
        if ($scope.message.ID === ID) {
            $scope.initialization(scroll);
        }
    });

    $scope.$on('move', function(event, name) {
        if ($scope.message === $scope.markedMessage) {
            $scope.move(name);
        }
    });

    $scope.$on('read', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.read();
        }
    });

    $scope.$on('unread', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.unread();
        }
    });

    $scope.$on('openMarked', function(event) {
        if ($scope.message === $scope.markedMessage) {
            $scope.toggle();
            $scope.$apply();
        }
    });

    // Listner when we destroy this message controller
    $scope.$on('$destroy', function(event) {
        $scope.message.expand = false;
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
        if($scope.message.Type === 1) {
            // Open the message in composer if it's a draft
            $scope.openComposer($scope.message.ID);
        } else {
            if(angular.isUndefined($scope.message.expand) || $scope.message.expand === false) {
                networkActivityTracker.track($scope.initView(true));
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
        var process = function() {
            // Display content
            $scope.displayContent();

        };

        // If the message is a draft
        if ($scope.message.Type === 1) {
            if ($state.is('secured.drafts.view') === true) {
                // Open the message in composer if it's a draft
                $scope.openComposer($scope.message.ID);
            }

            deferred.resolve();
        } else {
            // Display content
            if(angular.isDefined($scope.message.Body)) {
                process();
                deferred.resolve();
            } else {
                cache.getMessage($scope.message.ID).then(function(message) {
                    _.extend($scope.message, message);
                    process();
                    deferred.resolve();
                });
            }
        }

        return deferred.promise;
    };

    /**
     * Open the message in the composer window
     * @param {String} id
     */
    $scope.openComposer = function(id) {
        cache.getMessage(id).then(function(message) {
            var copy = angular.copy(message);

            copy.decryptBody().then(function(content) {
                copy.Body = content;
                $rootScope.$broadcast('loadMessage', copy);
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
        $scope.scrollToMessage($scope.message.ID);
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
        $scope.message.toggleImages();
        $scope.showingMessages = true;
        $scope.displayContent(true);
    };

    /**
     * Decrypt the content of the current message and store it in 'message.decryptedBody'
     * @param {Boolean} force
     */
    $scope.displayContent = function(force) {
        var whitelist = ['notify@protonmail.com'];

        if (whitelist.indexOf($scope.message.Sender.Address) !== -1 && $scope.message.IsEncrypted === 0) {
            $scope.message.imagesHidden = false;
        } else if(authentication.user.ShowImages === 1) {
            $scope.message.imagesHidden = false;
        }

        // Mark message as expanded
        $scope.message.expand = true;

        // Mark message as read
        if ($scope.message.IsRead === 0) {
            $scope.read();
        }

        if (angular.isUndefined($scope.message.decryptedBody) || force === true) {
            $scope.message.clearTextBody().then(function(result) {

                // return a promise for embedded images

                var showMessage = function(content) {

                    var deferred = $q.defer();

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
                    var isHtml = tools.isHtml(content);

                    if ($rootScope.printMode !== true) {
                        content = $scope.message.clearImageBody(content);
                    }

                    content = prepareContent(content, $scope.message);

                    // Detect type of content
                    if (isHtml === true) {
                        $scope.isPlain = false;
                        $scope.message.viewMode = 'html';
                        // Assign decrypted content
                        $scope.message.decryptedBody = $sce.trustAsHtml(content);
                        deferred.resolve();
                    } else {
                        $scope.isPlain = true;
                        $scope.message.viewMode = 'plain';
                    }

                    // Broken images
                    $(".email img").error(function () {
                        $(this).unbind("error").addClass("pm_broken");
                    });

                    if ($rootScope.printMode === true) {
                        $timeout(function() {
                            $window.print();
                        }, 1000);
                    } else {
                        $scope.scrollToMe();
                    }


                    return deferred.promise;
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

                        $scope.$evalAsync(function() {
                            showMessage(content);
                        });
                    });

                    mailparser.write(result);
                    mailparser.end();

                } else {
                    $scope.$evalAsync(function() {
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
    };


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

    $scope.decryptAttachment = function(attachment, $event, message) {
        $event.preventDefault();

        var link = angular.element($event.currentTarget);
        var href = link.attr('href');

        if(angular.isDefined(href) && href.search(/^data.*/)!==-1) {
            alert("Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.");
            return false;
        }

        // get enc attachment
        var att = attachments.get(attachment.ID, attachment.Name);

        attachment.decrypting = true;

        if (attachment.KeyPackets === undefined) {
            return att.then( function(result) {

                $timeout(function(){
                    $scope.downloadAttachment({
                        data: result.data,
                        Name: attachment.Name,
                        MIMEType: attachment.MIMEType,
                        el: link,
                    });
                    attachment.decrypting = false;
                    attachment.decrypted = true;
                });

            });
        } else {
            var attachmentStored = _.findWhere($scope.attachmentsStorage, {ID: attachment.ID});

            if(angular.isDefined(attachmentStored)) {
                $scope.downloadAttachment({
                    data: attachmentStored.data,
                    Name: attachmentStored.name,
                    MIMEType: attachment.MIMEType,
                    el: link,
                });
                attachment.decrypting = false;
            } else {
                // decode key packets
                var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
                // get user's pk
                var pk = authentication.getPrivateKeys(message.AddressID);
                var key = pmcw.decryptSessionKey(keyPackets, pk);

                // when we have the session key and attachment:
                $q.all({
                    "attObject": att,
                    "key": key
                 }).then(
                    function(obj) {

                        // create new Uint8Array to store decryted attachment
                        var at = new Uint8Array(obj.attObject.data);

                        // grab the key
                        var key = obj.key.key;

                        // grab the algo
                        var algo = obj.key.algo;

                        // decrypt the att
                        pmcw.decryptMessage(at, key, true, algo)
                        .then(
                            function(decryptedAtt) {
                                // Store attachment decrypted
                                $scope.attachmentsStorage.push({
                                    ID: attachment.ID,
                                    data: decryptedAtt.data,
                                    name: decryptedAtt.filename
                                });
                                // Call download function
                                $scope.downloadAttachment({
                                    data: decryptedAtt.data,
                                    Name: decryptedAtt.filename,
                                    MIMEType: attachment.MIMEType,
                                    el: link,
                                });
                                attachment.decrypting = false;
                                attachment.decrypted = true;
                                if(!$rootScope.isFileSaverSupported) {
                                    // display a download icon
                                    attachment.decrypted = true;
                                }
                                $scope.$apply();
                            },
                            function(err) {
                                $log.error(err);
                            }
                        );
                    },
                    function(err) {
                        attachment.decrypting = false;
                        confirmModal.activate({
                            params: {
                                title: 'Unable to decrypt attachment.',
                                message: '<p>We were not able to decrypt this attachment. The technical error code is:</p><p> <pre>'+err+'</pre></p><p>Email us and we can try to help you with this. <kbd>support@protonmail.com</kbd></p>',
                                confirm: function() {
                                    confirmModal.deactivate();
                                },
                                cancel: function() {
                                    confirmModal.deactivate();
                                }
                            }
                        });
                    }
                );
            }
        }
    };

    $scope.downloadAttachment = function(attachment) {

        // if (attachment.MIMEType.indexOf('calendar')) {
        //     console.log(attachment);
        //     var iCalendarData = attachment.data; // attachment.data is not ready. need to convert first.. HELP BART!
        //     var jcalData = ICAL.parse(iCalendarData);
        //     console.log(jcalData);
        // }
        // else {

            try {
                var blob = new Blob([attachment.data], {type: attachment.MIMEType});
                var link = $(attachment.el);

                if($rootScope.isFileSaverSupported) {
                    saveAs(blob, attachment.Name);
                } else {
                    // Bad blob support, make a data URI, don't click it
                    var reader = new FileReader();

                    reader.onloadend = function () {
                        link.parent('a').attr('href',reader.result);
                    };

                    reader.readAsDataURL(blob);
                }
            } catch (error) {
                console.log(error);
            }

        // }
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
     */
    $scope.print = function() {
        var url = $state.href('secured.print', { id: $scope.message.ID });

        window.open(url, '_blank');
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
