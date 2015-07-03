angular.module("proton.controllers.Messages.Compose", [])

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
    messageCache,
    localStorageService,
    attachments,
    pmcw,
    networkActivityTracker,
    notify,
    tools,
    CONSTANTS,
    Contact,
    User,
    closeModal
) {
    Contact.index.updateWith($scope.user.Contacts);
    $scope.messages = [];
    var promiseComposerStyle;
    $scope.sending = false;
    $scope.saving = false;

    $scope.$watch('messages.length', function(newValue, oldValue) {
        if ($scope.messages.length > 0) {
            window.onbeforeunload = function() {
                return $translate.instant('MESSAGE_LEAVE_WARNING');
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
        message.IsRead = 1;
        $scope.initMessage(angular.copy(message));
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
            Body: message.Body,
            From: authentication.user.Addresses[0]
        });
    };

    $scope.slideDown = function(message) {
        message.attachmentsToggle = !!!message.attachmentsToggle;
        $scope.$apply();
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

    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                maxFilesize: CONSTANTS.ATTACHMENT_SIZE_LIMIT,
                maxFiles: CONSTANTS.ATTACHMENT_NUMBER_LIMIT,
                addRemoveLinks: false,
                dictDefaultMessage: $translate.instant('DROP_FILE_HERE_TO_UPLOAD'),
                url: "/file/post",
                paramName: "file", // The name that will be used to transfer the file
                previewsContainer: '.previews',
                previewTemplate: '<span class="preview-template"><span class="name preview-name" data-dz-name></span> <span class="fa fa-times preview-close" data-dz-remove></span></span>',
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
                dragover: function(event) {
                    $interval.cancel($scope.intervalComposer);
                },
                drop: function(event) {
                    $scope.isOver = false;
                    isOver = false;
                },
                removedfile: function(file) {
                    $scope.removeAttachment(file, message);
                },
                addedfile: function(file) {
                    // add file here and then show progress
                    $scope.addAttachment(file, message);
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
            attachmentPromise = attachments.load(file).then(
                function(packets) {
                    return attachments.upload(packets, message.ID, element).then(
                        function(result) {
                            message.Attachments.push(result);
                            message.uploading = false;
                            message.attachmentsToggle = true;
                        }
                    );
                }
            );
        }
        else {
            // Attachment size error.
            notify('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + totalSize + '.');
            // TODO remove file in droparea
            return;
        }
    };

    $scope.removeAttachment = function(file, message) {
        var fileID = (file.ID) ? file.ID : file.previewElement.id;
        var attachment = _.findWhere(message.Attachments, {AttachmentID: fileID});

        message.Attachments = _.without(message.Attachments, attachment);

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

    $scope.uid = 1;

    $scope.initMessage = function(message) {
        if ($rootScope.user.ComposerMode === 1) {
            message.maximized = true;
        }

        // if tablet we maximize by default
        if (tools.findBootstrapEnvironment()==='sm' || message.maximized) {
            if ($scope.messages.length>0) {
                notify.closeAll();
                notify($translate.instant('MAXIMUM_COMPOSER_REACHED'));
                return;
            }
        }

        message.uid = $scope.uid++;
        $scope.messages.unshift(message);
        $scope.$apply();
        $scope.setDefaults(message);

        $timeout( function() {
            $scope.saveOld(message);
            $scope.listenEditor(message);
            $scope.focusComposer(message);

            if (angular.isUndefined(message.Body)) {
                // this sets the Body with the signature
                $scope.completedSignature(message);
            }

            $scope.onAddFile(message);

            // sanitation
            message.Body = DOMPurify.sanitize(message.Body, {
                FORBID_TAGS: ['style']
            });
            resizeComposer();
        }, 100);
    };

    $scope.onAddFile = function(message) {
        $('#uid' + message.uid).find('.btn-add-attachment').on('click', function() {
            if(angular.isUndefined(message.ID)) {
                $scope.save(message, true); // We need to save to get an ID
            }
            
            $scope.addFile(message);
        });
    };

    $scope.addFile = function(message) {
        $('#uid' + message.uid + ' .dropzone').click();
    };

    $scope.editorStyle = function(message) {
        var styles = {};

        if (message.maximized===true) {
            var composer = $('.composer:visible');
            var composerHeight = composer.outerHeight();
            var composerHeader = composer.find('.composer-header').outerHeight();
            var composerFooter = composer.find('.composer-footer').outerHeight();
            var composerMeta = composer.find('.composerMeta').outerHeight();

            styles.height = composerHeight - (composerHeader + composerFooter + composerFooter + composerMeta);
        } else {
            styles.height = 'auto';
        }

        return styles;
    };

    $scope.squireHeight = function(message) {
        if (message.maximized === true) {
            return '100%';
        } else {
            var composer = $('#uid' + message.uid);
            var to = composer.find('.to-container').outerHeight();
            var bcc = composer.find('.bcc-container').outerHeight();
            var cc = composer.find('.cc-container').outerHeight();
            var previewHeight = composer.find('.previews').outerHeight();
            var recipientsHeight = to + bcc + cc;
            var height = 352 - recipientsHeight - previewHeight;

            height = (height < 130) ? 130 : height;

            return height + 'px';
        }
    };

    $scope.composerStyle = function(message) {
        var margin = 20;
        var index = $scope.messages.indexOf(message);
        var reverseIndex = $scope.messages.length - index;
        var styles = {};
        var widthWindow = $('#main').width();

        if ($('html').hasClass('ua-windows_nt')) {
            margin = 40;
        }

        if (tools.findBootstrapEnvironment() === 'xs') {
            var marginTop = 80; // px
            var top = marginTop;
            styles.top = top + 'px';
        }
        else {
            var marginRight = margin; // px
            var widthComposer = 480; // px
            if (Math.ceil(widthWindow / $scope.messages.length) > (widthComposer + marginRight)) {
                right = (index * (widthComposer + marginRight)) + marginRight;
            }
            else {
                widthWindow -= margin; // margin left
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
        message.Body = "<br><br>" + tools.replaceLineBreaks(authentication.user.Signature);
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

                // todo: swap ???
                bottom.css({
                    top:    clickedTop,
                    zIndex: clickedZ
                });
                clicked.css({
                    top:    bottomTop,
                    zIndex: bottomZ
                });
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
                $(composer).find('.to-list').focus();
            } else if (message.Subject.length === 0) {
                $(composer).find('.subject').focus();
            } else {
                message.editor.focus();
            }
            _.each($scope.messages, function(m) {
                m.focussed = false;
            });

            message.focussed = true;
        }
    };

    $scope.listenEditor = function(message) {
        if(message.editor) {
            message.editor.addEventListener('focus', function() {
                message.fields = false;
                message.toUnfocussed = true;
                $timeout(function() {
                    message.height();
                    $('.typeahead-container').scrollTop(0);
                });
            });
            message.editor.addEventListener('input', function() {
                $scope.saveLater(message);
            });
        }
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

        $scope.saving = true;
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
                $scope.saving = false;

                // Add draft in message list
                if($state.is('secured.drafts') && silently !== true) {
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

        $scope.saving = false;
        $scope.sending = true;

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
                                            $scope.sending = false;
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
                                 $scope.sending = false;
                            }));
                        }
                    }
                    $q.all(promises).then(function() {
                        Message.send(parameters).$promise.then(function(result) {
                            notify($translate.instant('MESSAGE_SENT'));
                            messageCache.put(message.ID, message);
                            messageCache.set([{Action: 1, ID: message.ID, Message: message}]);
                            $scope.close(message, false);

                            if($state.is('secured.drafts') || $state.is('secured.sent')) {
                                $rootScope.$broadcast('refreshMessages');
                            }
                            $scope.sending = false;
                            deferred.resolve(result);
                        });
                    });
                });
            }, function() {
                $scope.sending = false;
                deferred.reject();
            });

            message.track(deferred.promise);

            return deferred.promise;
        }
        else {
            $scope.sending = false;
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

    $scope.openCloseModal = function(message, save) {
        $scope.close(message, true);
        // closeModal.activate({
        //     params: {
        //         discard: function() {
        //             closeModal.deactivate();
        //             $scope.discard(message);
        //         },
        //         cancel: function() {
        //             closeModal.deactivate();
        //             $scope.close(message, true);
        //         }
        //     }
        // });
    };

    $scope.close = function(message, save) {
        var index = $scope.messages.indexOf(message);
        var messageFocussed = !!message.focussed;

        if (save === true) {
            $scope.saveLater(message);
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
});
