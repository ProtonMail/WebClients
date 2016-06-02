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
    gettextCatalog,
    $window,
    action,
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
    $scope.attachmentsStorage = [];
    $scope.elementPerPage = CONSTANTS.ELEMENTS_PER_PAGE;

    $scope.$on('refreshMessage', function(event) {
        var message = cache.getMessageCached($scope.message.ID);

        if(angular.isDefined(message)) {
            $scope.message.AddressID = message.AddressID;
            $scope.message.Attachments = message.Attachments;
            $scope.message.BCCList = message.BCCList;
            $scope.message.Body = message.Body;
            $scope.message.CCList = message.CCList;
            $scope.message.ConversationID = message.ConversationID;
            $scope.message.ExpirationTime = message.ExpirationTime;
            $scope.message.ID = message.ID;
            $scope.message.IsEncrypted = message.IsEncrypted;
            $scope.message.IsForwarded = message.IsForwarded;
            $scope.message.IsRead = message.IsRead;
            $scope.message.IsReplied = message.IsReplied;
            $scope.message.IsRepliedAll = message.IsRepliedAll;
            $scope.message.LabelIDs = message.LabelIDs;
            $scope.message.Location = message.Location;
            $scope.message.NumAttachments = message.NumAttachments;
            $scope.message.Sender = message.Sender;
            $scope.message.SenderAddress = message.SenderAddress;
            $scope.message.SenderName = message.SenderName;
            $scope.message.Size = message.Size;
            $scope.message.Starred = message.Starred;
            $scope.message.Subject = message.Subject;
            $scope.message.Time = message.Time;
            $scope.message.ToList = message.ToList;
            $scope.message.Type = message.Type;
        }
    });

    $scope.$on('replyConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            $scope.reply();
        }
    });

    $scope.$on('replyAllConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            $scope.replyAll();
        }
    });

    $scope.$on('forwardConversation', function(event) {
        if ($scope.$last === true && $scope.message.Type !== 1) {
            $scope.forward();
        }
    });

    // Listner when we destroy this message controller
    $scope.$on('$destroy', function(event) {
        $scope.message.expand = false;
    });

    $scope.$on('initMessage', function(event, ID, scroll) {
        if($scope.message.ID === ID) {
            $scope.initialization(scroll);
        }
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
    $scope.initialization = function() {
        if ($rootScope.printMode === true) {
            networkActivityTracker.track(cache.getMessage($stateParams.id).then(function(message) {
                $scope.message = message;
                $scope.initView();
            }));
        } else if ($stateParams.message === $scope.message.ID) {
            $scope.initView();
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
        action.starMessage($scope.message.ID);
    };

    /**
     * Unstar the current message
     */
    $scope.unstar = function() {
        action.unstarMessage($scope.message.ID);
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
                var showMessage = function(content) {
                    // NOTE Plain text detection doesn't work. Check #1701
                    var isHtml = tools.isHtml(content);

                    if ($rootScope.printMode !== true) {
                        content = $scope.message.clearImageBody(content);
                    }

                    // Safari warning
                    if (!$rootScope.isFileSaverSupported) {
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
                    if (isHtml === true) {
                        $scope.isPlain = false;
                        $scope.message.viewMode = 'html';
                        // Assign decrypted content
                        $scope.message.decryptedBody = $sce.trustAsHtml(content);
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

    // Return Message object to build response or forward
    // TODO refactor this function
    var buildMessage = function(action) {
        var base = new Message();
        var br = '<br />';
        var contentSignature = '';
        var signature;
        var blockquoteStart = '<blockquote class="protonmail_quote" type="cite">';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + $scope.message.Subject + br;
        var time = 'Local Time: ' + $filter('localReadableTime')($scope.message.Time) + '<br />UTC Time: ' + $filter('utcReadableTime')($scope.message.Time) + '<br />';
        var from = 'From: ' + $scope.message.Sender.Address + br;
        var to = 'To: ' + tools.contactsToString($scope.message.ToList) + br;
        var cc = ($scope.message.CCList.length > 0)?('CC: ' + tools.contactsToString($scope.message.CCList) + br):'';
        var blockquoteEnd = '</blockquote>';
        var re_prefix = gettextCatalog.getString('Re:', null);
        var fw_prefix = gettextCatalog.getString('Fw:', null);
        var re_length = re_prefix.length;
        var fw_length = fw_prefix.length;
        var body = $scope.message.decryptedBody || $scope.message.Body;

        if (action === 'reply') {
            base.Action = 0;
            base.Subject = ($scope.message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? $scope.message.Subject : re_prefix + ' ' + $scope.message.Subject;

            if ($scope.message.Type === 2 || $scope.message.Type === 3) {
                base.ToList = $scope.message.ToList;
            } else {
                base.ToList = [$scope.message.ReplyTo];
            }
        } else if (action === 'replyall') {
            base.Action = 1;
            base.Subject = ($scope.message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? $scope.message.Subject : re_prefix + ' ' + $scope.message.Subject;

            if($scope.message.Type === 2 || $scope.message.Type === 3) {
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

        if (angular.isDefined($scope.message.AddressID)) {
            var recipients = base.ToList.concat(base.CCList).concat(base.BCCList);
            var address = _.findWhere(authentication.user.Addresses, {ID: $scope.message.AddressID});
            var found = _.findWhere(recipients, {Address: address.Email});

            if ($scope.message.Type === 2 || $scope.message.Type === 3) {
                found = address;
            } else {
                _.each(_.sortBy(authentication.user.Addresses, 'Send'), function(address) {
                    if (angular.isUndefined(found)) {
                        found = _.findWhere(recipients, {Address: address.Email});
                    }
                });

                if (angular.isUndefined(found)) {
                    found = address;
                }
            }

            base.From = found;
        }

        if (base.From.Signature) {
            contentSignature = DOMPurify.sanitize('<div class="protonmail_signature_block">' + tools.replaceLineBreaks(base.From.Signature) + '</div>', {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        }

        if ($(contentSignature).text().length === 0 && $(contentSignature).find('img').length === 0) {
            signature = br + br;
        } else {
            signature = br + br + contentSignature + br + br;
        }

        base.ParentID = $scope.message.ID;
        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + cc + br + body + blockquoteEnd;

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

    $scope.initialization();
});
