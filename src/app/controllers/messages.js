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
    authentication,
    messages,
    messageCount,
    messageCache,
    Message,
    networkActivityTracker,
    CONSTANTS
) {
    var mailbox = $rootScope.pageName = $state.current.data.mailbox;
    $scope.messagesPerPage = $scope.user.NumMessagePerPage;

    $scope.Math = window.Math;
    $scope.CONSTANTS = CONSTANTS;

    var unsubscribe = $rootScope.$on("$stateChangeSuccess", function() {
        $rootScope.pageName = $state.current.data.mailbox;
    });
    $scope.$on("$destroy", unsubscribe);

    $scope.page = parseInt($stateParams.page || "1");

    if ($state.is('secured.search') || $state.is('secured.label')) {
        $scope.messages = messages.Messages;
        $scope.messageCount = messages.Total;
    } else {
        $scope.messages = messages;
        if ($stateParams.filter) {
            $scope.messageCount = messageCount[$stateParams.filter == 'unread' ? "UnRead" : "Read"];
        } else {
            $scope.messageCount = messageCount.Total;
        }
    }

    $scope.selectedFilter = $stateParams.filter;
    $scope.selectedOrder = $stateParams.sort || "-date";

    messageCache.watchScope($scope, "messages");

    $scope.start = function() {
        return ($scope.page - 1) * $scope.messagesPerPage + 1;
    };

    $scope.end = function() {
        var end;

        end = $scope.start() + $scope.messagesPerPage - 1;

        if (end > $scope.messageCount) {
            end = $scope.messageCount;
        }

        return end;
    };

    $scope.getMessageEncryptionType = function(message) {
        var texts = [
            'Unencrypted Message',
            'End-to-End Encrypted Internal Message',
            'External Message, Stored Encrypted',
            'End-to-End Encrypted for Outside',
            'External Message, Stored Encrypted',
            'Stored Encrypted',
            'End-to-End Encrypted for Outside Reply'
        ];

        return texts[message.IsEncrypted];
    };

    $scope.truncateSubjects = function() {

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

    $scope.toggleStar = function(message) {
        var inStarred = $state.is('secured.starred');
        var index = $scope.messages.indexOf(message);

        networkActivityTracker.track(
            message.toggleStar().then(function(result) {
                if (inStarred) {
                    $scope.messages.splice(index, 1);
                }
            })
        );
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

    $scope.toggleLabel = function(label) {
        if (label.mode === 0 || label.mode === 2) {
            label.mode = 1;
        } else {
            label.mode = 0;
        }
    };

    $scope.openLabels = function(message) {
        var messages = [];
        var labels = authentication.user.labels;
        var messagesLabel = [];

        if (angular.isDefined(message)) {
            messages.push(message);
        } else {
            messages = $scope.selectedMessages();
        }

        _.each(messages, function(message) {
            messagesLabel = messagesLabel.concat(_.map(message.Labels, function(label) {
                return label.LabelName;
            }));
        });

        _.each(labels, function(label) {
            var count = _.filter(messagesLabel, function(m) {
                return m === label.LabelName;
            }).length;

            if (count === messages.length) {
                label.mode = 1;
            } else if (count > 0) {
                label.mode = 2;
            } else {
                label.mode = 0;
            }
        })

        $scope.labels = labels;

        $timeout(function() {
            $('#searchLabels').focus();
        });
    };

    $scope.closeLabels = function() {
        $('[data-toggle="dropdown"]').parent().removeClass('open');
    };

    $scope.saveLabels = function() {
        $scope.applyLabels();
    };

    $scope.applyLabels = function(messages) {
        messages = messages || _.map($scope.selectedMessages(), function(message) { return {id: message.MessageID}; });

        Message.apply({
            messages: messages,
            labels_actions: _.map(_.reject($scope.labels, function(label) {
                return label.mode === 2;
            }), function(label) {
                return {
                    id: label.LabelID,
                    action: label.mode
                };
            }),
            archive: ($scope.alsoArchived)?'1':'0'
        }).$promise.then(function(result) {
            $state.go($state.current, {}, {reload: true}); // force reload page
        }, function(result) {
            $log.error(result);
        });
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
//     pmcw,
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
//             self: pmcw.encryptMessage(message.RawMessageBody, $scope.user.PublicKey),
//             outsiders: ''
//         };

//         // concat all recipients
//         emails = newMessage.RecipientList + (newMessage.CCList == '' ? '' : ',' + newMessage.CCList) + (newMessage.BCCList == '' ? '' : ',' + newMessage.BCCList)
//         base64 = pmcw.encode_base64(emails);

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
//                     newMessage.MessageBody[value] = pmcw.encryptMessage(message.RawMessageBody, result[value]);
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
//             self: pmcw.encryptMessage(message.RawMessageBody, $scope.user.PublicKey),
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
    $q,
    authentication,
    Message,
    localStorageService,
    attachments,
    pmcw,
    networkActivityTracker,
    notify,
    tools,
    CONSTANTS
) {
    $scope.messages = [];
    var promiseComposerStyle;

    $scope.$watch('messages.length', function(newValue, oldValue) {
        if ($scope.messages.length > 0) {
            window.onbeforeunload = function() {
                return "By leaving now, you will lose what you have written in this email. " +
                    "You can save a draft if you want to come back to it later on.";
            }
        } else {
            window.onbeforeunload = undefined;
        }
    });

    $rootScope.$on('newMessage', function() {
        var message = new Message();

        $scope.initMessage(message);
    });

    $rootScope.isiOS = false;
    $rootScope.isiOS = tools.get_browser;

    $rootScope.$on('loadMessage', function(event, message) {
        $scope.initMessage(message);
    });

    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                maxFilesize: CONSTANTS.ATTACHMENT_SIZE_LIMIT,
                maxFiles: CONSTANTS.ATTACHMENT_NUMBER_LIMIT,
                addRemoveLinks: true,
                dictDefaultMessage: 'Drop files here or click to upload',
                url: "/file/post",
                paramName: "file", // The name that will be used to transfer the file
                maxFilesize: 2, // MB
                accept: function(file, done) {
                    if (file.name == "justinbieber.jpg") {
                        done("Naha, you don't.");
                    } else {
                        done();
                    }
                }
            },
            eventHandlers: {
                dragenter: function(event) {
                    // console.log('on dragenter', event);
                },
                dragover: function(event) {
                    // console.log('on dragover', event);
                },
                dragleave: function(event) {
                    // console.log('on dragleave', event);
                },
                drop: function(event) {
                    console.log('on drop', event);
                },
                addedfile: function(file) {
                    console.log('on addedfile', file);
                    $scope.addAttachment(file, message);
                },
                removedfile: function(file) {
                    console.log('on removedfile', file);
                    $scope.removeAttachment(file, message);
                }
            }
        };
    };

    $scope.getAttachmentsSize = function(message) {
        var size = 0;

        angular.forEach(message.Attachments, function(attachment) {
            if (angular.isDefined(attachment.FileSize)) {
                size += parseInt(attachment.FileSize);
            }
        });

        return size;
    };

    $scope.addAttachment = function(file, message) {
        var totalSize = $scope.getAttachmentsSize(message);
        var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

        _.defaults(message, {
            Attachments: []
        });

        if (angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
            notify('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
            // TODO remove file in droparea
            return;
        }

        totalSize += file.size;

        if (totalSize < (sizeLimit * 1024 * 1024)) {
            attachments.load(file)
            .then(function(packets) {
                attachments.upload(packets);
            })
            .catch(function(result) {
                notify(result);
                $log.error(result)
            });
        } else {
            // Attachment size error.
            notify('Attachments are limited to ' + sizeLimit + ' MB.<br>Total attached would be: ' + totalSize + '.');
            // TODO remove file in droparea
            return;
        }
    };

    $scope.removeAttachment = function(file, message) {
        // TODO
    };

    $scope.initMessage = function(message) {
        if($scope.messages.length === CONSTANTS.MAX_NUMBER_COMPOSER) {
            notify('Maximum composer reached');
            return;
        }
        $scope.messages.unshift(message);
        $scope.completedSignature(message);
        $scope.selectAddress(message);

        $timeout(function() {
            $scope.focusComposer(message);
            $scope.listenEditor(message);
            $scope.initAutoSave(message);
            $scope.clearTextBody(message);
        });
    };

    $scope.initAutoSave = function(message) {
        message.startAutoSave();
    };

    $scope.composerStyle = function(message) {
        var index = $scope.messages.indexOf(message);
        var reverseIndex = $scope.messages.length - index;
        var styles = {};
        var widthWindow = $('#main').width();

        if (tools.findBootstrapEnvironment() === 'xs') {
            var marginTop = 20; // px
            var top = reverseIndex * 40 + marginTop;

            styles.top = top + 'px';
        } else {
            var marginRight = 10; // px
            var widthComposer = 480; // px

            if (Math.ceil(widthWindow / $scope.messages.length) > (widthComposer + marginRight)) {
                right = (index * (widthComposer + marginRight)) + marginRight;
            } else {
                widthWindow -= 10; // margin left
                var overlap = (((widthComposer * $scope.messages.length) - widthWindow) / ($scope.messages.length - 1));
                right = index * (widthComposer - overlap);
            }

            if (reverseIndex === $scope.messages.length) {
                right = marginRight;
                index = $scope.messages.length;
            }

            styles.right = right + 'px';
        }

        styles['z-index'] = message.zIndex

        return styles;
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

    $scope.focusComposer = function(message) {
        if (!!!message.focussed) {
            // calculate z-index
            var index = $scope.messages.indexOf(message);
            var reverseIndex = $scope.messages.length - index;

            _.each($scope.messages, function(element, iteratee) {
                if (iteratee > index) {
                    element.zIndex = $scope.messages.length - (iteratee - index);
                } else {
                    element.zIndex = $scope.messages.length;
                }
            });
            // focus correct field
            var composer = $('.composer')[index];

            if (!!!message.RecipientList) {
                $(composer).find('.recipient-list').focus();
            } else if (!!!message.MessageTitle) {
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

    $scope.toggleFields = function(message) {
        message.fields = !message.fields;
    };

    $scope.togglePanel = function(message, panelName) {
        message.displayPanel = !!!message.displayPanel;
        message.panelName = panelName;
    };

    $scope.openPanel = function(message, panelName) {
        message.displayPanel = true;
        message.panelName = panelName;
    };

    $scope.closePanel = function(message) {
        message.displayPanel = false;
        message.panelName = '';
    };

    $scope.setEncrypt = function(message, params, form) {
        if (params.password.length === 0) {
            notify('Please enter a password for this email.');
            return false;
        }

        if (params.password != params.confirm) {
            notify('Message passwords do not match.');
            return false;
        }

        message.IsEncrypted = 1;
        message.Password = params.password;
        message.PasswordHint = params.hint;
        $scope.closePanel(message);
    };

    $scope.clearEncrypt = function(message) {
        delete message.PasswordHint;
        message.IsEncrypted = 0;
        $scope.closePanel(message);
    };

    $scope.setExpiration = function(message, params) {
        console.log('setExpiration', params.expiration);
        if (parseInt(params.expiration) > CONSTANTS.MAX_EXPIRATION_TIME) {
            notify('The maximum expiration is 4 weeks.');
            return false;
        }

        if (isNaN(params.expiration)) {
            notify('Invalid expiration time.');
            return false;
        }

        if (parseInt(params.expiration) > 0 && message.IsEncrypted !== 1) {
            notify('Expiration times can only be set on fully encrypted messages. Please set a password for your non-ProtonMail recipients.');
            message.panelName = 'encrypt'; // switch panel
            return false;
        }

        message.ExpirationTime = params.expiration;
        $scope.closePanel(message);
    };

    $scope.clearExpiration = function(message) {
        delete message.ExpirationTime;
        $scope.closePanel(message);
    };

    $scope.rotateIcon = function(expiration) {
        var deg = Math.round((expiration * 360) / 672);

        $('#clock-icon').css({
            'transform': 'rotate(' + deg + 'deg)'
        });
    };

    var generateReplyToken = function() {
        // Use a base64-encoded AES256 session key as the reply token
        return pmcw.encode_base64(pmcw.generateKeyAES());
    };

    $scope.send = function(message) {
        if (message.validate()) {
            var index = $scope.messages.indexOf(message);
            // get the message meta data
            var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint', 'IsEncrypted'));

            _.defaults(newMessage, {
                RecipientList: '',
                CCList: '',
                BCCList: '',
                MessageTitle: '',
                PasswordHint: '',
                Attachments: [],
                IsEncrypted: 0
            });

            if (message.Attachments) {
                newMessage.Attachments = _.map(message.Attachments, function(att) {
                    return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
                });
            }

            newMessage.RecipientList = tools.changeSeparatorToComma(newMessage.RecipientList);
            newMessage.CCList = tools.changeSeparatorToComma(newMessage.CCList);
            newMessage.BCCList = tools.changeSeparatorToComma(newMessage.BCCList);

            // encrypt the message body
            pmcw.encryptMessage(message.RawMessageBody, $scope.user.PublicKey).then(function(result) {
                // set 'outsiders' to empty by default
                newMessage.MessageBody = {
                    outsiders: '',
                    self: result
                };

                // concat all recipients
                var emails = newMessage.RecipientList + (newMessage.CCList == '' ? '' : ',' + newMessage.CCList) + (newMessage.BCCList == '' ? '' : ',' + newMessage.BCCList);
                var base64 = pmcw.encode_base64(emails);

                // new message object
                var userMessage = new Message();

                // get users' publickeys
                networkActivityTracker.track(userMessage.$pubkeys({
                    Emails: base64
                }).then(function(result) {
                        // set defaults
                        var isOutside = false;
                        emails = emails.split(",");
                        var promises = [];
                        // loop through and overwrite defaults
                        angular.forEach(emails, function(email) {
                            var publickeys = result.keys;
                            var publickey;
                            var index = _.findIndex(publickeys, function(k, i) {
                                if (!_.isUndefined(k[email])) {
                                    return true;
                                }
                            });

                            if (index !== -1) {
                                publickey = publickeys[index][email];
                                // encrypt messagebody with each user's keys
                                promises.push(pmcw.encryptMessage(message.RawMessageBody, publickey).then(function(result) {
                                    newMessage.MessageBody[email] = result;
                                }));
                            } else if(email !== '') {
                                if (!isOutside && newMessage.IsEncrypted === 0) {
                                    if (!tools.isEmailAddressPM(email)) {
                                        isOutside = true;
                                    }
                                }
                            }
                        });

                        var outsidePromise;

                        if (message.IsEncrypted === 1) {
                            var replyToken = generateReplyToken();
                            var encryptedReplyToken = pmcw.encryptMessage(replyToken, [], message.Password);
                            // Encrypt attachment session keys for new recipient. Nothing is done with this on the back-end yet
                            var arr = [];

                            // TODO
                            // sessionKeys.forEach(function(element) {
                            //   arr.push(pmcw.encryptSessionKey(pmcw.binaryStringToArray(pmcw.decode_base64(element.key)), element.algo, [], $('#outsidePw').val()).then(function (keyPacket) {
                            //     return {
                            //       id: element.id,
                            //       keypacket: pmcw.encode_base64(pmcw.arrayToBinaryString(keyPacket))
                            //     };
                            //   }));
                            // });

                            var encryptedSessionKeys = Promise.all(arr);
                            var outsideBody = pmcw.encryptMessage(message.RawMessageBody, [], message.Password);
                            outsidePromise = outsideBody.then(function(result) {
                                return Promise.all([encryptedReplyToken, encryptedSessionKeys]).then(function(encArray) {
                                    newMessage.MessageBody['outsiders'] = result;
                                    // TODO token and session keys
                                    // return [email, message, replyToken].concat(encArray);
                                });
                            }, function(error) {
                                $log.error(error);
                            });

                        } else if(isOutside && newMessage.IsEncrypted === 0) {
                            // dont encrypt if its going outside
                            outsidePromise = new Promise(function(resolve, reject) {
                                resolve(function() {
                                    newMessage.MessageBody['outsiders'] = message.RawMessageBody;
                                });
                            });
                        }

                        promises.push(outsidePromise);

                        newMessage.MessageID = newMessage.MessageID || 0;

                        // When all promises are done
                        Promise.all(promises).then(function() {
                            // send email
                            networkActivityTracker.track(newMessage.$send(null, function(result) {
                                notify('Message Sent');
                                $scope.close(message, false);
                                $state.go($state.current, {}, {reload: true}); // force reload page
                            }, function(error) {
                                $log.error(error);
                            }));
                        });
                    },
                    function(error) {
                        $log.error(error);
                    }
                ));
            });
        }
    };

    $scope.toggleMinimize = function(message) {
        if (!!message.minimized) {
            $scope.expand(message);
        } else {
            $scope.minimize(message);
        }
    };

    $scope.minimize = function(message) {
        message.save();
        message.minimized = true;
        message.stopAutoSave();
    };

    $scope.expand = function(message) {
        message.minimized = false;
        message.startAutoSave();
    };

    $scope.close = function(message, save) {
        var index = $scope.messages.indexOf(message);

        if (save === true) {
            message.save();
        }

        $scope.messages.splice(index, 1);
    };

    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };
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
    Message,
    message,
    tools,
    attachments,
    pmcw,
    CONSTANTS
) {
    $scope.message = message;
    $rootScope.pageName = message.MessageTitle;
    $scope.tools = tools;

    $scope.downloadAttachment = function(attachment) {
        attachments.get(attachment.AttachmentID, attachment.FileName);
    };

    $scope.detachLabel = function(label) {
        Message.apply({
            messages: [{id: message.MessageID}],
            labels_actions: [{id: label.LabelID, action: '0'}],
            archive: '0'
        }).$promise.then(function(result) {
            var index = message.Labels.indexOf(label);

            message.Labels.splice(index, 1);
        }, function(result) {
            $log.error(result);
        });
    };

    $scope.saveLabels = function() {
        $scope.applyLabels([{id: message.MessageID}]);
    };

    $scope.sendMessageTo = function(email) {
        var message = new Message();

        _.defaults(message, {
            RecipientList: email,
            CCList: '',
            BCCList: '',
            MessageTitle: '',
            PasswordHint: '',
            Attachments: []
        });

        $rootScope.$broadcast('loadMessage', message);
    };

    // Return Message object to build response or forward
    function buildMessage(action) {
        var base = new Message();
        var signature = '<br /><br />' + $scope.user.Signature + '<br /><br />';
        var blockquoteStart = '<blockquote>';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + base.MessageTitle + '<br />';
        var time = 'Time (GMT): ' + base.Time + '<br />';
        var from = 'From: ' + base.RecipientList + '<br />';
        var to = 'To: ' + base.Sender + '<br />';
        var cc = 'CC: ' + base.CCList + '<br />';
        var blockquoteEnd = '</blockquote>';

        base.MessageBody = signature + blockquoteStart + originalMessage + subject + time + from + to + message.MessageBody + blockquoteEnd;

        if (action === 'reply') {
            base.RecipientList = message.Sender;
            base.MessageTitle = (Message.REPLY_PREFIX.test(message.MessageTitle)) ? message.MessageTitle : "Re: " + message.MessageTitle;
        } else if (action === 'replyall') {
            base.RecipientList = [message.Sender, message.CCList, message.BCCList].join(",");
            base.MessageTitle = (Message.REPLY_PREFIX.test(message.MessageTitle)) ? message.MessageTitle : "Re: " + message.MessageTitle;
        } else if (action === 'forward') {
            base.RecipientList = '';
            base.MessageTitle = (Message.FORWARD_PREFIX.test(message.MessageTitle)) ? message.MessageTitle : "Fw: " + message.MessageTitle;
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
        $rootScope.$broadcast('loadMessage', buildMessage('forward'));
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

    $scope.initPrint = function() {
        message.imagesHidden = false;
        $timeout(function() {
            window.print();
        }, 200);
    };

    $scope.print = function() {
        var url = $state.href('^.print', {
            MessageID: message.MessageID
        });

        window.open(url, '_blank');
    };

    $scope.viewRaw = function() {
        var url = $state.href('^.raw', {
            MessageID: message.MessageID
        });

        window.open(url, '_blank');
    };

    $scope.togglePlainHtml = function() {
        if (message.viewMode === 'plain') {
            message.viewMode = 'html';
        } else {
            message.viewMode = 'plain';
        }
    };

    $scope.sizeAttachments = function() {
        var size = 0;

        angular.forEach(message.AttachmentIDList, function(attachment) {
            if (angular.isDefined(attachment.FileSize)) {
                size += parseInt(attachment.FileSize);
            }
        });

        return size;
    };

    if (!message.IsRead) {
        message.setReadStatus(true);
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
        $(iframeDocument).find('html').css('overflowY', 'hidden');
        $(iframeDocument).find('html').css('overflowX', 'auto');
    });

    // HACK: Lets the iframe render its content before we try to get an accurate height measurement.
    $timeout(function() {
        iframe.height(iframe[0].contentWindow.document.body.scrollHeight + "px");
    }, 16);
});
