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
    $scope.mailbox = $state.current.name.replace('secured.', '').replace('.list', '').replace('.view', '');
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
            $scope.initView();
        } else if($scope.message.expand === true) {
            $scope.message.expand = false;
        } else if($scope.message.expand === false) {
            $scope.message.expand = true;
        }
    };

    $scope.initView = function() {
        if($scope.message.IsRead === 0) {
            $scope.message.IsRead = 1;
            Message.read({IDs: [$scope.message.ID]});
            // TODO generate event
        }

        if(angular.isDefined($scope.message.Body)) {
            $scope.displayContent();
        } else {
            cache.getMessage($scope.message.ID).then(function(message) {
                _.extend($scope.message, message);
                $scope.displayContent();
            });
        }

        // start timer ago
        $scope.agoTimer = $interval(function() {
            var time = $filter('longReadableTime')($scope.message.Time);

            $scope.ago = time;
        }, 1000);

        $scope.message.expand = true;
    };

    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        var open;

        if(angular.isDefined($rootScope.openMessage)) {
            open = _.where($scope.messages, {ID: $rootScope.openMessage})[0];
            delete $rootScope.openMessage;
        } else {
            open = _.last($scope.messages);
        }

        if($scope.message === open) {
            $scope.initView();
        }
    };

    $scope.getMessage = function() {
        return $scope.message;
    };

    /**
     * Return star status of current message
     * @return {Boolean}
     */
    $scope.starred = function() {
        return $scope.message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString()) !== -1;
    };

    /**
     * Star / unstar the current message
     */
    $scope.star = function() {
        var promise;
        var copy = angular.copy($scope.message);
        var ids = [copy.ID];

        if($scope.starred()) {
            copy.LabelIDs = _.without(copy.LabelIDs, CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString());
            promise = Message.unstar({IDs: ids}).$promise;
        } else {
            copy.LabelIDs.push(CONSTANTS.MAILBOX_IDENTIFIERS.starred.toString());
            promise = Message.star({IDs: ids}).$promise;
        }

        cache.events([{Action: 3, ID: copy.ID, Message: copy}]);
    };

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

    $scope.displayContent = function(print) {
        var whitelist = ['notify@protonmail.com'];

        if (whitelist.indexOf($scope.message.Sender.Address) !== -1 && $scope.message.IsEncrypted === 0) {
            $scope.message.imagesHidden = false;
        } else if(authentication.user.ShowImages === 1) {
            $scope.message.imagesHidden = false;
        }

        $scope.message.clearTextBody().then(function(result) {
            var showMessage = function(content) {
                if(print !== true) {
                    content = $scope.message.clearImageBody(content);
                }

                // safari warning
                if(!$rootScope.isFileSaverSupported) {
                    $scope.safariWarning = true;
                }

                content = DOMPurify.sanitize(content, {
                    ADD_ATTR: ['target'],
                    FORBID_TAGS: ['style', 'input', 'form']
                });

                // for the welcome email, we need to change the path to the welcome image lock
                content = content.replace("/img/app/welcome_lock.gif", "/assets/img/emails/welcome_lock.gif");

                if (tools.isHtml(content)) {
                    $scope.isPlain = false;
                } else {
                    $scope.isPlain = true;
                }

                $scope.content = $sce.trustAsHtml(content);

                // broken images
                $("img").error(function () {
                    $(this).unbind("error").addClass("pm_broken");
                });

                if(print) {
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
    };

    $scope.read = function() {
        var  copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var events = [];

        copy.IsRead = 1;
        events.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(events, 'message');
        Message.read({IDs: ids});
        $scope.back();
    };

    $scope.unread = function() {
        var  copy = angular.copy($scope.message);
        var ids = [copy.ID];
        var events = [];

        copy.IsRead = 0;
        events.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(events, 'message');
        Message.read({IDs: ids});
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

    $scope.detachLabel = function(labelID) {
        var copy = angular.copy(message);

        copy.LabelIDs = _.without(copy.LabelIDs, labelID);
        cache.events([{Action: 3, ID: copy.ID, Message: copy}]);
        Label.remove({id: labelID, MessageIDs: [copy.ID]});
    };

    $scope.getLabel = function(id) {
        return _.findWhere($scope.labels, {ID: id});
    };

    $scope.getColorLabel = function(label) {
        return {
            borderColor: label.Color,
            color: label.Color
        };
    };

    $scope.saveLabels = function(labels, alsoArchive) {
        var deferred = $q.defer();
        var messageIDs = [message.ID];
        var newMessage = angular.copy(message);
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        // Detect if the current message will have too many labels
        if(_.difference(_.uniq(angular.copy(message.LabelIDs).concat(toApply)), toRemove).length > 5) {
            notify($translate.instant('TOO_MANY_LABELS_ON_MESSAGE'));
            deferred.reject();
        } else {
            _.each(toApply, function(labelID) {
                promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
            });

            _.each(toRemove, function(labelID) {
                promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
            });

            $q.all(promises).then(function() {
                newMessage.LabelIDs = _.difference(_.uniq(newMessage.LabelIDs.concat(toApply)), toRemove);
                cache.events([{Action: 3, ID: newMessage.ID, Message: newMessage}]);

                if(alsoArchive === true) {
                    deferred.resolve($scope.move('archive'));
                } else {
                    if(toApply.length > 1 || toRemove.length > 1) {
                        notify($translate.instant('LABELS_APPLIED'));
                    } else {
                        notify($translate.instant('LABEL_APPLIED'));
                    }

                    deferred.resolve();
                }
            });

            networkActivityTracker.track(deferred.promise);
        }

        return deferred.promise;
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
    function buildMessage(action) {
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
        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + cc + br + $scope.content + blockquoteEnd;

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
    }

    $scope.reply = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('reply'));
    };

    $scope.replyAll = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('replyall'));
    };

    $scope.forward = function() {
        $rootScope.$broadcast('loadMessage', buildMessage('forward'), true);
    };

    $scope.move = function(mailbox) {
        var promise;
        var events = [];
        var copy = angular.copy($scope.message);
        var current;

        _.each($scope.message.LabelIDs, function(labelID) {
            if(['0', '1', '2', '3', '4', '6'].indexOf(labelID)) {
                current = labelID;
            }
        });

        copy.LabelIDs.push(mailbox); // Add new location
        copy.LabelIDs = _.without(copy.LabelIDs, current); // Remove previous location
        events.push({Action: 3, ID: copy.ID, Message: copy});
        cache.events(events);

        promise = Message[mailbox]({IDs: [copy.ID]}).$promise.then(function(result) {
            $scope.back();
        });

        networkActivityTracker.track(promise);
    };

    $scope.delete = function() {
        var promise;
        var events = [];
        var copy = angular.copy($scope.message);

        events.push({Action: 0, ID: copy.ID, Message: copy});
        cache.events(events);

        promise = Message.delete({IDs: [copy.ID]}).$promise.then(function(result) {
            $scope.back();
        });

        networkActivityTracker.track(promise);
    };

    $scope.back = function() {
        $state.go("secured." + $scope.mailbox + '.list', {
            id: null // remove ID
        });
    };

    $scope.print = function() {
        var url = $state.href('secured.print', { id: $scope.message.ID });

        window.open(url, '_blank');
    };

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
