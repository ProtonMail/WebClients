angular.module("proton.controllers.Messages", [
    "proton.routes"
])

.controller("MessageListController", function(
    $state,
    $stateParams,
    $scope,
    $rootScope,
    $q,
    $timeout,
    messages,
    messageCount,
    messageCache,
    networkActivityTracker
) {
    var mailbox = $rootScope.pageName = $state.current.data.mailbox;
    $scope.messagesPerPage = $scope.user.NumMessagePerPage;

    var unsubscribe = $rootScope.$on("$stateChangeSuccess", function() {
        $rootScope.pageName = $state.current.data.mailbox;
    });
    $scope.$on("$destroy", unsubscribe);

    $scope.page = parseInt($stateParams.page || "1");
    $scope.messages = messages;

    if ($stateParams.filter) {
        $scope.messageCount = messageCount[$stateParams.filter == 'unread' ? "UnRead" : "Read"];
    } else {
        $scope.messageCount = messageCount.Total;
    }

    $scope.selectedFilter = $stateParams.filter;
    $scope.selectedOrder = $stateParams.sort || "-date";

    messageCache.watchScope($scope, "messages");

    $scope.start = function() {
        return ($scope.page - 1) * $scope.messageCount + 1;
    };

    $scope.end = function() {
        var end;

        end = $scope.start() + $scope.messagesPerPage - 1;

        if(end > $scope.messageCount) {
            end = $scope.messageCount;
        }

        return end;
    };

    $scope.truncateSubjects = function() {
        $timeout(function() {
            $('#message .subject h4').hide();
            var outerWidth = $('#message .subject').eq(0).outerWidth();
            var width;

            if (!!!outerWidth) {
                width = 'auto';
            } else {
                width = outerWidth - 35;
            }

            $('#message .subject h4').css('width', width);
            $('#message .subject h4').show();
        }, 200);
    };

    $(window).bind('resize load', function() {
        $scope.truncateSubjects();
    });

    $scope.hasNextPage = function() {
        return $scope.messageCount > ($scope.page * $scope.messagesPerPage);
    };

    $scope.navigateToMessage = function(event, message) {
        if (!event || !$(event.target).closest("td").hasClass("actions")) {
            if (message === 'last') {
                message = _.last(messages);
            } else if (message === 'first') {
                message = _.first(messages);
            }

            if ($state.is('secured.drafts')) {
                $rootScope.$broadcast('loadMessage', message);
            } else {
                $state.go("secured." + mailbox + ".message", {
                    MessageID: message.MessageID
                });
            }
        }
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.messages.length > 0) {
            _.forEach($scope.messages, function(message) {
                if (!!!message.selected) {
                    status = false;
                }
            });
        } else {
            status = false;
        }

        return status;
    };

    $scope.selectAllMessages = function(val) {
        var status = !!!$scope.allSelected();

        _.forEach($scope.messages, function(message) {
            message.selected = status;
        }, this);
    };

    $scope.selectedMessages = function() {
        return _.select($scope.messages, function(message) {
            return message.selected === true;
        });
    };

    $scope.selectedMessagesWithReadStatus = function(bool) {
        return _.select($scope.selectedMessages(), function(message) {
            return message.IsRead == bool;
        });
    };

    $scope.messagesCanBeMovedTo = function(otherMailbox) {
        if (otherMailbox === "inbox") {
            return _.contains(["spam", "trash"], mailbox);
        } else if (otherMailbox == "trash") {
            return _.contains(["inbox", "drafts", "spam", "sent", "starred"], mailbox);
        } else if (otherMailbox == "spam") {
            return _.contains(["inbox", "starred", "trash"], mailbox);
        } else if (otherMailbox == "drafts") {
            return _.contains(["trash"], mailbox);
        }
    };

    $scope.setMessagesReadStatus = function(status) {
        networkActivityTracker.track($q.all(
            _.map($scope.selectedMessagesWithReadStatus(!status), function(message) {
                return message.setReadStatus(status);
            })
        ));
    };

    $scope.moveMessagesTo = function(mailbox) {
        var selectedMessages = $scope.selectedMessages();
        networkActivityTracker.track($q.all(
            _.map(selectedMessages, function(message) {
                if (mailbox == 'delete') {
                    return message.delete().$promise;
                } else {
                    return message.moveTo(mailbox).$promise;
                }
            })
        ).then(function() {
            _.each(selectedMessages, function(message) {
                var i = $scope.messages.indexOf(message);
                if (i >= 0) {
                    $scope.messages.splice(i, 1);
                }
            });
        }));
    };

    $scope.filterBy = function(status) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: status,
            page: null
        }));
    };

    $scope.clearFilter = function() {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: null,
            page: null
        }));
    };

    $scope.orderBy = function(criterion) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            sort: criterion == '-date' ? null : criterion,
            page: null
        }));
    };

    $scope.openLabels = function() {
        $scope.labels = [
            {name: 'Proton'},
            {name: 'Work'},
            {name: 'Trip'},
            {name: 'Shopping'}
        ];
        $timeout(function() {
            $('#searchLabels').focus();
        });
    };

    $scope.closeLabels = function() {
        $('[data-toggle="dropdown"]').parent().removeClass('open');
    };

    $scope.saveLabels = function() {
        $scope.closeLabels();
    };

    $scope.goToPage = function(page) {
        if (page > 0 && $scope.messageCount > ((page - 1) * $scope.messagesPerPage)) {
            if (page == 1) {
                page = null;
            }
            $state.go($state.current.name, _.extend({}, $state.params, {
                page: page
            }));
        }
    };

    $scope.hasAdjacentMessage = function(message, adjacency) {
        if (adjacency === +1) {
            if (messages.indexOf(message) === messages.length - 1) {
                return $scope.hasNextPage();
            } else {
                return true;
            }
        } else if (adjacency === -1) {
            if (messages.indexOf(message) === 0) {
                return $scope.page > 1;
            } else {
                return true;
            }
        }
    };

    $scope.goToAdjacentMessage = function(message, adjacency) {
        var idx = messages.indexOf(message);
        if (adjacency === +1 && idx === messages.length - 1) {
            $state.go("^.relative", {
                rel: 'first',
                page: $scope.page + adjacency
            });
        } else if (adjacency === -1 && messages.indexOf(message) === 0) {
            $state.go("^.relative", {
                rel: 'last',
                page: $scope.page + adjacency
            });
        } else if (Math.abs(adjacency) === 1) {
            $scope.navigateToMessage(null, messages[idx + adjacency]);
        }
    };
})

.controller("SearchMessageController", function($location, $scope, $rootScope) {
    $scope.searchValue = '';

    $rootScope.$on('updateSearch', function(event, value) {
        $scope.searchValue = value;
    });
})

// .controller("ComposeMessageController", function(
//     $state,
//     $rootScope,
//     $scope,
//     $stateParams,
//     $injector,
//     Message,
//     message,
//     localStorageService,
//     attachments,
//     pmcrypto,
//     networkActivityTracker,
//     notify
// ) {
//     $rootScope.pageName = "New Message";

//     $scope.message = message;
//     if (!message.MessageBody) {
//         $scope.user.$promise.then(function() {
//             message.RawMessageBody = "<br><br>" + $scope.user.Signature;
//         });
//     }
//     message.RawMessageBody = message.clearTextBody();

//     if (!$scope.message.expirationInHours) {
//         $scope.message.expirationInHours = 336;
//     }

//     if ($stateParams.to) {
//         message.RecipientList = $stateParams.to;
//     }

//     $scope.selectFile = function(files) {
//         _.defaults(message, {
//             Attachments: []
//         });
//         message.Attachments.push.apply(
//             message.Attachments,
//             _.map(files, function(file) {
//                 return attachments.load(file);
//             })
//         );
//     };

//     $scope.removeAttachment = function(attachment) {
//         var idx = message.Attachments.indexOf(attachment);
//         if (idx >= 0) {
//             message.Attachments.splice(idx, 1);
//         }
//     }

//     $scope.shouldShowField = function(field) {
//         if (_.contains(["BCC", "CC"], field)) {
//             return message[field + "List"] || $scope["alwaysShow" + field] == "true";
//         }
//     };

//     $scope.toggleField = function(field) {
//         if (_.contains(["BCC", "CC"], field)) {
//             if ($scope.shouldShowField(field)) {
//                 message[field + "List"] = "";
//                 $scope["alwaysShow" + field] = "false";
//             } else {
//                 $scope["alwaysShow" + field] = "true";
//             }
//         }
//     };

//     $scope.toggleConfig = function(config) {
//         $scope[config] = !$scope[config];
//     }

//     $scope.send = function() {
//         // get the message meta data
//         var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));
//         _.defaults(newMessage, {
//             RecipientList: '',
//             CCList: '',
//             BCCList: '',
//             MessageTitle: '',
//             PasswordHint: '',
//             Attachments: []
//         });
//         if (message.Attachments) {
//             newMessage.Attachments = _.map(message.Attachments, function(att) {
//                 return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
//             });
//         }

//         // encrypt the message body and set 'outsiders' to empty by default
//         newMessage.MessageBody = {
//             self: pmcrypto.encryptMessage(message.RawMessageBody, $scope.user.PublicKey),
//             outsiders: ''
//         };

//         // concat all recipients
//         emails = newMessage.RecipientList + (newMessage.CCList == '' ? '' : ',' + newMessage.CCList) + (newMessage.BCCList == '' ? '' : ',' + newMessage.BCCList)
//         base64 = pmcrypto.encode_base64(emails);

//         // new message object
//         var userMessage = new Message();
//         // get users' publickeys
//         networkActivityTracker.track(userMessage.$pubkeys({
//             Emails: base64
//         }).then(function(result) {
//                 // set defaults
//                 isOutside = false;
//                 mails = emails.split(",");
//                 var log = [];
//                 // loop through and overwrite defaults
//                 angular.forEach(mails, function(value) {
//                     // encrypt messagebody with each user's keys
//                     newMessage.MessageBody[value] = pmcrypto.encryptMessage(message.RawMessageBody, result[value]);
//                     if (!isOutside) {
//                         if (!value.indexOf('protonmail') < 0) {
//                             isOutside = true;
//                         }
//                     }
//                 });
//                 // dont encrypt if its going outside
//                 if (isOutside) {
//                     newMessage.MessageBody['outsiders'] = message.RawMessageBody
//                 };
//                 // send email
//                 networkActivityTracker.track(newMessage.$send(null, function(result) {
//                     // reset form
//                     $scope.composeForm.$setPristine();
//                     // redirect
//                     $state.go("secured.inbox");
//                 }, function(error) {
//                     console.log(error);
//                 }));

//             },
//             function(error) {
//                 console.log(error);
//             }));
//     }

//     $scope.saveDraft = function() {
//         var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));

//         _.defaults(newMessage, {
//             RecipientList: '',
//             CCList: '',
//             BCCList: '',
//             MessageTitle: '',
//             PasswordHint: '',
//             Attachments: []
//         });

//         if (message.Attachments) {
//             newMessage.Attachments = _.map(message.Attachments, function(att) {
//                 return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
//             });
//         }

//         newMessage.MessageBody = {
//             self: pmcrypto.encryptMessage(message.RawMessageBody, $scope.user.PublicKey),
//             outsiders: ''
//         };

//         if (message.MessageID) {
//             newMessage.MessageID = message.MessageID;
//             networkActivityTracker.track(newMessage.$updateDraft(null, function() {
//                 $scope.composeForm.$setPristine();
//                 notify('Draft updated');
//             }));
//         } else {
//             networkActivityTracker.track(newMessage.$saveDraft(null, function(result) {
//                 message.MessageID = parseInt(result.MessageID);
//                 $scope.composeForm.$setPristine();
//                 notify('Draft saved');
//             }));
//         }
//     };

//     $scope.showOptions = false;
//     $scope.setOptionsVisibility = function(status) {
//         if (!status && $scope.message.IsEncrypted !== '0' &&
//             !this.composeForm.enc_password_conf.$valid) {

//             $scope.message.IsEncrypted = '0';
//         } else {
//             $scope.showOptions = status;
//         }
//     };

//     $scope.$watch("composeForm.$pristine", function(isPristine) {
//         if (!isPristine) {
//             window.onbeforeunload = function() {
//                 return "By leaving now, you will lose what you have written in this email. " +
//                     "You can save a draft if you want to come back to it later on.";
//             }
//         } else {
//             window.onbeforeunload = undefined;
//         }
//     });

//     $scope.$watch("message.IsEncrypted", function(newValue, oldValue) {
//         if (oldValue === '0' && newValue === '1') {
//             $scope.setOptionsVisibility(true);
//         } else {
//             $scope.setOptionsVisibility(false);
//         }
//     });

//     localStorageService.bind($scope, 'alwaysShowCC', "true");
//     localStorageService.bind($scope, 'alwaysShowBCC', "true");
//     localStorageService.bind($scope, 'savesDraft', "true");
//     localStorageService.bind($scope, 'savesContacts', "true");

//     $scope.savesDraft = $scope.savesDraft == 'true';
//     $scope.savesContacts = $scope.savesContacts == 'true';
// })

.controller("ComposeMessageController", function(
    $rootScope,
    $scope,
    $log,
    $timeout,
    Message,
    localStorageService,
    attachments,
    pmcrypto,
    networkActivityTracker,
    notify
) {
    $scope.messages = [];

    $rootScope.$on('newMessage', function() {
        var message = new Message();

        $scope.initMessage(message);
    });

    $rootScope.$on('loadMessage', function(event, message) {
        $scope.initMessage(message);
    });

    $scope.initMessage = function(message) {
        $scope.messages.unshift(message);
        $scope.completedSignature(message);
        $scope.clearTextBody(message);
        $scope.selectAddress(message);
        // $scope.initForm(message); // TODO uncomment
        $timeout(function() {
            $scope.focusComposer(message);
            $scope.listenEditor(message);
        })
    };

    $scope.composerStyle = function(message) {
        var index = $scope.messages.indexOf(message);
        var reverseIndex = $scope.messages.length - index;
        var marginRight = 10; // px
        var widthComposer = 480; // px
        var widthWindow = $('#main').width();

        if(Math.ceil(widthWindow / $scope.messages.length) > (widthComposer + marginRight)) {
            right = (index * (widthComposer + marginRight)) + marginRight;
        } else {
            widthWindow -= 10; // margin left
            var overlap = (((widthComposer * $scope.messages.length) - widthWindow) / ($scope.messages.length - 1));
            right = index * (widthComposer - overlap);
        }

        if(reverseIndex === $scope.messages.length) {
            right = marginRight;
            index = $scope.messages.length;
        }

        return {
            'z-index': message.zIndex,
            'right': right + 'px'
        };
    };

    $scope.completedSignature = function(message) {
        if (!message.MessageBody) {
            $scope.user.$promise.then(function() {
                message.RawMessageBody = "<br><br>" + $scope.user.Signature;
            });
        }
    };

    $scope.clearTextBody = function(message) {
        message.RawMessageBody = message.clearTextBody();
    };

    $scope.initForm = function(message) {
        var index = $scope.messages.indexOf(message);

        $timeout(function() {
            console.log($scope);
            var form = $scope.composeForm['composeForm' + index];


            $scope.$watch(form, function(isPristine) {
                if (!isPristine) {
                    window.onbeforeunload = function() {
                        return "By leaving now, you will lose what you have written in this email. " +
                            "You can save a draft if you want to come back to it later on.";
                    }
                } else {
                    window.onbeforeunload = undefined;
                }
            });
        });
    };

    $scope.focusComposer = function(message) {
        if(!!!message.focussed) {
            // calculate z-index
            var index = $scope.messages.indexOf(message);
            var reverseIndex = $scope.messages.length - index;

            _.each($scope.messages, function(element, iteratee) {
                if(iteratee > index) {
                    element.zIndex = $scope.messages.length - (iteratee - index);
                } else {
                    element.zIndex = $scope.messages.length;
                }
            });
            // focus correct field
            var composer = $('.composer')[index];

            if(!!!message.RecipientList) {
                $(composer).find('.recipient-list').focus();
            } else if(!!!message.MessageTitle) {
                $(composer).find('.message-title').focus();
            } else {
                message.editor.focus();
            }

            _.each($scope.messages, function(m) {
                m.focussed = false;
            });
            message.focussed = true;
            $scope.$apply();
        }
    };

    $scope.listenEditor = function(message) {
        message.editor.addEventListener('focus', function() {
            $scope.focusComposer(message);
        });
    };

    $scope.selectAddress = function(message) {
        message.FromEmail = $scope.user.addresses[0];
    };

    $scope.selectFile = function(message, files) {
        _.defaults(message, {
            Attachments: []
        });
        message.Attachments.push.apply(
            message.Attachments,
            _.map(files, function(file) {
                return attachments.load(file);
            })
        );
    };

    $scope.removeAttachment = function(message, attachment) {
        var index = message.Attachments.indexOf(attachment);

        if (index >= 0) {
            message.Attachments.splice(index, 1);
        }
    };

    $scope.toggleFields = function(message) {
        message.fields = !message.fields;
    };

    $scope.togglePanel = function(message, panelName) {
        if(!!message.displayPanel) {
            $scope.closePanel(message);
        } else {
            $scope.openPanel(message, panelName);
        }
    };

    $scope.openPanel = function(message, panelName) {
        message.panelName = panelName;
        message.panelUrl = 'templates/partials/' + panelName + '.tpl.html';
        message.displayPanel = true;
    };

    $scope.closePanel = function(message) {
        message.panelName = '';
        message.panelUrl = '';
        message.displayPanel = false;
    };

    $scope.setEncrypt = function(message, params, form) {
        console.log('setEncrypt');
        message.PasswordHint = params.hint;
        $scope.closePanel(message);
    };

    $scope.clearEncrypt = function(message) {
        delete message.PasswordHint;
        $scope.closePanel(message);
    };

    $scope.setExpiration = function(message, params) {
        message.ExpirationTime = params.expiration;
        $scope.closePanel(message);
    };

    $scope.clearExpiration = function(message) {
        delete message.ExpirationTime;
        $scope.closePanel(message);
    };

    $scope.rotateIcon = function(expiration) {
        var deg = Math.round((expiration * 360) / 672);

        $('#clock-icon').css({'transform': 'rotate(' + deg + 'deg)'});
    };

    $scope.send = function(message) {
        var index = $scope.messages.indexOf(message);
        var form = $scope.composeForm['composeForm' + index];
        // get the message meta data
        var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));
        _.defaults(newMessage, {
            RecipientList: '',
            CCList: '',
            BCCList: '',
            MessageTitle: '',
            PasswordHint: '',
            Attachments: []
        });

        if (message.Attachments) {
            newMessage.Attachments = _.map(message.Attachments, function(att) {
                return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
            });
        }

        // encrypt the message body and set 'outsiders' to empty by default
        newMessage.MessageBody = {
            outsiders: ''
        };

        pmcrypto.encryptMessage(message.RawMessageBody, $scope.user.PublicKey).then(function(result) {
            newMessage.MessageBody.self = result;

            // concat all recipients
            emails = newMessage.RecipientList + (newMessage.CCList == '' ? '' : ',' + newMessage.CCList) + (newMessage.BCCList == '' ? '' : ',' + newMessage.BCCList);
            base64 = pmcrypto.encode_base64(emails);

            // new message object
            var userMessage = new Message();
            // get users' publickeys
            networkActivityTracker.track(userMessage.$pubkeys({
                Emails: base64
            }).then(function(result) {
                    // set defaults
                    isOutside = false;
                    mails = emails.split(",");
                    var promises = [];
                    // loop through and overwrite defaults
                    angular.forEach(mails, function(value) {
                        var keys = result.keys[0];
                        // encrypt messagebody with each user's keys
                        promises.push(pmcrypto.encryptMessage(message.RawMessageBody, keys[value]).then(function(result) {
                            newMessage.MessageBody[value] = result;
                        }));

                        if (!isOutside) {
                            if (!value.indexOf('protonmail') < 0) {
                                isOutside = true;
                            }
                        }
                    });
                    // When all promises are done
                    Promise.all(promises).then(function() {
                        // dont encrypt if its going outside
                        if (isOutside) {
                            newMessage.MessageBody['outsiders'] = message.RawMessageBody
                        };
                        newMessage.MessageID = newMessage.MessageID || 0;
                        // send email
                        networkActivityTracker.track(newMessage.$send(null, function(result) {
                            // reset form
                            form.$setPristine();
                            notify('Message Sent');
                            $scope.close(message, false);
                        }, function(error) {
                            $log.error(error);
                        }));
                    });
                },
                function(error) {
                    $log.error(error);
                }
            ));
        })
    };

    $scope.saveDraft = function(message) {
        var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));
        var index = $scope.messages.indexOf(message);
        var form = $scope.composeForm['composeForm' + index];

        _.defaults(newMessage, {
            RecipientList: '',
            CCList: '',
            BCCList: '',
            MessageTitle: '',
            PasswordHint: '',
            Attachments: []
        });

        if (message.Attachments) {
            newMessage.Attachments = _.map(message.Attachments, function(att) {
                return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
            });
        }

        newMessage.MessageBody = {
            outsiders: ''
        };

        pmcrypto.encryptMessage(message.RawMessageBody, $scope.user.PublicKey).then(function(result) {
            newMessage.MessageBody.self = result;

            if (message.MessageID) {
                newMessage.MessageID = message.MessageID;
                newMessage.messageid = message.MessageID; // api fend need messageid parameter in lowercase
                networkActivityTracker.track(newMessage.$updateDraft({
                    MessageID: null
                }, function() {
                    form.$setPristine();
                    notify('Draft updated');
                }));
            } else {
                networkActivityTracker.track(newMessage.$saveDraft(null, function(result) {
                    message.MessageID = parseInt(result.MessageID);
                    form.$setPristine();
                    notify('Draft saved');
                }));
            }
        });
    };

    $scope.toggleMinimize = function(message) {
        if (!!message.minimized) {
            $scope.expand(message);
        } else {
            $scope.minimize(message);
        }
    };

    $scope.minimize = function(message) {
        $scope.saveDraft(message);
        message.minimized = true;
    };

    $scope.expand = function(message) {
        message.minimized = false;
    };

    $scope.close = function(message, save) {
        var index = $scope.messages.indexOf(message);

        if(save === true) {
            $scope.saveDraft(message);
        }

        $scope.messages.splice(index, 1);
    };

    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };

    $scope.setOptionsVisibility = function(status) {
        if (!status && $scope.message.IsEncrypted !== '0' &&
            !this.composeForm.enc_password_conf.$valid) {

            $scope.message.IsEncrypted = '0';
        } else {
            $scope.showOptions = status;
        }
    };

    $scope.$watch("message.IsEncrypted", function(newValue, oldValue) {
        if (oldValue === '0' && newValue === '1') {
            $scope.setOptionsVisibility(true);
        } else {
            $scope.setOptionsVisibility(false);
        }
    });
})

.controller("ViewMessageController", function(
    $log,
    $state,
    $rootScope,
    $scope,
    $templateCache,
    $compile,
    $timeout,
    localStorageService,
    networkActivityTracker,
    message,
    attachments,
    pmcrypto
) {
    $rootScope.pageName = message.MessageTitle;

    $scope.message = message;
    $scope.messageHeadState = "close";
    $scope.showHeaders = false;

    $scope.downloadAttachment = function(attachment) {
        attachments.get(attachment.AttachmentID, attachment.FileName);
    };

    $scope.toggleHead = function() {
        $scope.messageHeadState = $scope.messageHeadState === "close" ? "open" : "close";
    };

    function buildMessage(message, action) {
        var signature = '<br /><br />' + $scope.user.Signature + '<br /><br />';
        var blockquoteStart = '<blockquote>';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + message.MessageTitle + '<br />';
        var time = 'Time (GMT): ' + message.Time + '<br />';
        var from = 'From: ' + message.RecipientList + '<br />';
        var to = 'To: ' + message.Sender + '<br />';
        var cc = 'CC: ' + message.CCList + '<br />';
        var blockquoteEnd = '</blockquote>';

        if(action === 'reply') {
            message.RecipientList = message.Sender;
            message.MessageTitle = 'Re: ' + message.MessageTitle;
        } else if(action === 'reply-all') {
            message.RecipientList = message.Sender
            message.MessageTitle = 'Re: ' + message.MessageTitle;
        } else if (action === 'forward') {
            message.RecipientList = '';
            message.MessageTitle = 'Fw: ' + message.MessageTitle;
        }

        message.MessageBody = signature + blockquoteStart + originalMessage + subject + time + from + to + message.MessageBody + blockquoteEnd;

        return message;
    }

    $scope.reply = function(original) {
        var message = angular.copy(original);
        var builtMessage = buildMessage(message, 'reply');

        $rootScope.$broadcast('loadMessage', builtMessage);
    };

    $scope.replyAll = function(message) {
        var message = angular.copy(original);
        var builtMessage = buildMessage(message, 'reply-all');

        $rootScope.$broadcast('loadMessage', message);
    };

    $scope.forward = function(message) {
        var message = angular.copy(original);
        var builtMessage = buildMessage(message, 'forward');

        $rootScope.$broadcast('loadMessage', message);
    };

    $scope.goToMessageList = function() {
        $state.go("^");
        $rootScope.pageName = $state.current.data.mailbox;
    };

    $scope.moveMessageTo = function(mailbox) {
        networkActivityTracker.track(
            ((mailbox === 'delete') ? message.delete() : message.moveTo(mailbox)).$promise
            .then(function() {
                var i = $scope.messages.indexOf(message);
                if (i >= 0) {
                    $scope.messages.splice(i, 1);
                }
            })
        );
    };

    $scope.toggleHeaders = function() {
        if ($scope.showHeaders) {
            $scope.showHeaders = false;
        } else {
            $scope.messageHeadState = "open";
            $scope.showHeaders = true;
        }
    };

    if (!message.IsRead) {
        message.setReadStatus(true);
    }

    localStorageService.bind($scope, 'messageHeadState', 'messageHeadState');

    if (!_.contains(["close", "open"], $scope.messageHeadState)) {
        $scope.messageHeadState = "close";
    }

    var render = $compile($templateCache.get("templates/partials/messageContent.tpl.html"));
    var iframe = $("#message-body > iframe");

    iframe.each(function(i) {
        // HACK:
        // Apparently, when navigating from a message to one adjacent, there's a time when there
        // seems to be two iframes living in the DOM, so that the iframe array contains two elements.
        // Problem is, the content of the rendered template can only be put at one place in the DOM,
        // so insert it in the each of these two caused it to be put in only the *second* iframe, which
        // was only there temporarily. So when it disappeared, the content of the rendered template
        // disappeared with it. With this, we force it to be put in the first iframe, which seems to
        // be the right one.
        if (i > 0) {
            return;
        }

        var iframeDocument = this.contentWindow.document;

        // HACK: Makes the iframe's content manipulation work in Firefox.
        iframeDocument.open();
        iframeDocument.close();

        try {
            var content = render($scope);
        } catch (err) {
            console.log(err);
        }

        // Put the rendered template's content in the iframe's body
        $(iframeDocument).find("body").empty().append(content);
    });

    // HACK: Lets the iframe render its content before we try to get an accurate height measurement.
    $timeout(function() {
        iframe.height(iframe[0].contentWindow.document.body.scrollHeight + "px");
    }, 16);
});
