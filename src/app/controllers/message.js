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
    tools,
    ical
) {
    $scope.mailbox = tools.currentMailbox();
    $scope.tools = tools;
    $scope.isPlain = false;
    $scope.labels = authentication.user.Labels;
    $scope.CONSTANTS = CONSTANTS;
    $scope.attachmentsStorage = [];

    $scope.$on('refreshMessage', function() {

        if (angular.isDefined($rootScope.openMessage)) {
            
            var index = $rootScope.openMessage.indexOf($scope.message.ID);

            cache.getMessage($scope.message.ID).then(function(message) {
                _.extend($scope.message, message);

                if(index !== -1) {
                    $scope.initView();
                    $rootScope.openMessage.splice(index, 1);
                }
            });

        }

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

            // Start timer ago
            $scope.agoTimer = $interval(function() {
                var time = $filter('longReadableTime')($scope.message.Time);

                $scope.ago = time;
            }, 60 * 1000);

            // Mark message as expanded
            $scope.message.expand = true;

            if($scope.message.IsRead === 0) {
                $scope.read();
            }
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
     * Scroll to the message
     */
    $scope.scrollToMe = function() {
        var index = _.findIndex($scope.messages, {ID: $scope.message.ID});
        var id = '#message' + index;
        var element = angular.element(id);

        if(angular.isDefined(element)) {
            var value = element.offset().top - element.outerHeight();

            $('#pm_thread').animate({
                scrollTop: value
            }, 'slow');
        }
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
        if($rootScope.printMode === true) {
            networkActivityTracker.track(cache.getMessage($stateParams.id).then(function(message) {
                $scope.message = message;
                $scope.initView();
            }));
        } else {
            var index = $rootScope.openMessage.indexOf($scope.message.ID);

            if(index !== -1) {
                cache.getMessage($scope.message.ID).then(function(message) {
                    _.extend($scope.message, message);
                    $scope.initView();
                    $rootScope.openMessage.splice(index, 1);
                });
            }
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
        var events = [];
        var labelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];

        // Messages
        copy.LabelIDsAdded = labelIDsAdded;
        events.push({Action: 3, ID: copy.ID, Message: copy});

        // Conversation
        events.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDsAdded: labelIDsAdded}});

        // Send to cache manager
        cache.events(events);

        // Request
        Message.star({IDs: ids});
    };

    /**
     * Unstar the current message
     */
    $scope.unstar = function() {
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var events = [];
        var labelIDsRemoved = [CONSTANTS.MAILBOX_IDENTIFIERS.starred];
        var stars = _.filter($scope.messages, function(message) {
            return message.LabelIDs && message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred) !== -1;
        });

        // Messages
        copy.LabelIDsRemoved = labelIDsRemoved;
        events.push({Action: 3, ID: copy.ID, Message: copy});

        // Conversation
        if(stars.length === 1) {
            events.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDsRemoved: labelIDsRemoved}});
        }

        // Send to cache manager
        cache.events(events);

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
     * Get the decrypted content and fix images inside
     */
    $scope.displayImages = function() {
        $scope.message.toggleImages();
        $scope.message.DecryptedBody = undefined; // Reset decrypted body
        $scope.displayContent();
    };

    /**
     * Decrypt the content of the current message and store it in 'message.DecryptedBody'
     * @param {Boolean} print
     */
    $scope.displayContent = function() {
        var whitelist = ['notify@protonmail.com'];

        $scope.message.viewMode = 'html';

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

                    // Scroll to first message open
                    if($rootScope.scrollToFirst === $scope.message.ID) {
                        $scope.scrollToMe();
                    }

                    // Broken images
                    $(".email img").error(function () {
                        $(this).unbind("error").addClass("pm_broken");
                    });

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

    /**
     * Mark current message as read
     */
    $scope.read = function(back) {
        var  copy = angular.copy($scope.message);
        var conversation = cache.getConversationCached(copy.ConversationID);
        var ids = [copy.ID];
        var events = [];

        // Generate message event
        copy.IsRead = 1;
        events.push({Action: 3, ID: copy.ID, Message: copy});

        // Generate conversation event
        if(angular.isDefined(conversation)) {
            conversation.NumUnread = 0;
            events.push({Action: 3, ID: copy.ConversationID, Conversation: conversation});
        }

        // Send to cache manager
        cache.events(events);

        // Request
        Message.read({IDs: ids});
    };

    /**
     * Mark current message as unread
     */
    $scope.unread = function() {
        var  copy = angular.copy($scope.message);
        var conversation = cache.getConversationCached(copy.ConversationID);
        var ids = [copy.ID];
        var events = [];
        var unreads = _.where($scope.messages, {IsRead: 0});

        // Generate message event
        copy.IsRead = 0;
        copy.expand = undefined; // Trick to close message and force to pass in iniView after
        events.push({Action: 3, ID: copy.ID, Message: copy});

        // Generate conversation event
        if(angular.isDefined(conversation)) {
            conversation.NumUnread = unreads.length + 1;
            events.push({Action: 3, ID: copy.ConversationID, Conversation: conversation});
        }

        // Send to cache manager
        cache.events(events);

        // Request
        Message.unread({IDs: ids});
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
                        link.attr('href',reader.result);
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
        var REMOVE = 0;
        var ADD = 1;
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var promises = [];
        var events = [];
        var current = tools.currentLocation();
        var labelIDs = [];
        var toApply = _.map(_.filter(labels, function(label) {
            return label.Selected === true && angular.isArray(copy.LabelIDs) && copy.LabelIDs.indexOf(label.ID) === -1;
        }), function(label) {
            return label.ID;
        }) || [];
        var toRemove = _.map(_.filter(labels, function(label) {
            return label.Selected === false && angular.isArray(copy.LabelIDs) && copy.LabelIDs.indexOf(label.ID) !== -1;
        }), function(label) {
            return label.ID;
        }) || [];

        // Requests
        _.each(toApply, function(labelID) {
            promises.push(Message.updateLabels(labelID, ADD, ids));
        });

        _.each(toRemove, function(labelID) {
            promises.push(Message.updateLabels(labelID, REMOVE, ids));
        });

        if(alsoArchive === true) {
            toApply.push(CONSTANTS.MAILBOX_IDENTIFIERS.archive); // Add in archive
            toRemove.push(current); // Remove current location
        }

        // Generate cache event
        copy.LabelIDsAdded = toApply;
        copy.LabelIDsRemoved = toRemove;
        events.push({Action: 3, ID: copy.ID, Message: copy});

        _.each(cache.queryMessagesCached(copy.ConversationID), function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        events.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDs: labelIDs}});

        // Send to cache manager
        cache.events(events);

        $q.all(promises).then(function(result) {
            if(alsoArchive === true) {
                deferred.resolve(Message.archive({IDs: ids}).$promise);
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
        var events = [];
        var copy = angular.copy($scope.message);
        var labelIDs = [];
        var REMOVE = 0;
        var messages = cache.queryMessagesCached(copy.ConversationID);

        // Generate event for the message
        copy.LabelIDsRemoved = [label.ID];
        events.push({Action: 3, ID: copy.ID, Message: copy});

        // Generate event for the conversation
        _.each(messages, function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        labelIDs.splice(labelIDs.indexOf(label.ID), 1); // Remove one labelID

        events.push({Action: 3, ID: copy.ConversationID, Conversation: {ID: copy.ConversationID, LabelIDs: labelIDs}});

        // Send to cache manager
        cache.events(events);

        // Send request to detach the label
        copy.updateLabels(label.ID, REMOVE, [copy.ID]);
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
        var blockquoteStart = '<blockquote class="protonmail_quote" type="cite">';
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
        var events = [];
        var copy = angular.copy($scope.message);
        var current = tools.currentLocation();
        var labelIDs = [];

        copy.Selected = false;
        copy.LabelIDsRemoved = [current]; // Remove previous location
        copy.LabelIDsAdded = [CONSTANTS.MAILBOX_IDENTIFIERS[mailbox]]; // Add new location

        // Generate message event
        events.push({Action: 3, ID: copy.ID, Message: copy});

        _.each(cache.queryMessagesCached(copy.ConversationID), function(message) {
            labelIDs = labelIDs.concat(message.LabelIDs);
        });

        // Generate conversation event
        events.push({Action: 3, ID: copy.ConversationID, Conversation: {
            ID: copy.ConversationID,
            LabelIDs: labelIDs
        }});

        // Send to cache manager
        cache.events(events);

        // Send move request
        Message[mailbox]({IDs: [copy.ID]});
    };

    /**
     * Delete current message
     */
    $scope.delete = function() {
        var events = [];
        var copy = angular.copy($scope.message);
        var conversation = cache.getConversationCached(copy.ConversationID);

        if(angular.isDefined(conversation)) {
            if(conversation.NumMessages <= 1) {
                // Delete conversation
                events.push({Action: 0, ID: conversation.ID});
            } else if(conversation.NumMessages > 1) {
                // Decrease the number of message
                conversation.NumMessages--;
                events.push({Action: 3, ID: conversation.ID, Conversation: conversation});
            }
        }

        events.push({Action: 0, ID: copy.ID});

        // Send to cache manager
        cache.events(events);

        Message.delete({IDs: [copy.ID]});
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
