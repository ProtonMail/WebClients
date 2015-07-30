angular.module("proton.controllers.Messages.View", ["proton.constants"])

.controller("ViewMessageController", function(
    $log,
    $state,
    $stateParams,
    $rootScope,
    $scope,
    $templateCache,
    $compile,
    $timeout,
    $translate,
    $filter,
    $q,
    $sanitize,
    $sce,
    networkActivityTracker,
    notify,
    Message,
    Label,
    message,
    messageCache,
    messageCounts,
    tools,
    attachments,
    pmcw,
    CONSTANTS,
    authentication,
    contactManager
) {
    $scope.message = message;
    $scope.tools = tools;
    $scope.isPlain = false;
    $scope.labels = authentication.user.Labels;

    $timeout(function() {
        $scope.initView();
    }, 100);

    $scope.$watch('message', function() {
        messageCache.put(message.ID, message);
    });

    $scope.$on('updateReplied', function(e, m) {
        $scope.message = _.extend($scope.message, m);
    });

    $scope.initView = function() {
        if(authentication.user.AutoSaveContacts === 1) {
            $scope.saveNewContacts();
        }

        if(message.IsRead === 0) {
            message.IsRead = 1;
            Message.read({IDs: [message.ID]});
        }

        if(authentication.user.ShowImages===1) {
            message.imagesHidden = false;
            $scope.displayContent();
        }
    };

    $scope.toggleStar = function(message) {
        var ids = [];
        var promise;

        ids.push(message.ID);

        if(message.Starred === 1) {
            promise = Message.unstar({IDs: ids}).$promise;
            message.Starred = 0;
        } else {
            promise = Message.star({IDs: ids}).$promise;
            message.Starred = 1;
        }

        networkActivityTracker.track(promise);
        messageCache.set([{Action: 3, ID: message.ID, Message: message}]);
    };

    $scope.saveNewContacts = function() {
        var newContacts = _.filter(message.ToList.concat(message.CCList).concat(message.BCCList), function(email) {
            return contactManager.isItNew(email);
        });

        _.each(newContacts, function(email) {
            contactManager.add(email);
            email.Email = email.Address;
            email.Name = email.Name || email.Address;
        });

        if (newContacts.length > 0) {
            contactManager.send(newContacts);
        }
    };

    $scope.getFrom = function() {
        var result = '';

        if(angular.isDefined(message.SenderName)) {
            result += '<b>' + message.SenderName + '</b> &lt;' + message.SenderAddress + '&gt;';
        } else {
            result += message.SenderAddress;
        }

        return result;
    };

    $scope.displayContent = function(print) {
        message.clearTextBody().then(function(result) {
            var content;

            if(print === true) {
                content = result;
            } else {
                content = message.clearImageBody(result);
            }

            content = DOMPurify.sanitize(content, {
                FORBID_TAGS: ['style']
            });

            if (tools.isHtml(content)) {
                $scope.isPlain = false;
            } else {
                $scope.isPlain = true;
            }

            // for the welcome email, we need to change the path to the welcome image lock
            content = content.replace("/img/app/welcome_lock.gif", "/assets/img/emails/welcome_lock.gif");

            $scope.content = $sce.trustAsHtml(content);

            $timeout(function() {
                tools.transformLinks('message-body');
            });
        });
    };

    $scope.getEmails = function(emails) {
        return _.map(emails, function(m) {
            return m.Address;
        }).join(',');
    };

    $scope.markAsRead = function() {
        var promise;

        message.IsRead = 1;
        promise = Message.read({IDs: [message.ID]}).$promise;
        networkActivityTracker.track(promise);
        messageCache.set([{Action: 3, ID: message.ID, Message: message}]);
    };

    $scope.markAsUnread = function() {
        var promise;
        messageCounts.updateUnread('mark', [message], false);
        message.IsRead = 0;
        promise = Message.unread({IDs: [message.ID]}).$promise;
        networkActivityTracker.track(promise);
        messageCache.set([{Action: 3, ID: message.ID, Message: message}]);
        $scope.goToMessageList();
    };

    $scope.toggleImages = function() {
        message.toggleImages();
        $scope.displayContent();
    };

    $scope.decryptAttachment = function(message, attachment, $event) {
        if (attachment.decrypted===true) {
            $scope.downloadAttachment(attachment);
            return;
        }

        attachment.decrypting = true;

        var deferred = $q.defer();

        // get enc attachment
        var att = attachments.get(attachment.ID, attachment.Name);

        if (attachment.KeyPackets===undefined) {
            return att.then( function(result) {
                attachment.data = result.data;
                $scope.$apply(function() {
                    attachment.decrypting = false;
                    attachment.decrypted = true;
                });
                $scope.downloadAttachment(attachment);
                return;
            });
        } else {
            // decode key packets
            var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
        }

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
                pmcw.decryptMessage(at, key, true, algo).then(
                    function(decryptedAtt) {
                        $scope.$apply(function() {
                            attachment.decrypting = false;
                            attachment.decrypted = true;
                        });
                        attachment.data = decryptedAtt.data;
                        $scope.downloadAttachment(attachment);
                    }
                );
            },
            function(err) {
                console.log(err);
            }
        );
    };

    $scope.downloadAttachment = function(attachment) {
        var blob = new Blob([attachment.data], {type: attachment.MIMEType});
        var url  = window.URL || window.webkitURL;

        if(window.navigator.msSaveOrOpenBlob) { // IE 10 / 11
            window.navigator.msSaveOrOpenBlob(blob, attachment.Name);
        } else if(angular.isDefined(url.createObjectURL)) { // Browser supports a good way to download blobs
            var link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
            // A fake link and will dispatch a click event on this fake link
            var event = document.createEvent("MouseEvents");

            link.href = url.createObjectURL(blob);
            link.download = attachment.Name;
            event.initEvent("click", true, false);
            link.dispatchEvent(event);
        } else {
            // Bad blob support, make a data URI, don't click it
            var reader = new FileReader();

            reader.onloadend = function () {
                link.attr('href', reader.result);
            };

            reader.readAsDataURL(blob);
        }
    };



    $scope.detachLabel = function(id) {
        var promise = Label.remove({id: id, MessageIDs: [message.ID]}).$promise;

        message.LabelIDs = _.without(message.LabelIDs, id);
        networkActivityTracker.track(promise);
    };

    $scope.getColorLabel = function(label) {
        return {
            backgroundColor: label.Color
        };
    };

    $scope.saveLabels = function(labels) {
        var deferred = $q.defer();
        var messageIDs = [message.ID];
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        messageCounts.updateTotalLabels([message], toApply, toRemove);

        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        $q.all(promises).then(function() {
            message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
            messageCache.set([{Action: 3, ID: message.ID, Message: message}]);

            if(toApply.length > 1 || toRemove.length > 1) {
                notify($translate.instant('LABELS_APPLIED'));
            } else {
                notify($translate.instant('LABEL_APPLIED'));
            }

            deferred.resolve();
        });

        networkActivityTracker.track(deferred.promise);

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
        var contentSignature = $sanitize('<div>' + tools.replaceLineBreaks($scope.user.Signature) + '</div>');
        var signature = ($(contentSignature).text().length === 0)? '<br /><br />' : '<br /><br />' + contentSignature + '<br /><br />';
        var blockquoteStart = '<blockquote>';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + message.Subject + '<br />';
        var time = 'Time (UTC): ' + $filter('utcReadableTime')(message.Time) + '<br />';
        var from = 'From: ' + tools.contactsToString(message.ToList) + '<br />';
        var to = 'To: ' + message.SenderAddress + '<br />';
        var cc = 'CC: ' + tools.contactsToString(message.CCList) + '<br />';
        var blockquoteEnd = '</blockquote>';
        var re_prefix = $translate.instant('RE:');
        var fw_prefix = $translate.instant('FW:');
        var re_length = re_prefix.length;
        var fw_length = fw_prefix.length;

        base.ParentID = message.ID;
        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + $scope.content + blockquoteEnd;

        if (action === 'reply') {
            base.Action = 0;
            if($state.is('secured.sent.message')) {
                base.ToList = message.ToList;
            } else {
                base.ToList = [{Name: message.SenderName, Address: message.SenderAddress}];
            }
            base.Subject = (message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? message.Subject : re_prefix + ' ' + message.Subject;
        } else if (action === 'replyall') {
            base.Action = 1;
            if($state.is('secured.sent.message')) {
                base.ToList = message.ToList;
                base.CCList = message.CCList;
            } else {
                base.ToList = [{Name: message.SenderName, Address: message.SenderAddress}];
                base.CCList = _.union(message.ToList, message.CCList);
            }
            // Remove user address in CCList and ToList
            _.each(authentication.user.Addresses, function(address) {
                base.ToList = _.filter(base.ToList, function(contact) { return contact.Address !== address.Email; });
                base.CCList = _.filter(base.CCList, function(contact) { return contact.Address !== address.Email; });
            });
            base.Subject = (message.Subject.toLowerCase().substring(0, re_length) === re_prefix.toLowerCase()) ? message.Subject : re_prefix + ' ' + message.Subject;
        }
        else if (action === 'forward') {
            base.Action = 2;
            base.ToList = [];
            base.Subject = (message.Subject.toLowerCase().substring(0, fw_length) === fw_prefix.toLowerCase()) ? message.Subject : fw_prefix + ' ' + message.Subject;
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

    $scope.goToMessageList = function() {
        $state.go('^');
    };

    $scope.moveMessageTo = function(mailbox) {
        var promise;
        var inDelete = mailbox === 'delete';
        var messages = [];
        var movedMessages = [];
        var m = {LabelIDs: message.LabelIDs, OldLocation: message.Location, IsRead: message.IsRead, Location: CONSTANTS.MAILBOX_IDENTIFIERS[mailbox], Starred: message.Starred};

        movedMessages.push(m);
        messageCounts.updateUnread('move', movedMessages);
        messageCounts.updateTotals('move', movedMessages);

        if(inDelete) {
            promise = Message.delete({IDs: [message.ID]}).$promise;
        } else {
            promise = Message[mailbox]({IDs: [message.ID]}).$promise;
        }

        promise.then(function(result) {
            $rootScope.$broadcast('updateCounters');
            message.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
            messages.push({Action: 3, ID: message.ID, Message: message});
    		messageCache.set(messages);
            $scope.goToMessageList();
        });

        networkActivityTracker.track(promise);
    };

    $scope.print = function() {
        var url = $state.href('secured.print', {
            id: message.ID
        });

        window.open(url, '_blank');
    };

    $scope.viewPgp = function() {
        $log.debug(message);
        window.open('data:text/plain;base64,'+btoa(message.Header+'\n\r'+message.Body), '_blank');
    };

    $scope.togglePlainHtml = function() {
        if (message.viewMode === 'plain') {
            message.viewMode = 'html';
        } else {
            message.viewMode = 'plain';
        }
    };
});
