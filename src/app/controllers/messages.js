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
    // $scope.page = parseInt($stateParams.page || "1");
    $scope.messages = messages;
    $scope.selectedFilter = $stateParams.filter;
    $scope.selectedOrder = $stateParams.sort || "-date";

    $scope.dropdownPages = function() {
        var ddp = [];
        var ddp2 = [];
        var makeRangeCounter = 0;
        for (var i = 0; i <= parseInt($rootScope.Total); i++) {
            ddp[i] = i;
        }
        function makeRange(element, index, array) {
            if (index%25===0) {
                ddp2.push({
                    'value': makeRangeCounter,
                    'label': index + ' - ' + (index+25)
                });
                makeRangeCounter++;
            }
        }
        ddp.forEach(makeRange);
        // console.log(ddp2);
        return ddp2;
    };

    $scope.jason = $scope.dropdownPages();

    // console.log($scope.dropdownPages());

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

    messageCache.watchScope($scope, "messages");

    $timeout(function() {
        $scope.unselectAllMessages();
    });

    $scope.$on('refreshMessages', function(event, silently) {
        $scope.refreshMessages(silently);
    });

    $scope.messageCount = function() {
        return $rootScope.Total;
    };

    $scope.getMessagesParameters = function(mailbox) {
        var params = {};

        params.Location = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
        params.Page = ($stateParams.page || 1) - 1;

        if ($stateParams.filter) {
            params.Unread = +($stateParams.filter === 'unread');
        }

        if ($stateParams.sort) {
            var sort = $stateParams.sort;
            var desc = _.string.startsWith(sort, "-");

            if (desc) {
                sort = sort.slice(1);
            }

            params.Sort = _.string.capitalize(sort);
            params.Desc = +desc;
        }

        if (mailbox === 'search') {
            params.Location = $stateParams.location;
            params.Keyword = $stateParams.words;
            params.To = $stateParams.to;
            params.From = $stateParams.from;
            params.Subject = $stateParams.subject;
            params.Begin = $stateParams.begin;
            params.End = $stateParams.end;
            params.Attachments = $stateParams.attachments;
            params.Starred = $stateParams.starred;
            params.Label = $stateParams.label;
        } else if(mailbox === 'label') {
            delete params.Location;
            params.Label = $stateParams.label;
        }

        _.pick(params, _.identity);

        return params;
    };

    $scope.refreshMessages = function(silently) {
        var mailbox = $state.current.name.replace('secured.', '');
        var params = $scope.getMessagesParameters(mailbox);
        var promise = Message.query(params).$promise.then(function(result) {
            $scope.messages = result;
        });

        if(!!!silently) {
            networkActivityTracker.track(promise);
        }
    };

    $scope.showTo = function(message) {
        return (
            $scope.senderIsMe(message) &&
            (
                !$state.is('secured.inbox') &&
                !$state.is('secured.drafts')  &&
                !$state.is('secured.sent')  &&
                !$state.is('secured.archive')  &&
                !$state.is('secured.spam')  &&
                !$state.is('secured.trash')
            )
        ) ? true : false;
    };

    $scope.showFrom = function(message) {
        return ((
                !$state.is('secured.inbox') &&
                !$state.is('secured.drafts')  &&
                !$state.is('secured.archive') &&
                !$state.is('secured.sent') &&
                !$state.is('secured.spam') &&
                !$state.is('secured.trash')
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

    $scope.getLabel = function(id) {
        return _.where($scope.labels, {ID: id})[0];
    };

    $scope.onSelectMessage = function(event, message) {
        if (event.shiftKey) {
            var start = $scope.messages.indexOf(_.first($scope.selectedMessages()));
            var end = $scope.messages.indexOf(_.last($scope.selectedMessages()));

            for (var i = start; i < end; i++) {
                $scope.messages[i].Selected = true;
            }
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
    };

    $scope.onEndDragging = function(event, ui, message) {
        $('body').removeClass('dragging');
        $('#dragOverlay').fadeOut(200, function() {
            $(this).remove();
        });
    };

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

        if (end > $scope.messageCount()) {
            end = $scope.messageCount();
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
        return $scope.messageCount() > ($scope.page * $scope.messagesPerPage);
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

    $scope.$on('starMessages', function(event) {
        var ids = $scope.selectedIds();
        var promise;

        _.each($scope.selectedMessages(), function(message) { message.Starred = 1; });
        promise = Message.star({IDs: ids}).$promise;
        networkActivityTracker.track(promise);
        $scope.unselectAllMessages();
    });

    $scope.toggleStar = function(message) {
        var inStarred = $state.is('secured.starred');
        var index = $scope.messages.indexOf(message);
        var ids = [];
        var promise;

        ids.push(message.ID);

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
        });
    };

    $scope.$on('goToFolder', function(event) {
        $scope.unselectAllMessages();
    });

    $scope.unselectAllMessages = function() {
        _.forEach($scope.messages, function(message) {
            message.Selected = false;
        });
    };

    $scope.selectedMessages = function() {
        return _.select($scope.messages, function(message) {
            return message.Selected === true;
        });
    };

    $scope.selectedIds = function() {
        return _.map($scope.selectedMessages(), function(message) { return message.ID; });
    };

    $scope.selectedMessagesWithReadStatus = function(bool) {
        return _.select($scope.selectedMessages(), function(message) {
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
            $rootScope.$broadcast('refreshMessages');

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
            $scope.messages = _.difference($scope.messages, $scope.selectedMessages());
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

    $scope.unselectAllLabels = function() {
        _.forEach($scope.labels, function(label) {
            label.Selected = false;
        });
    };

    $scope.openLabels = function(message) {
        var messages = [];
        var messagesLabel = [];
        var labels = $scope.labels;

        if (angular.isDefined(message)) {
            messages.push(message);
        } else {
            messages = $scope.selectedMessages();
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

    $scope.saveLabels = function(labels) {
        var deferred = $q.defer();
        var messageIDs = $scope.selectedIds();
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        $q.all(promises).then(function() {
            if($state.is('secured.label')) {
                $scope.messages = _.difference($scope.messages, $scope.selectedMessages());
            } else {
                _.each($scope.selectedMessages(), function(message) {
                    message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
                });
                $scope.unselectAllMessages();
            }

            notify($translate.instant('LABELS_APPLY'));
            deferred.resolve();
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    $scope.$on('applyLabels', function(event, LabelID) {
        var messageIDs = _.map($scope.selectedMessages(), function(message) { return message.ID; });

        Label.apply({
            id: LabelID,
            MessageIDs: messageIDs
        }).then(function(result) {
            notify($translate.instant('LABEL_APPLY'));
        });
    });

    $scope.goToPage = function() {
        console.log($scope.page);

        if (page > 0 && $scope.messageCount() > ((page - 1) * $scope.messagesPerPage)) {
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
    $state,
    $translate,
    $interval,
    Attachment,
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

    $scope.$on('onDrag', function() {
        _.each($scope.messages, function(message) {
            $scope.togglePanel(message, 'attachments');
        });
    });

    $scope.$on('newMessage', function() {
        var message = new Message();

        $scope.initMessage(message);
    });

    $scope.$on('loadMessage', function(event, message) {
        message = new Message(_.pick(message, 'ID', 'Subject', 'Body', 'ToList', 'CCList', 'BCCList', 'Attachments', 'Action', 'ParentID'));
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

    $scope.slideDown = function(message) {
        $('#' + message.previews).slideToggle({direction: "down"}, 200);
        message.attachmentsToggle = !!!message.attachmentsToggle;
    };

    $scope.isOver = false;
    var isOver = false;
    var interval;

    $(window).on('dragover', function(e) {
        e.preventDefault();
        $interval.cancel($scope.intervalComposer);

        $scope.intervalComposer = $interval(function() {
            isOver = false;
            $scope.isOver = false;
            $interval.cancel($scope.intervalComposer);
        }, 100);

        if (isOver === false) {
            isOver = true;
            $scope.isOver = true;
        }
    });

    $scope.dropzone = 0;

    $scope.dropzoneConfig = function(message) {
        $scope.dropzone++;
        message.button = 'button' + $scope.dropzone;
        message.previews = 'previews' + $scope.dropzone;

        return {
            options: {
                maxFilesize: CONSTANTS.ATTACHMENT_SIZE_LIMIT,
                maxFiles: CONSTANTS.ATTACHMENT_NUMBER_LIMIT,
                addRemoveLinks: false,
                dictDefaultMessage: 'Drop files here to upload',
                url: "/file/post",
                paramName: "file", // The name that will be used to transfer the file
                previewsContainer: '.previews',
                previewTemplate: '<div class="btn preview-template"><span class="pull-right fa fa-times preview-close" data-dz-remove></span><p class="name preview-name" data-dz-name></p></div>',
                createImageThumbnails: false,
                accept: function(file, done) {
                },
                init: function(event) {
                    var that = this;
                    _.forEach(message.Attachments, function (attachment) {
                        var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };
                        that.options.addedfile.call(that, mockFile);
                    });
                }
            },
            eventHandlers: {
                dragenter: function(event) {
                    // console.log('on dragenter', event);
                },
                dragover: function(event) {
                    $interval.cancel($scope.intervalComposer);
                    // console.log('on dragover', event);
                },
                dragleave: function(event) {
                    // console.log('on dragleave', event);
                },
                drop: function(event) {
                    // console.log('on drop', event);
                    $scope.isOver = false;
                    isOver = false;
                },
                addedfile: function(file) {
                    if(angular.isUndefined(message.ID)) {
                        $scope.save(message, true).then(function() {
                            $scope.addAttachment(file, message);
                        });
                    } else {
                        $scope.addAttachment(file, message);
                    }
                },
                removedfile: function(file) {
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
        var element = $(file.previewElement);

        if (totalSize < (sizeLimit * 1024 * 1024)) {
            attachmentPromise = attachments.load(file).then(function(packets) {
                return attachments.upload(packets, message.ID, element).then(
                    function(result) {
                        message.Attachments.push(result);
                        message.uploading = false;
                    }
                );
            });
        } else {
            // Attachment size error.
            notify('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + totalSize + '.');
            // TODO remove file in droparea
            return;
        }
    };

    $scope.removeAttachment = function(file, message) {
        var fileID = (file.ID) ? file.ID : file.previewElement.id;
        var attachment = _.findWhere(message.Attachments, {AttachmentID: fileID});
        message.Attachments = _.filter(message.Attachments, function(a) {return a.AttachmentID !== fileID;});
            // message.Attachments = [];
        Attachment.remove({
            "MessageID": message.ID,
            "AttachmentID": fileID
        }).$promise.then(function(response) {
            if (response.Error) {
                notify(response.Error);
                message.Attachments.push(attachment);
                var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };
                that.options.addedfile.call(that, mockFile);
            }
        });
    };

    $scope.initMessage = function(message) {
        if($scope.messages.length === CONSTANTS.MAX_NUMBER_COMPOSER) {
            notify($translate.instant('MAXIMUM_COMPOSER_REACHED'));
            return;
        }

        $scope.messages.unshift(message);
        $scope.setDefaults(message);
        $scope.selectAddress(message);

        $timeout(function() {
            $scope.focusComposer(message);
            $scope.saveOld();
        }, 100);

        $timeout(function() {
            $scope.listenEditor(message);
            if (angular.isUndefined(message.Body)) {
                // this sets the Body with the signature
                $scope.completedSignature(message);
            }

            // sanitation
            message.Body = DOMPurify.sanitize(message.Body, {
                FORBID_TAGS: ['style']
            });
            resizeComposer();
        }, 500);
    };

    $scope.composerStyle = function(message) {

        var index = $scope.messages.indexOf(message);
        var reverseIndex = $scope.messages.length - index;
        var styles = {};
        var widthWindow = $('#main').width();

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
            // console.log(index);
            var reverseIndex = $scope.messages.length - index;
            // console.log(reverseIndex);

            if (tools.findBootstrapEnvironment() === 'xs') {

                _.each($scope.messages, function(element, iteratee) {
                    if (iteratee > index) {
                        $(element).css('z-index', ($scope.messages.length + (iteratee - index))*10);
                    } else {
                        $(element).css('z-index', ($scope.messages.length)*10);
                    }
                });

                var bottom = $('.composer').eq($('.composer').length-1);
                var bottomTop = bottom.css('top');
                var bottomZ = bottom.css('zIndex');
                var clicked = $('.composer').eq(index);
                var clickedTop = clicked.css('top');
                var clickedZ = clicked.css('zIndex');

                // console.log(bottomTop, bottomZ, clickedTop, clickedZ);

                // todo: swap ???
                bottom.css({
                    top:    clickedTop,
                    zIndex: clickedZ
                });
                clicked.css({
                    top:    bottomTop,
                    zIndex: bottomZ
                });

                // console.log(bottomTop, bottomZ, clickedTop, clickedZ);

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
        if(message.editor) {
            message.editor.addEventListener('focus', function() {
                message.fields = false;
                message.toUnfocussed = true;
                $scope.$apply();
                $timeout(function() {
                    message.height();
                    $('.typeahead-container').scrollTop(0);
                    $scope.focusComposer(message);
                });
            });
            message.editor.addEventListener('input', function() {
                $scope.saveLater(message);
            });
        }
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

        message.ExpirationTime = parseInt((new Date().getTime() / 1000).toFixed(0)) + params.expiration * 3600; // seconds
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

    $scope.oldProperties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments', 'ExpirationTime'];

    $scope.saveOld = function(message) {
        message.old = _.pick(message, $scope.oldProperties);

        _.defaults(message.old, {
            ToList: [],
            BCCList: [],
            CCList: [],
            Attachments: [],
            PasswordHint: "",
            Subject: ""
        });
    };

    $scope.needToSave = function(message) {
        if(angular.isDefined(message.old)) {
            var currentMessage = _.pick(message, $scope.oldProperties);
            var oldMessage = _.pick(message.old, $scope.oldProperties);

            return JSON.stringify(oldMessage) !== JSON.stringify(currentMessage);
        } else {
            return true;
        }
    };

    $scope.saveLater = function(message) {
        if(angular.isDefined(message.timeoutSaving)) {
            $timeout.cancel(message.timeoutSaving);
        }

        message.timeoutSaving = $timeout(function() {
            if($scope.needToSave(message)) {
                $scope.save(message, true);
            }
        }, CONSTANTS.SAVE_TIMEOUT_TIME);
    };

    $scope.validate = function(message) {
        // set msgBody input element to editor content
        message.setMsgBody();

        // Check internet connection
        if (window.navigator.onLine !== true && location.hostname !== 'localhost') {
            notify('No internet connection. Please wait and try again.');
            return false;
        }

        // Check if there is an attachment uploading
        if (message.uploading === true) {
            notify('Wait for attachment to finish uploading or cancel upload.');
            return false;
        }

        // Check all emails to make sure they are valid
        var invalidEmails = [];
        var allEmails = _.map(message.ToList.concat(message.CCList).concat(message.BCCList), function(email) { return email.Address.trim(); });

        _.each(allEmails, function(email) {
            if(!tools.validEmail(email)) {
                invalidEmails.push(email);
            }
        });

        if (invalidEmails.length > 0) {
            notify('Invalid email(s): ' + invalidEmails.join(',') + '.');
            return false;
        }

        // MAX 25 to, cc, bcc
        if ((message.ToList.length + message.BCCList.length + message.CCList.length) > 25) {
            notify('The maximum number (25) of Recipients is 25.');
            return false;
        }

        if (message.ToList.length === 0 && message.BCCList.length === 0 && message.CCList.length === 0) {
            notify('Please enter at least one recipient.');
            return false;
        }

        // Check title length
        if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
            notify('The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.');
            return false;
        }

        // Check body length
        if (message.Body.length > 16000000) {
            notify('The maximum length of the message body is 16,000,000 characters.');
            return false;
        }

        var emailsNonPM = _.filter(message.ToList.concat(message.CCList).concat(message.BCCList), function(email) {
            return tools.isEmailAddressPM(email.Address) !== true;
        });

        if (parseInt(message.ExpirationTime) > 0 && message.IsEncrypted !== 1 && emailsNonPM.length > 0) {
            notify('Expiration times can only be set on fully encrypted messages. Please set a password for your non-ProtonMail recipients.');
            message.panelName = 'encrypt'; // switch panel
            return false;
        }

        return true;
    };

    $scope.save = function(message, silently) {
        var deferred = $q.defer();
        var parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject')
        };

        if (typeof parameters.Message.ToList === 'string') {
            parameters.Message.ToList = [];
        }

        if(angular.isDefined(message.ParentID)) {
            parameters.ParentID = message.ParentID;
            parameters.Action = message.Action;
        }

        if(angular.isDefined(message.ID)) {
            parameters.id = message.ID;
            parameters.Message.IsRead = 1;
        } else {
            parameters.Message.IsRead = 0;
        }

        parameters.Message.AddressID = message.From.ID;

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

                // Add draft in message list
                if($state.is('secured.drafts')) {
                    $rootScope.$broadcast('refreshMessages');
                }

                deferred.resolve(result);
            });
        });

        if(silently !== true) {
            message.track(deferred.promise);
        }

        return deferred.promise;
    };

    $scope.send = function(message) {
        console.log(message);
        var deferred = $q.defer();
        var validate = $scope.validate(message);

        if(validate) {
            $scope.save(message, false).then(function() {
                var parameters = {};
                var emails = message.emailsToString();

                parameters.id = message.ID;
                parameters.ExpirationTime = message.ExpirationTime;

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


                                var replyToken = message.generateReplyToken();
                                var replyTokenPromise = pmcw.encryptMessage(replyToken, [], message.Password);


                                promises.push(replyTokenPromise.then(function(encryptedToken) {


                                    pmcw.encryptMessage(message.Body, [], message.Password).then(function(result) {


                                        var body = result;

                                        message.encryptPackets('', message.Password).then(function(result) {


                                            var keyPackets = result;

                                            return parameters.Packages.push({Address: email, Type: 2, Body: body, KeyPackets: keyPackets, PasswordHint: message.PasswordHint, Token: replyToken, EncToken: encryptedToken});
                                        });
                                    });
                                }));
                            }
                        }
                    });

                    if(outsiders === true && message.IsEncrypted === 0) {
                        parameters.AttachmentKeys = [];
                        parameters.ClearBody = message.Body;
                        if(message.Attachments.length > 0) {
                             promises.push(message.clearPackets().then(function(packets) {
                                 parameters.AttachmentKeys = packets;
                            }));
                        }
                    }
                    $q.all(promises).then(function() {
                        Message.send(parameters).$promise.then(function(result) {
                            notify($translate.instant('MESSAGE_SENT'));
                            $scope.close(message, false);

                            if($state.is('secured.drafts') || $state.is('secured.sent')) {
                                $rootScope.$broadcast('refreshMessages');
                            }

                            deferred.resolve(result);
                        });
                    });
                });
            }, function() {
                deferred.reject();
            });

            message.track(deferred.promise);

            return deferred.promise;
        }
    };

    $scope.toggleMinimize = function(message) {
        if (!!message.minimized) {
            $scope.normalize(message);
        } else {
            $scope.minimize(message);
        }
    };

    $scope.minimize = function(message) {
        message.minimized = true;
    };

    $scope.toggleMaximized = function(message) {
        if (!!message.maximized) {
            $scope.normalize(message);
        } else {
            $scope.maximized(message);
        }
    };

    $scope.maximize = function(message) {
        message.maximized = true;
    };

    $scope.blur = function(message) {
        $log.info('blurr');
        message.blur = true;
    };

    $scope.focus = function(message) {
        $log.info('focuss');
        message.blur = false;
    };

    $scope.normalize = function(message) {
        message.minimized = false;
        message.maximized = false;
    };

    $scope.close = function(message, save) {

        var index = $scope.messages.indexOf(message);

        var messageFocussed = !!message.focussed;

        if (save === true) {
            $scope.save(message, true);
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

    $scope.discard = function(message) {

        var index = $scope.messages.indexOf(message);

        var messageFocussed = !!message.focussed;

        if (message.ID) {
            Message.delete({IDs: [message.ID]}).$promise.then(function(response) {
                if (response[0] && response[0].Error === undefined) {
                    $rootScope.$broadcast('updateCounters');
                    $rootScope.$broadcast('refreshMessages');
                }
            });
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
        if($rootScope.user.AutoSaveContacts === 1) {
            $scope.saveNewContacts();
        }
    });

    $scope.$watch('message', function() {
        messageCache.put(message.ID, message);
    });

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

    $scope.lockType = function(message) {
        var lockClass = '';

        if (message.IsEncrypted !== '0') {
            lockClass += ' fa-lock';
        }

        if (message.IsEncrypted === '1' || message.IsEncrypted === '5' || message.IsEncrypted === '6') {
            lockClass += ' text-purple';
        }

        if (message.IsEncrypted === '0') {
            lockClass += ' fa-unlock-alt text-muted';
        }

        return lockClass;
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
                            $this.attr('download', attachment.Name);

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

    $scope.saveLabels = function(labels) {
        var deferred = $q.defer();
        var messageIDs = [message.ID];
        var toApply = _.map(_.where(labels, {Selected: true}), function(label) { return label.ID; });
        var toRemove = _.map(_.where(labels, {Selected: false}), function(label) { return label.ID; });
        var promises = [];

        _.each(toApply, function(labelID) {
            promises.push(Label.apply({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        _.each(toRemove, function(labelID) {
            promises.push(Label.remove({id: labelID, MessageIDs: messageIDs}).$promise);
        });

        $q.all(promises).then(function() {
            message.LabelIDs = _.difference(_.uniq(message.LabelIDs.concat(toApply)), toRemove);
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
            base.ToList = [{Name: message.SenderName, Address: message.SenderAddress}];
            base.Subject = (message.Subject.includes(re_prefix)) ? message.Subject :
            re_prefix + ' ' + message.Subject;
            base.Action = 0;
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
            base.ToList = '';
            base.Subject = (message.Subject.includes(fw_prefix)) ? message.Subject :
            fw_prefix + ' ' + message.Subject;
            base.Attachments = message.Attachments;
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
        $state.go('^');
        $timeout(function() {
            $rootScope.$broadcast('refreshMessages', true); // in silence
        }, 500);
    };

    $scope.moveMessageTo = function(mailbox) {
        var promise;
        var inDelete = mailbox === 'delete';
        var inTrash = mailbox === 'trash';
        var inSpam = mailbox === 'spam';

        if(inDelete) {
            promise = Message.delete({IDs: [message.ID]}).$promise;
        } else {
            promise = Message[mailbox]({IDs: [message.ID]}).$promise;
        }

        promise.then(function(result) {
            $rootScope.$broadcast('updateCounters');

            if(inDelete) {
                notify($translate.instant('MESSAGE_DELETED'));
            } else {
                notify($translate.instant('MESSAGE_MOVED'));
            }

            if(inDelete || inTrash || inSpam) {
                $scope.goToMessageList();
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
