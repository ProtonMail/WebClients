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
    $translate,
    alertModal,
    attachments,
    authentication,
    cache,
    confirmModal,
    CONSTANTS,
    Label,
    Message,
    networkActivityTracker,
    notify,
    pmcw,
    tools
) {
    $scope.mailbox = tools.currentMailbox();
    $scope.tools = tools;
    $scope.isPlain = false;
    $scope.labels = authentication.user.Labels;
    $scope.CONSTANTS = CONSTANTS;
    $scope.attachmentsStorage = [];

    $scope.$on('updateReplied', function(e, m) {
        _.extend($scope.message, m);
    });

    $scope.$on('refreshMessage', function() {
        cache.getMessage($scope.message.ID).then(function(message) {
            _.extend($scope.message, message);
        });
    });

    $scope.$on('$destroy', function() {
        // cancel timer ago
        $interval.cancel($scope.agoTimer);
    });

    /**
     * Toggle message in conversation view
     */
    $scope.toggle = function() {
        if(angular.isUndefined($scope.message.expand)) {
            networkActivityTracker.track($scope.initView());
        } else if($scope.message.expand === true) {
            $scope.message.expand = false;
        } else if($scope.message.expand === false) {
            $scope.message.expand = true;
        }
    };

    /**
     * Check if the current message is a draft
     * @return {Boolean}
     */
    $scope.draft = function() {
        return $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
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

            // Start timer ago
            $scope.agoTimer = $interval(function() {
                var time = $filter('longReadableTime')($scope.message.Time);

                $scope.ago = time;
            }, 1000);

            // Mark message as expanded
            $scope.message.expand = true;
        };

        // If the message is a draft
        if($scope.draft() === true) {
            // Open the message in composer if it's a draft
            $scope.openComposer($scope.message.ID);
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
                notify({message: 'Error during the decryption of the message', classes: 'notification-danger'});
                $log.error(error); // TODO send to back-end
            });
        }, function(error) {
            notify({message: 'Error during the getting message', classes: 'notification-danger'});
            $log.error(error); // TODO send to back-end
        });
    };

    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        var promise;

        if($rootScope.printMode === true) {
            promise = cache.getMessage($stateParams.id);

            promise.then(function(message) {
                $scope.message = message;
                $scope.initView();
            });

            // Track promise for the print case
            networkActivityTracker.track(promise);
        } else {
            var index = $rootScope.openMessage.indexOf($scope.message.ID);

            promise = cache.getMessage($scope.message.ID);

            promise.then(function(message) {
                _.extend($scope.message, message);

                if(index !== -1) {
                    $scope.initView();
                    $rootScope.openMessage.splice(index, 1);
                }
            });
        }
    };

    $scope.getMessage = function() {
        return [$scope.message];
    };

    /**
     * Return star status of current message
     * @return {Boolean}
     */
    $scope.starred = function() {
        return angular.isDefined($scope.message.LabelIDs) && $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
    };

    /**
     * Toggle star status of the current message
     */
    $scope.toggleStar = function() {
        if($scope.starred() === true) {
            $scope.unstar();
        } else {
            $scope.star();
        }
    };

    /**
     * Star the current message
     */
    $scope.star = function() {
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var conversationEvent = [];
        var messageEvent = [];
        var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];

        // Messages
        copy.LabelIDsAdded = labelIDsAdded;
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        // Conversation
        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDsAdded: labelIDsAdded}});
        cache.events(conversationEvent, 'conversation');

        // Request
        Message.star({IDs: ids});
    };

    /**
     * Unstar the current message
     */
    $scope.unstar = function() {
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var conversationEvent = [];
        var messageEvent = [];
        var labelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        var stars = _.filter($scope.messages, function(message) {
            return message.LabelIDs && message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
        });

        // Messages
        copy.LabelIDsRemoved = labelIDsRemoved;
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        // Conversation
        if(stars.length === 1) {
            conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDsRemoved: labelIDsRemoved}});
            cache.events(conversationEvent, 'conversation');
        }

        // Request
        Message.unstar({IDs: ids});
    };

    /**
     * Open modal to alert the user that he cannot download
     */
    $scope.openSafariWarning = function() {
        alertModal.activate({
            params: {
                title: $translate.instant('DOWNLOAD_CONTACTS'),
                alert: 'alert-warning',
                message: 'Safari does not fully support downloading contacts.<br /><br />Please login with a different browser to download contacts.', // TODO translate
                ok: function() {
                    alertModal.deactivate();
                }
            }
        });
    };

    /**
     * Decrypt the content of the current message and store it in 'message.DecryptedBody'
     * @param {Boolean} print
     */
    $scope.displayContent = function() {
        var whitelist = ['notify@protonmail.com'];

        if (whitelist.indexOf($scope.message.Sender.Address) !== -1 && $scope.message.IsEncrypted === 0) {
            $scope.message.imagesHidden = false;
        } else if(authentication.user.ShowImages === 1) {
            $scope.message.imagesHidden = false;
        }

        if(angular.isUndefined($scope.message.DecryptedBody)) {
            $scope.message.clearTextBody().then(function(result) {
                var showMessage = function(content) {
                    if($rootScope.printMode !== true) {
                        content = $scope.message.clearImageBody(content);
                    }

                    // Safari warning
                    if(!$rootScope.isFileSaverSupported) {
                        $scope.safariWarning = true;
                    }

                    // Clear content with DOMPurify
                    content = DOMPurify.sanitize(content, {
                        ADD_ATTR: ['target'],
                        FORBID_TAGS: ['style', 'input', 'form']
                    });

                    // For the welcome email, we need to change the path to the welcome image lock
                    content = content.replace("/img/app/welcome_lock.gif", "/assets/img/emails/welcome_lock.gif");

                    // Detect type of content
                    if (tools.isHtml(content)) {
                        $scope.isPlain = false;
                    } else {
                        $scope.isPlain = true;
                    }

                    $scope.message.DecryptedBody = $sce.trustAsHtml(content);

                    // Broken images
                    $(".email img").error(function () {
                        $(this).unbind("error").addClass("pm_broken");
                    });

                    // Read message open
                    if($scope.message.IsRead === 0) {
                        var events = [];

                        events.push({Action: 3, ID: $scope.message.ID, Message: {ID: $scope.message.ID, IsRead: 1}});
                        cache.events(events, 'message');
                        Message.read({IDs: [$scope.message.ID]});
                    }

                    if($rootScope.printMode) {
                        setTimeout(function() {
                            window.print();
                        }, 1000);
                    }
                };

                // PGP/MIME
                if ( $scope.message.IsEncrypted === 8 ) {
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

                        $scope.$evalAsync(function() { showMessage(content); });
                    });

                    mailparser.write(result);
                    mailparser.end();
                } else {
                    $scope.$evalAsync(function() { showMessage(result); });
                }
            }, function(err) {
                $scope.togglePlainHtml();
                //TODO error reporter?
                $log.error(err);
            });
        }
    };

    $scope.read = function() {
        var  copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var conversationEvent = [];
        var messageEvent = [];

        // Message
        copy.IsRead = 1;
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        // Conversation
        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, NumUnread: 0}});
        cache.events(conversationEvent, 'conversation');

        // Request
        Message.read({IDs: ids});

        // Back to elements list
        $scope.back();
    };

    $scope.unread = function() {
        var  copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var conversationEvent = [];
        var messageEvent = [];
        var unreads = _.where($scope.messages, {IsRead: 0});

        // Message
        copy.IsRead = 0;
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        // Conversation
        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, NumUnread: unreads.length + 1}});
        cache.events(conversationEvent, 'conversation');

        // Request
        Message.unread({IDs: ids});

        // Back to elements list
        $scope.back();
    };

    $scope.toggleImages = function() {
        $scope.message.toggleImages();
        $scope.displayContent();
    };

    $scope.decryptAttachment = function(attachment, $event) {
        $event.preventDefault();

        var link = angular.element($event.target);
        var href = link.attr('href');

        if(href !== undefined && href.search(/^data.*/)!==-1) {
            alert("Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.");
            return false;
        }

        // get enc attachment
        var att = attachments.get(attachment.ID, attachment.Name);

        attachment.decrypting = true;

        if (attachment.KeyPackets === undefined) {
            return att.then( function(result) {
                $scope.downloadAttachment(attachment);
                attachment.decrypting = false;
                attachment.decrypted = true;
                $scope.$apply();
            });
        } else {
            var attachmentStored = _.findWhere($scope.attachmentsStorage, {ID: attachment.ID});

            if(angular.isDefined(attachmentStored)) {
                $scope.downloadAttachment({
                    data: attachmentStored.data,
                    Name: attachmentStored.name,
                    MIMEType: attachment.MIMEType,
                    el: $event.target,
                });
                attachment.decrypting = false;
                $scope.$apply();
            } else {
                // decode key packets
                var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
                // get user's pk
                var key = authentication.getPrivateKey().then(
                    function(pk) {
                        // decrypt session key from keypackets
                        return pmcw.decryptSessionKey(keyPackets, pk);
                    }
                );

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
                                    el: $event.target,
                                });
                                attachment.decrypting = false;
                                attachment.decrypted = true;
                                if(!$rootScope.isFileSaverSupported) {
                                    $($event.currentTarget)
                                    .prepend('<span class="fa fa-download"></span>');
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
        try {
            var blob = new Blob([attachment.data], {type: attachment.MIMEType});
            var link = $(attachment.el);

            if($rootScope.isFileSaverSupported) {
                saveAs(blob, attachment.Name);
            } else {
                // Bad blob support, make a data URI, don't click it
                var reader = new FileReader();

                reader.onloadend = function () {
                    link.attr('href',reader.result);
                };

                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.log(error);
        }
    };

    /**
     * Return label
     * @param {String} id
     */
    $scope.getLabel = function(id) {
        return _.findWhere($scope.labels, {ID: id});
    };

    /**
     * Return style for label
     * @param {Object} label
     */
    $scope.getColorLabel = function(label) {
        return {
            borderColor: label.Color,
            color: label.Color
        };
    };

    /**
     * Go to label folder + reset parameters
     * @param {Object} label
     */
    $scope.goToLabel = function(label) {
        var params = {page: undefined, filter: undefined, sort: undefined, label: label.ID};

        $state.go('secured.label.list', params);
    };

    /**
     * Method call when the user submit some labels to apply to this message
     * @param {Array} labels
     * @param {Boolean} alsoArchive
     */
    $scope.saveLabels = function(labels, alsoArchive) {
        var deferred = $q.defer();
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];
        var messageEvent = [];
        var conversationEvent = [];
        var currents = [];
        var labelIDs = [];

        // Requests
        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: ids}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: ids}).$promise);
        });

        // Find current location
        _.each(copy.LabelIDs, function(labelID) {
            if(['0', '1', '2', '3', '4', '6'].indexOf(labelID) !== -1) {
                currents.push(labelID.toString());
            }
        });

        if(alsoArchive === true) {
            toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive); // Add in archive
            toRemove = toRemove.concat(currents); // Remove current location
        }

        copy.LabelIDsAdded = toApply;
        copy.LabelIDsRemoved = toRemove;
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        _.each(cache.queryMessagesCached(copy.ConversationID), function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDs: labelIDs}});
        cache.events(conversationEvent, 'conversation');

        $q.all(promises).then(function() {
            if(alsoArchive === true) {
                deferred.resolve(Message.archive({IDs: ids}));
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    /**
     * Detach label to the current message
     * @param {Object} label
     */
    $scope.detachLabel = function(label) {
        var messageEvent = [];
        var conversationEvent = [];
        var copy = angular.copy($scope.message);
        var labelIDs = [];

        copy.LabelIDsRemoved = [label.ID];
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        _.each(cache.queryMessagesCached(copy.ConversationID), function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDs: labelIDs}});
        cache.events(conversationEvent, 'conversation');
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

    // Return Message object to build response or forward
    var buildMessage = function(action) {
        var base = new Message();
        var br = '<br />';
        var contentSignature = DOMPurify.sanitize('<div>' + tools.replaceLineBreaks($scope.user.Signature) + '</div>');
        var signature = ($(contentSignature).text().length === 0)? '<br /><br />' : '<br /><br />' + contentSignature + '<br /><br />';
        var blockquoteStart = '<blockquote class="protonmail_quote">';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + $scope.message.Subject + '<br />';
        var time = 'Local Time: ' + $filter('localReadableTime')($scope.message.Time) + '<br />UTC Time: ' + $filter('utcReadableTime')($scope.message.Time) + '<br />';
        var from = 'From: ' + $scope.message.Sender.Address + '<br />';
        var to = 'To: ' + tools.contactsToString($scope.message.ToList) + '<br />';
        var cc = ($scope.message.CCList.length > 0)?('CC: ' + tools.contactsToString($scope.message.CCList) + '<br />'):('');
        var blockquoteEnd = '</blockquote>';
        var re_prefix = $translate.instant('RE:');
        var fw_prefix = $translate.instant('FW:');
        var re_length = re_prefix.length;
        var fw_length = fw_prefix.length;

        base.ParentID = $scope.message.ID;
        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + cc + br + $scope.message.DecryptedBody + blockquoteEnd;

        if(angular.isDefined($scope.message.AddressID)) {
            base.From = _.findWhere(authentication.user.Addresses, {ID: $scope.message.AddressID});
        }

        if (action === 'reply') {
            base.Action = 0;
            base.Subject = ($scope.message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? $scope.message.Subject : re_prefix + ' ' + $scope.message.Subject;

            if($state.is('secured.sent.message')) {
                base.ToList = $scope.message.ToList;
            } else {
                base.ToList = [$scope.message.ReplyTo];
            }
        } else if (action === 'replyall') {
            base.Action = 1;
            base.Subject = ($scope.message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? $scope.message.Subject : re_prefix + ' ' + $scope.message.Subject;

            if(_.where(authentication.user.Addresses, {Email: $scope.message.Sender.Address}).length > 0) {
                base.ToList = $scope.message.ToList;
                base.CCList = $scope.message.CCList;
                base.BCCList = $scope.message.BCCList;
            } else {
                base.ToList = [$scope.message.ReplyTo];
                base.CCList = _.union($scope.message.ToList, $scope.message.CCList);
                // Remove user address in CCList and ToList
                _.each(authentication.user.Addresses, function(address) {
                    base.ToList = _.filter(base.ToList, function(contact) { return contact.Address !== address.Email; });
                    base.CCList = _.filter(base.CCList, function(contact) { return contact.Address !== address.Email; });
                });
            }
        } else if (action === 'forward') {
            base.Action = 2;
            base.ToList = [];
            base.Subject = ($scope.message.Subject.toLowerCase().substring(0, fw_length) === fw_prefix.toLowerCase()) ? $scope.message.Subject : fw_prefix + ' ' + $scope.message.Subject;
        }

        return base;
    };

    /**
     * Compose a reply to a specific message in the thread
     */
    $scope.reply = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('reply'));
    };

    /**
     * Compose reply all
     */
    $scope.replyAll = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('replyall'));
    };

    /**
     * Compose forward
     */
    $scope.forward = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('forward'), true);
    };

    /**
     * Move current message
     * @param {String} mailbox
     */
    $scope.move = function(mailbox) {
        var messageEvent = [];
        var conversationEvent = [];
        var copy = angular.copy($scope.message);
        var current;
        var labelIDs = [];

        _.each(copy.LabelIDs, function(labelID) {
            if(['0', '1', '2', '3', '4', '6'].indexOf(labelID)) {
                current = labelID;
            }
        });

        copy.Selected = false;
        copy.LabelIDsRemoved = [current]; // Remove previous location
        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]]; // Add new location
        messageEvent.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(messageEvent, 'message');

        _.each(cache.queryMessagesCached(copy.ConversationID), function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });
        conversationEvent.push({Action: 3, ID: copy.ConversationID, Conversation: {
            ID: copy.ConversationID,
            LabelIDs: labelIDs
        }});
        cache.events(conversationEvent, 'conversation');

        Message[mailbox]({IDs: [copy.ID]});

        $scope.back();
    };

    /**
     * Delete current message
     */
    $scope.delete = function() {
        var messageEvent = [];
        var copy = angular.copy($scope.message);

        messageEvent.push({Action: 0, ID: copy.ID, Message: copy});
        cache.events(messageEvent);

        Message.delete({IDs: [copy.ID]});

        $scope.back();
    };

    /**
     * Back to element list
     */
    $scope.back = function() {
        $state.go("secured." + $scope.mailbox + '.list', {
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

    $scope.initialization();
});
