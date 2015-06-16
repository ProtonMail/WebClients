angular.module("proton.controllers.Messages", [
    "proton.routes",
    "proton.constants"
])

.controller("MessageListController", function(
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $filter,
    CONSTANTS,
    Message,
    Label,
    authentication,
    messageCache,
    messages,
    networkActivityTracker,
    notify
) {
    var mailbox = $rootScope.pageName = $state.current.data.mailbox;

    $scope.messagesPerPage = $scope.user.NumMessagePerPage;
    $scope.labels = authentication.user.Labels;
    $scope.Math = window.Math;
    $scope.CONSTANTS = CONSTANTS;
    $scope.page = parseInt($stateParams.page || "1");
    $scope.messages = messages;
    $scope.messageCount = $rootScope.Total;
    $scope.messagesSelected = [];

    $timeout(function() {
        $scope.unselectAllMessages();
    });

    // TODO this is just for temporary until API works
    $scope.randLocation = function() {
        return Math.floor((Math.random()*6)+1);
    };
    // END TODO

    $scope.showTo = function(message) {
        return (
            $scope.senderIsMe(message) &&
            (
                !$filter('isState')('secured.inbox') &&
                !$filter('isState')('secured.spam')  &&
                !$filter('isState')('secured.trash')
            )
        ) ? true : false;
    };

    $scope.showFrom = function(message) {
        return ((
                !$filter('isState')('secured.inbox') &&
                !$filter('isState')('secured.drafts')  &&
                !$filter('isState')('secured.sent') &&
                !$filter('isState')('secured.spam') &&
                !$filter('isState')('secured.trash')
            )
        ) ? true : false;
    };

    $scope.senderIsMe = function(message) {
        var result = false;
        for( var i = 0, len = $scope.user.Addresses.length; i < len; i++ ) {
            if( $scope.user.Addresses[i].Email === message.SenderAddress ) {
                result = true;
            }
        }
        return result;
    };

    var unsubscribe = $rootScope.$on("$stateChangeSuccess", function() {
        $rootScope.pageName = $state.current.data.mailbox;
    });

    $scope.$on("$destroy", unsubscribe);

    $scope.draggableOptions = {
        cursorAt: {left: 0, top: 0},
        cursor: "move",
        helper: function(event) {
            return $('<span class="well well-sm draggable" id="draggableMailsHelper"><i class="fa fa-envelope-o"></i> <strong><b></b> Mails</strong></span>');
        },
        containment: "document"
    };

    $scope.getLabel = function(id) {
        return _.where($scope.labels, {ID: id})[0];
    };

    $scope.onSelectMessage = function(event, message) {
        $scope.messagesSelected = $scope.selectedMessages();

        if (event.shiftKey) {
            var start = $scope.messages.indexOf(_.first($scope.messagesSelected));
            var end = $scope.messages.indexOf(_.last($scope.messagesSelected));

            for (var i = start; i < end; i++) {
                $scope.messages[i].Selected = true;
            }
            $scope.messagesSelected = $scope.selectedMessages();
        }
    };

    $scope.onStartDragging = function(event, ui, message) {
        setTimeout( function() {
            $('#draggableMailsHelper strong b').text($scope.selectedMessages().length);
        }, 20);
        $('body').addClass('dragging');
        $('#main').append('<div id="dragOverlay"></div>');
        if(message && !!!message.Selected) {
            message.Selected = true;
            $scope.$apply();
        }
        $scope.messagesSelected = $scope.selectedMessages();
    };

    $scope.onEndDragging = function(event, ui, message) {
        $('body').removeClass('dragging');
        $('#dragOverlay').fadeOut(200, function() {
            $(this).remove();
        });
    };

    $scope.selectedFilter = $stateParams.filter;
    $scope.selectedOrder = $stateParams.sort || "-date";

    messageCache.watchScope($scope, "messages");

    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };

    $scope.pageChanged = function() {
        $log.log('Page changed to: ' + $scope.currentPage);
    };

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
                Message.get({id: message.ID}).$promise.then(function(m) {
                    m.decryptBody(m.Body, m.Time).then(function(body) {
                        m.Body = body;
                        $rootScope.$broadcast('loadMessage', m);
                    });
                });
            } else {
                $state.go("secured." + mailbox + ".message", {
                    id: message.ID
                });
            }
        }
    };

    $rootScope.$on('starMessages', function(event) {
        $scope.messagesSelected = $scope.selectedMessages();
        var ids = $scope.selectedIds();
        var promise;

        _.each($scope.messagesSelected, function(message) { message.Starred = 1; });
        promise = Message.star({IDs: ids}).$promise;
        networkActivityTracker.track(promise);
        $scope.unselectAllMessages();
    });

    $scope.toggleStar = function(message) {
        var inStarred = $state.is('secured.starred');
        var index = $scope.messages.indexOf(message);
        var ids = [];
        var promise;

        if(angular.isDefined(message)) {
            ids.push(message.ID);
        }

        if(message.Starred === 1) {
            promise = Message.unstar({IDs: ids}).$promise;
            message.Starred = 0;

            if (inStarred) {
                $scope.messages.splice(index, 1);
            }
        } else {
            promise = Message.star({IDs: ids}).$promise;
            message.Starred = 1;
        }

        networkActivityTracker.track(promise);
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.messages.length > 0) {
            _.forEach($scope.messages, function(message) {
                if (!!!message.Selected) {
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
            message.Selected = status;
        }, this);
        $scope.messagesSelected = $scope.selectedMessages();
    };

    $rootScope.$on('goToFolder', function(event) {
        $scope.unselectAllMessages();
    });

    $scope.unselectAllMessages = function() {
        _.forEach($scope.messages, function(message) {
            message.Selected = false;
        }, this);
    };

    $scope.selectedMessages = function() {
        return _.select($scope.messages, function(message) {
            return message.Selected === true;
        });
    };

    $scope.selectedIds = function() {
        return _.map($scope.messagesSelected, function(message) { return message.ID; });
    };

    $scope.selectedMessagesWithReadStatus = function(bool) {
        return _.select($scope.messagesSelected, function(message) {
            return message.IsRead === +bool;
        });
    };

    $scope.messagesCanBeMovedTo = function(otherMailbox) {
        if (otherMailbox === "inbox") {
            return _.contains(["spam", "trash"], mailbox);
        } else if (otherMailbox === "trash") {
            return _.contains(["inbox", "drafts", "spam", "sent", "starred"], mailbox);
        } else if (otherMailbox === "spam") {
            return _.contains(["inbox", "starred", "trash"], mailbox);
        } else if (otherMailbox === "drafts") {
            return _.contains(["trash"], mailbox);
        }
    };

    $scope.setMessagesReadStatus = function(status) {
        var messages = $scope.selectedMessagesWithReadStatus(!status);
        var promise;
        var ids = _.map(messages, function(message) { return message.ID; });

        if(status) {
            promise = Message.read({IDs: ids}).$promise;
        } else {
            promise = Message.unread({IDs: ids}).$promise;
        }

        _.each(messages, function(message) {
            message.IsRead = +status;
        });

        promise.then(function() {
            $rootScope.$broadcast('updateCounters');
        });

        $scope.unselectAllMessages();

        networkActivityTracker.track(promise);
    };
    $scope.$on('moveMessagesTo', function(event, name) {
        $scope.moveMessagesTo(name);
    });

    $scope.moveMessagesTo = function(mailbox) {
        var ids = $scope.selectedIds();
        var promise;
        var inDelete = mailbox === 'delete';


        if(inDelete) {
            promise = Message.delete({IDs: ids}).$promise;
        } else {
            promise = Message[mailbox]({IDs: ids}).$promise;
        }

        promise.then(function(result) {
            $rootScope.$broadcast('updateCounters');

            if(inDelete) {
                if(ids.length > 1) {
                    notify($translate.instant('MESSAGES_DELETED'));
                } else {
                    notify($translate.instant('MESSAGE_DELETED'));
                }
            } else {
                if(ids.length > 1) {
                    notify($translate.instant('MESSAGES_MOVED'));
                } else {
                    notify($translate.instant('MESSAGE_MOVED'));
                }
            }
        });

        if(!$state.is('secured.label')) {
            $scope.messages = _.difference($scope.messages, $scope.messagesSelected);
        }

        $scope.unselectAllMessages();

        networkActivityTracker.track(promise);
    };

    $scope.filterBy = function(status) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: status,
            page: undefined
        }));
    };

    $scope.clearFilter = function() {
        $state.go($state.current.name, _.extend({}, $state.params, {
            filter: undefined,
            page: undefined
        }));
    };

    $scope.orderBy = function(criterion) {
        $state.go($state.current.name, _.extend({}, $state.params, {
            sort: criterion === '-date' ? undefined : criterion,
            page: undefined
        }));
    };

    $scope.selectedLabels = function() {
        return _.select($scope.labels, function(label) {
            return label.Selected === true;
        });
    };

    $scope.unselectAllLabels = function() {
        _.forEach($scope.labels, function(label) {
            label.Selected = false;
        }, this);
    };

    $scope.openLabels = function(message) {
        var messages = [];
        var messagesLabel = [];
        var labels = $scope.labels;

        if (angular.isDefined(message)) {
            messages.push(message);
        } else {
            messages = $scope.messagesSelected;
        }

        _.each(messages, function(message) {
            messagesLabel = messagesLabel.concat(_.map(message.LabelIDs, function(id) {
                return id;
            }));
        });

        _.each(labels, function(label) {
            var count = _.filter(messagesLabel, function(m) {
                return m === label.ID;
            }).length;

            label.Selected = count > 0;
        });

        $timeout(function() {
            $('#searchLabels').focus();
        });
    };

    $scope.closeLabels = function() {
        $scope.unselectAllLabels();
        $('[data-toggle="dropdown"]').parent().removeClass('open');
    };

    $scope.saveLabels = function() {
        var deferred = $q.defer();
        var messageIDs = $scope.selectedIds();
        var toApply = _.map(_.where($scope.labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where($scope.labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        $q.all(promises).then(function() {
            _.each($scope.messagesSelected, function(message) {
                message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
            });
            $scope.closeLabels();
            $scope.unselectAllMessages();
            notify($translate.instant('LABELS_APPLY'));
            deferred.resolve();
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    $rootScope.$on('applyLabels', function(event, LabelID) {
        var messageIDs = _.map($scope.messagesSelected, function(message) { return message.ID; });

        Label.apply({
            id: LabelID,
            MessageIDs: messageIDs
        }).then(function(result) {
            notify($translate.instant('LABEL_APPLY'));
        });
    });

    $scope.goToPage = function(page) {
        if (page > 0 && $scope.messageCount > ((page - 1) * $scope.messagesPerPage)) {
            if (page === 1) {
                page = undefined;
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

.controller("ComposeMessageController", function(
    $rootScope,
    $scope,
    $log,
    $timeout,
    $q,
    $translate,
    authentication,
    Message,
    localStorageService,
    attachments,
    pmcw,
    networkActivityTracker,
    notify,
    tools,
    CONSTANTS,
    Contact,
    User
) {
    Contact.index.updateWith($scope.user.Contacts);
    $scope.messages = [];
    var promiseComposerStyle;

    $scope.$watch('messages.length', function(newValue, oldValue) {
        if ($scope.messages.length > 0) {
            window.onbeforeunload = function() {
                return "By leaving now, you will lose what you have written in this email. " +
                    "You can save a draft if you want to come back to it later on.";
            };
        } else {
            window.onbeforeunload = undefined;
        }
    });

    $rootScope.$on('onDrag', function() {
        _.each($scope.messages, function(message) {
            $scope.togglePanel(message, 'attachments');
        });
    });

    $rootScope.$on('newMessage', function() {
        var message = new Message();

        $scope.initMessage(message);
    });

    $rootScope.$on('loadMessage', function(event, message) {
        message = new Message(_.pick(message, 'ID', 'Subject', 'Body', 'ToList', 'CCList', 'BCCList'));
        $scope.initMessage(message);
    });

    $scope.setDefaults = function(message) {
        _.defaults(message, {
            ToList: [],
            CCList: [],
            BCCList: [],
            Subject: '',
            PasswordHint: '',
            Attachments: [],
            IsEncrypted: 0,
            Body: message.Body
        });
    };

    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                maxFilesize: CONSTANTS.ATTACHMENT_SIZE_LIMIT,
                maxFiles: CONSTANTS.ATTACHMENT_NUMBER_LIMIT,
                addRemoveLinks: true,
                dictDefaultMessage: 'Drop files here or click to upload',
                url: "/file/post",
                paramName: "file", // The name that will be used to transfer the file
                accept: function(file, done) {

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
                    // console.log('on drop', event);
                },
                addedfile: function(file) {
                    if(angular.isUndefined(message.ID)) {
                        $scope.save(message, false, false).then(function() {
                            $scope.addAttachment(file, message);
                        });
                    } else {
                        $scope.addAttachment(file, message);
                    }
                },
                removedfile: function(file) {
                    // console.log('on removedfile', file);
                    $scope.removeAttachment(file, message);
                }
            }
        };
    };

    $scope.getAttachmentsSize = function(message) {
        var size = 0;

        angular.forEach(message.Attachments, function(attachment) {
            if (angular.isDefined(attachment.Size)) {
                size += parseInt(attachment.Size);
            }
        });

        return size;
    };

    $scope.addAttachment = function(file, message) {
        var totalSize = $scope.getAttachmentsSize(message);
        var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

        message.uploading = true;

        _.defaults(message, { Attachments: [] });

        if (angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
            notify('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
            // TODO remove file in droparea
            return;
        }

        totalSize += file.size;
        var attachmentPromise;

        if (totalSize < (sizeLimit * 1024 * 1024)) {
            attachmentPromise = attachments.load(file).then(function(packets) {
                return attachments.upload(packets, message.ID).then(
                    function(result) {
                        message.Attachments.push(result);
                        message.uploading = false;
                    }
                );
            });

            message.track(attachmentPromise);
        } else {
            // Attachment size error.
            notify('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + totalSize + '.');
            // TODO remove file in droparea
            return;
        }
    };

    $scope.removeAttachment = function(file, message) {
        // TODO
        attachments.removeAttachment();
    };

    $scope.initMessage = function(message) {
        if($scope.messages.length === CONSTANTS.MAX_NUMBER_COMPOSER) {
            notify($translate.instant('MAXIMUM_COMPOSER_REACHED'));
            return;
        }

        $scope.messages.unshift(message);
        $scope.setDefaults(message);

        if (angular.isUndefined(message.Body)) {
            // this sets the Body with the signature
            $scope.completedSignature(message);
        }

        // sanitation
        message.Body = DOMPurify.sanitize(message.Body, {
            FORBID_TAGS: ['style']
        });
        $scope.selectAddress(message);

        $timeout(function() {
            $scope.listenEditor(message);
            $scope.focusComposer(message);
            $scope.saveOld();
        });
    };

    $scope.composerStyle = function(message) {

        var index = $scope.messages.indexOf(message);
        var reverseIndex = $scope.messages.length - index;
        var styles = {};
        var widthWindow = $('#main').width();
        var composerHeight = $('.composer-header').outerHeight();

        if (tools.findBootstrapEnvironment() === 'xs') {
            var marginTop = 80; // px
            var top = marginTop;

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

        styles['z-index'] = message.zIndex;

        return styles;

    };

    $scope.completedSignature = function(message) {
        message.Body = "<br><br>" + authentication.user.Signature;
    };

    $scope.composerIsSelected = function(message) {
        return $scope.selected === message;
    };

    $scope.focusComposer = function(message) {
        $scope.selected = message;
        if (!!!message.focussed) {

            // calculate z-index
            var index = $scope.messages.indexOf(message);
            var reverseIndex = $scope.messages.length - index;

            if (tools.findBootstrapEnvironment() === 'xs') {

                _.each($scope.messages, function(element, iteratee) {
                    if (iteratee > index) {
                        element.zIndex = ($scope.messages.length + (iteratee - index))*10;
                    } else {
                        element.zIndex = ($scope.messages.length)*10;
                    }
                });

                var bottom = $('.composer').eq($('.composer').length-1);
                var bottomTop = bottom.css('top');
                var bottomZ = bottom.css('zIndex');
                var clicked = $('.composer').eq(index);
                var clickedTop = clicked.css('top');
                var clickedZ = clicked.css('zIndex');

                console.log(bottomTop, bottomZ, clickedTop, clickedZ);

                // todo: swap ???
                bottom.css({
                    top:    clickedTop,
                    zIndex: clickedZ
                });
                clicked.css({
                    top:    bottomTop,
                    zIndex: bottomZ
                });

                console.log(bottomTop, bottomZ, clickedTop, clickedZ);

            }

            else {
                _.each($scope.messages, function(element, iteratee) {
                    if (iteratee > index) {
                        element.zIndex = ($scope.messages.length - (iteratee - index))*10;
                    } else {
                        element.zIndex = ($scope.messages.length)*10;
                    }
                });
            }

            // focus correct field
            var composer = $('.composer')[index];

            if (message.ToList.length === 0) {
                $(composer).find('.to-list')[0].focus();
            } else if (message.Subject.length === 0) {
                $(composer).find('.subject')[0].focus();
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
        message.editor.addEventListener('input', function() {
            $scope.saveLater(message, true); // in silence
        });
    };

    $scope.selectAddress = function(message) {
        message.From = authentication.user.Addresses[0];
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

        if (params.password !== params.confirm) {
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

    $scope.saveOld = function(message) {
        var properties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments'];

        message.old = _.pick(message, properties);

        _.defaults(message.old, {
            ToList: [],
            BCCList: [],
            CCList: [],
            Attachments: [],
            PasswordHint: "",
            Subject: ""
        });
    };

    $scope.saveLater = function(message, silently) {
        if(angular.isDefined(message.timeoutSaving)) {
            $timeout.cancel(message.timeoutSaving);
        }

        message.timeoutSaving = $timeout(function() {
            $scope.save(message, silently);
        }, CONSTANTS.SAVE_TIMEOUT_TIME);
    };

    $scope.save = function(message, silently, force) {
        var deferred = $q.defer();

        if(message.validate(force)) {
            var parameters = {
                Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject')
            };

            if(angular.isDefined(message.ID)) {
                parameters.id = message.ID;
            }

            parameters.Message.AddressID = message.From.ID;
            parameters.Message.IsRead = 1;

            savePromise = message.encryptBody(authentication.user.PublicKey).then(function(result) {
                var draftPromise;

                parameters.Message.Body = result;

                if(angular.isUndefined(message.ID)) {
                    draftPromise = Message.createDraft(parameters).$promise;
                } else {
                    draftPromise = Message.updateDraft(parameters).$promise;
                }

                draftPromise.then(function(result) {
                    message.ID = result.Message.ID;
                    message.BackupDate = new Date();
                    $scope.saveOld(message);
                    deferred.resolve(result);
                });
            });
        } else {
            if(force === true) {
                deferred.reject();
            } else {
                deferred.resolve();
            }
        }

        if(silently !== true) {
            message.track(deferred.promise);
        }

        return deferred.promise;
    };

    $scope.send = function(message) {
        var deferred = $q.defer();

        $scope.save(message, true, true).then(function() {
            var parameters = {};
            var emails = message.emailsToString();

            parameters.id = message.ID;

            message.getPublicKeys(emails).then(function(result) {
                var keys = result;
                var outsiders = false;
                var promises = [];

                parameters.Packages = [];

                _.each(emails, function(email) {
                    if(keys[email].length > 0) { // inside user
                        var key = keys[email];

                        promises.push(message.encryptBody(key).then(function(result) {
                            var body = result;

                            message.encryptPackets(authentication.user.PublicKey).then(function(result) {
                                var keyPackets = result;

                                return parameters.Packages.push({Address: email, Type: 1, Body: body, KeyPackets: keyPackets});
                            });
                        }));
                    } else { // outside user
                        outsiders = true;

                        if(message.IsEncrypted === 1) {
                            // TODO
                            // var replyToken = generateReplyToken();
                            // var encryptedReplyToken = pmcrypto.encryptMessage(replyToken, [], message.Password);

                            promises.push(pmcrypto.encryptMessage(message.Body, [], message.Password).then(function(result) {
                                var body = result;

                                message.encryptPackets(message.Password).then(function(result) {
                                    var keyPackets = result;

                                    return parameters.Packages.push({Address: email, Type: 2, Body: result, KeyPackets: keyPackets, PasswordHint: message.PasswordHint});
                                });
                            }));
                        }
                    }
                });

                if(outsiders === true && message.IsEncrypted === 0) {
                    parameters.AttachmentKeys = [];
                    parameters.ClearBody = message.Body;

                    if(message.Attachments.length > 0) {
                        parameters.AttachmentKeys = message.clearPackets();
                    }
                }

                $q.all(promises).then(function() {
                    Message.send(parameters).$promise.then(function(result) {
                        notify($translate.instant('MESSAGE_SENT'));
                        $scope.close(message, false);
                        deferred.resolve(result);
                    });
                });
            });
        }, function() {
            deferred.reject();
        });

        message.track(deferred.promise);

        return deferred.promise;
    };

    $scope.toggleMinimize = function(message) {
        if (!!message.minimized) {
            $scope.expand(message);
        } else {
            $scope.minimize(message);
        }
    };

    $scope.minimize = function(message) {
        message.minimized = true;
    };

    $scope.blur = function(message) {
        $log.info('blurr');
        message.blur = true;
    };

    $scope.focus = function(message) {
        $log.info('focuss');
        message.blur = false;
    };

    $scope.expand = function(message) {
        message.minimized = false;
    };

    $scope.close = function(message, save) {

        var index = $scope.messages.indexOf(message);

        var messageFocussed = !!message.focussed;

        if (save === true) {
            $scope.save(message, true, false); // silently TODO: this fails sometimes!
        }

        message.close();

        // Remove message in messages
        $scope.messages.splice(index, 1);

        // Message closed and focussed?
        if(messageFocussed && $scope.messages.length > 0) {
            // Focus the first message
            $scope.focusComposer(_.first($scope.messages));
        }

    };

    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };
})

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
    $q,
    $sce,
    localStorageService,
    networkActivityTracker,
    notify,
    Message,
    Label,
    message,
    tools,
    attachments,
    pmcw,
    CONSTANTS,
    authentication
) {
    $scope.message = message;
    $rootScope.pageName = message.Subject;
    $scope.tools = tools;
    $scope.isPlain = false;

    $scope.getFrom = function() {
        var result = '';

        if(angular.isDefined(message.SenderName)) {
            result += '<b>' + message.SenderName + '</b> &lt;' + message.SenderAddress + '&gt;';
        } else {
            result += message.SenderAddress;
        }

        return result;
    };

    $scope.displayContent = function() {
        message.clearTextBody().then(function(result) {
            var content = message.clearImageBody(result);

            content = tools.replaceLineBreaks(content);
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

        message.IsRead = 0;
        promise = Message.unread({IDs: [message.ID]}).$promise;
        networkActivityTracker.track(promise);
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

        // decode key packets
        var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

        // get enc attachment
        var att = attachments.get(attachment.ID, attachment.Name);

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
                pmcrypto.decryptMessage(at, key, true, algo).then(
                    function(decryptedAtt) {

                        var blob = new Blob([decryptedAtt.data], {type: attachment.MIMEType});

                        if(navigator.msSaveOrOpenBlob || URL.createObjectURL!==undefined) {
                            // Browser supports a good way to download blobs
                            $scope.$apply(function() {
                                attachment.decrypting = false;
                                attachment.decrypted = true;
                            });

                            var href = URL.createObjectURL(blob);

                            $this = $($event.target);
                            $this.attr('href', href);
                            $this.attr('target', '_blank');

                            deferred.resolve();

                        }
                        else {
                            // Bad blob support, make a data URI, don't click it
                            var reader = new FileReader();

                            reader.onloadend = function () {
                                link.attr('href',reader.result);
                            };

                            reader.readAsDataURL(blob);
                        }

                    }
                );
            },
            function(err) {
                console.log(err);
            }
        );

        // var decryptedAttachment = pmcw.encryptFile(new Uint8Array(reader.result), authentication.user.PublicKey, [], file.name);
        // attachments.get(attachment.ID, attachment.Name);
    };

    $scope.downloadAttachment = function(message, attachment) {
        attachments.get(attachment.ID, attachment.Name);
    };

    $scope.detachLabel = function(id) {
        var promise = Label.remove({id: id, MessageIDs: [message.ID]}).$promise;

        message.LabelIDs = _.without(message.LabelIDs, id);
        networkActivityTracker.track(promise);
    };

    $scope.saveLabels = function() {
        var deferred = $q.defer();
        var messageIDs = [message.ID];
        var toApply = _.map(_.where($scope.labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where($scope.labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        $q.all(promises).then(function() {
            message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
            $scope.closeLabels();
            notify($translate.instant('LABELS_APPLY'));
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
        var signature = '<br /><br />' + $scope.user.Signature + '<br /><br />';
        var blockquoteStart = '<blockquote>';
        var originalMessage = '-------- Original Message --------<br />';
        var subject = 'Subject: ' + message.Subject + '<br />';
        var time = 'Time (GMT): ' + message.Time + '<br />';
        var from = 'From: ' + message.ToList + '<br />';
        var to = 'To: ' + message.Sender + '<br />';
        var cc = 'CC: ' + message.CCList + '<br />';
        var blockquoteEnd = '</blockquote>';

        var re_prefix = $translate.instant('RE:');
        var fw_prefix = $translate.instant('FW:');

        base.Body = signature + blockquoteStart + originalMessage + subject + time + from + to + $scope.content + blockquoteEnd;

        if (action === 'reply') {
            base.ToList = message.Sender;
            base.Subject = (message.Subject.includes(re_prefix)) ? message.Subject :
            re_prefix + ' ' + message.Subject;

        }
        else if (action === 'replyall') {
            base.ToList = [message.Sender, message.CCList, message.BCCList].join(",");
            base.Subject = (message.Subject.includes(re_prefix)) ? message.Subject :
            re_prefix + ' ' + message.Subject;
        }
        else if (action === 'forward') {
            base.ToList = '';
            base.Subject = (message.Subject.includes(fw_prefix)) ? message.Subject :
            fw_prefix + ' ' + message.Subject;
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
        $state.go('^', {}, {reload: true});
    };

    $scope.moveMessageTo = function(mailbox) {
        var promise;
        var inDelete = mailbox === 'delete';

        if(inDelete) {
            promise = Message.delete({IDs: [message.ID]}).$promise;
        } else {
            promise = Message[mailbox]({IDs: [message.ID]}).$promise;
        }

        promise.then(function(result) {
            if(inDelete) {
                $scope.goToMessageList();
                notify($translate.instant('MESSAGE_DELETED'));
            } else {
                notify($translate.instant('MESSAGE_MOVED'));
            }
        });

        networkActivityTracker.track(promise);
    };

    $scope.print = function() {
        var url = $state.href('secured.print', {
            id: message.ID
        });

        window.open(url, '_blank');
    };

    $scope.viewRaw = function() {
        var url = $state.href('secured.raw', {
            id: message.ID
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

        angular.forEach(message.Attachments, function(attachment) {
            if (angular.isDefined(attachment.Size)) {
                size += parseInt(attachment.Size);
            }
        });

        return size;
    };

    if (message.IsRead === 0) {
        message.IsRead = 1;
        Message.read({IDs: [message.ID]});
    }
});
