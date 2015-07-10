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
    $sce,
    localStorageService,
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
    $rootScope.pageName = message.Subject;
    $scope.tools = tools;
    $scope.isPlain = false;
    $scope.labels = authentication.user.Labels;

    $timeout(function() {
        $scope.initView();
    }, 100);

    $scope.$watch('message', function() {
        messageCache.put(message.ID, message);
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
            message.toggleImages();
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
    };

    $scope.markAsUnread = function() {
        var promise;
        messageCounts.updateUnread('mark', [message], false);
        message.IsRead = 0;
        promise = Message.unread({IDs: [message.ID]}).$promise;
        networkActivityTracker.track(promise);
        $scope.goToMessageList();
    };

    $scope.toggleImages = function() {
        message.toggleImages();
        $scope.displayContent();
    };

    $scope.decryptAttachment = function(message, attachment, $event) {
        if (attachment.decrypted===true) {
            return true;
        }

        attachment.decrypting = true;

        var deferred = $q.defer();

        // get enc attachment
        var att = attachments.get(attachment.ID, attachment.Name);

        if (attachment.KeyPackets===undefined) {
            return att.then( function(result) {
                var data = { data: result.data };
                // console.log(data, attachment);
                $scope.downloadAttachment(data, attachment, $event);
                attachment.decrypting = false;
                attachment.decrypted = true;
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

        // when we have the session key and attachent:
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
                        $scope.downloadAttachment(decryptedAtt, attachment, $event);
                    }
                );
            },
            function(err) {
                console.log(err);
            }
        );
    };

    $scope.downloadAttachment = function(data, meta, $event) {
        var linkElement = $($event.target);
        var blob = new Blob([data.data], {type: meta.MIMEType});

        linkElement.attr('download', meta.Name);

        if(window.navigator.msSaveOrOpenBlob) { // IE 10 / 11
            window.navigator.msSaveOrOpenBlob(blob, meta.Name);
        } else if(angular.isDefined(URL.createObjectURL)) {
            // Browser supports a good way to download blobs
            $scope.$apply(function() {
                meta.decrypting = false;
                meta.decrypted = true;
            });

            if(('download' in document.createElement('a')) || navigator.msSaveOrOpenBlob) {
                // A fake link and will dispatch a click event on this fake link
                var url  = window.URL || window.webkitURL;
                var link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");

                link.href = url.createObjectURL(blob);
                linkElement.attr('href', url.createObjectURL(blob));
                link.download = meta.Name;

                var event = document.createEvent("MouseEvents");

                event.initEvent("click", true, false);
                link.dispatchEvent(event);
            } else {
                // Bad blob support, make a data URI, don't click it
                reader = new FileReader();

                reader.onloadend = function () {
                    linkElement.attr('href', reader.result);
                };

                reader.readAsDataURL(blob);
            }

        } else {
            // Bad blob support, make a data URI, don't click it
            reader = new FileReader();

            reader.onloadend = function () {
                link.attr('href',reader.result);
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
        var signature = '<br /><br />' + tools.replaceLineBreaks($scope.user.Signature) + '<br /><br />';
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

        base.ParentID = message.ID;
        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + $scope.content + blockquoteEnd;

        if (action === 'reply') {
            base.Action = 0;
            base.ToList = [{Name: message.SenderName, Address: message.SenderAddress}];
            base.Subject = (message.Subject.includes(re_prefix)) ? message.Subject :
            re_prefix + ' ' + message.Subject;
        }
        else if (action === 'replyall') {
            base.Action = 1;
            base.ToList = _.union([{Name: message.SenderName, Address: message.SenderAddress}], message.CCList, message.BCCList, message.ToList);
            base.ToList = _.filter(base.ToList, function (c) { return _.find($scope.user.Addresses, function(a) { return a.Email === c.Address;}) === undefined;});
            base.Subject = (message.Subject.includes(re_prefix)) ? message.Subject :
            re_prefix + ' ' + message.Subject;
        }
        else if (action === 'forward') {
            base.Action = 2;
            base.ToList = [];
            base.Subject = (message.Subject.includes(fw_prefix)) ? message.Subject :
            fw_prefix + ' ' + message.Subject;

            if(message.Attachments.length > 0) {
                message.attachmentsToggle = true;
            }
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
        $state.go('^'); // We can't use `{reload: true}` here because it close the composer
    };

    $scope.moveMessageTo = function(mailbox) {
        var promise;
        var inDelete = mailbox === 'delete';
        var messages = [];


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
