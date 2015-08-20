angular.module("proton.controllers.Messages.Compose", ["proton.constants"])

.controller("ComposeMessageController", function(
    $interval,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    Attachment,
    CONSTANTS,
    Contact,
    Message,
    User,
    attachments,
    authentication,
    closeModal,
    contactManager,
    messageCache,
    networkActivityTracker,
    notify,
    pmcw,
    tools
) {
    // Variables
    Contact.index.updateWith($scope.user.Contacts);
    $scope.messages = [];
    var promiseComposerStyle;
    var dragsters = [];
    var timeoutStyle;
    $scope.isOver = false;
    $scope.sending = false;
    $scope.saving = false;
    $scope.isOver = false;
    $scope.maxExpiration = CONSTANTS.MAX_EXPIRATION_TIME;
    $scope.uid = 1;
    $scope.oldProperties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments', 'ExpirationTime'];
    $scope.numTags = [];

    // Listeners
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
        message.saved = 0;
        $scope.initMessage(message, true);
    });

    $scope.$on('loadMessage', function(event, message, save) {
        var mess = new Message(_.pick(message, 'ID', 'Subject', 'Body', 'From', 'ToList', 'CCList', 'BCCList', 'Attachments', 'Action', 'ParentID', 'attachmentsToggle', 'IsRead'));

        mess.saved = 2;
        $scope.initMessage(mess, save);
    });

    $scope.$on('editorLoaded', function(event, element, editor) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];

        message.editor = editor;
        $scope.listenEditor(message);
    });

    function onResize() {
        clearTimeout(timeoutStyle);

        timeoutStyle = setTimeout(function() {
            $scope.composerStyle();
        }, 250);
    }

    function onDragOver(event) {
        event.preventDefault();
        $interval.cancel($scope.intervalComposer);
        $interval.cancel($scope.intervalDropzone);

        $scope.intervalComposer = $interval(function() {
            $scope.isOver = false;
            $interval.cancel($scope.intervalComposer);
        }, 100);

        if ($scope.isOver === false) {
            $scope.isOver = true;
        }
    }

    $(window).on('resize', onResize);
    $(window).on('dragover', onDragOver);

    $scope.$on('$destroy', function() {
        $(window).off('resize', onResize);
        $(window).off('dragover', onDragOver);
        $interval.cancel($scope.intervalComposer);
        $interval.cancel($scope.intervalDropzone);
    });

    // Function used for dragover listener on the dropzones
    var dragover = function(e) {
        e.preventDefault();
        $interval.cancel($scope.intervalComposer);
        $interval.cancel($scope.intervalDropzone);

        $scope.intervalDropzone = $interval(function() {
            $scope.isOver = false;
            $interval.cancel($scope.intervalDropzone);
        }, 100);

        if ($scope.isOver === false) {
            $scope.isOver = true;
        }
    };

    // Functions

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

    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                maxFiles: CONSTANTS.ATTACHMENT_NUMBER_LIMIT,
                addRemoveLinks: false,
                dictDefaultMessage: $translate.instant('DROP_FILE_HERE_TO_UPLOAD'),
                url: "/file/post",
                paramName: "file", // The name that will be used to transfer the file
                previewTemplate: '<div style="display:none"></div>',
                previewsContainer: '.previews',
                accept: function(file, done) {
                    var totalSize = $scope.getAttachmentsSize(message);
                    var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;
                    totalSize += file.size;

                    if(angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
                        done('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
                        notify('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
                    } else if(totalSize >= (sizeLimit * 1024 * 1024)) {
                        done('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/1024/1024)/10 + ' MB.');
                        notify('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/1024/1024)/10 + ' MB.');
                    } else {
                        done();
                        $scope.addAttachment(file, message);
                    }
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
                drop: function(event) {
                    event.preventDefault();

                    $scope.isOver = false;
                    $scope.$apply();
                }
            }
        };
    };

    $scope.getAttachmentsSize = function(message) {
        var size = 0;

        angular.forEach(message.Attachments, function(attachment) {
            if (angular.isDefined(attachment.fileSize)) {
                size += parseInt(attachment.fileSize);
            }
        });
        return size;
    };

    $scope.decryptAttachments = function(message) {
        if(message.Attachments && message.Attachments.length > 0) {
            _.each(message.Attachments, function(attachment) {
                // decode key packets
                var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

                // get user's pk
                var key = authentication.getPrivateKey().then(function(pk) {
                    // decrypt session key from keypackets
                    pmcw.decryptSessionKey(keyPackets, pk).then(function(sessionKey) {
                        attachment.sessionKey = sessionKey;
                    });
                });
            });
        }
    };

    $scope.initAttachment = function(tempPacket, index) {
        if (tempPacket.uploading) {
            var id = 'attachment' + index;

            $timeout(function() {
                tempPacket.elem = document.getElementById(id);
                tempPacket.elem.removeAttribute('id');

                attachments.uploadProgress(1, tempPacket.elem);
            });
        }
    };

    $scope.addAttachment = function(file, message) {
        var tempPacket = {};

        tempPacket.filename = file.name;
        tempPacket.uploading = true;
        tempPacket.fileSize = file.size;

        message.uploading++;
        message.Attachments.push(tempPacket);
        message.attachmentsToggle = true;

        $scope.composerStyle();

        attachments.load(file).then(
            function(packets) {
                return attachments.upload(packets, message.ID, tempPacket).then(
                    function(result) {
                        var index = message.Attachments.indexOf(tempPacket);

                        if (result === 'aborted') {
                            message.Attachments.splice(index, 1);
                        } else {
                            message.Attachments.splice(index, 1, result);
                        }
                        message.uploading--;
                    }
                );
            }
        );
    };

    $scope.removeAttachment = function(attachment, message) {
        message.Attachments = _.without(message.Attachments, attachment);

        Attachment.remove({
            "MessageID": message.ID,
            "AttachmentID": attachment.AttachmentID || attachment.ID
        }).$promise.then(function(response) {
            if (response.Error) {
                notify(response.Error);
                message.Attachments.push(attachment);
                var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };
                that.options.addedfile.call(that, mockFile);
            }
        });
    };

    $scope.initMessage = function(message, save) {
        $rootScope.activeComposer = true;

        if (authentication.user.ComposerMode === 1) {
            message.maximized = true;
        }

        // if tablet we maximize by default
        if (tools.findBootstrapEnvironment() === 'sm') {
            if ($scope.messages.length>0) {
                notify.closeAll();
                notify($translate.instant('MAXIMUM_COMPOSER_REACHED'));
                return;
            }
        }

        message.uid = $scope.uid++;
        message.numTags = [];
        message.recipientFields = [];
        message.uploading = 0;
        $scope.messages.unshift(message);
        $scope.setDefaults(message);
        $scope.fields = message.CCList.length > 0 || message.BCCList.length > 0;
        $scope.saveOld(message);
        $scope.completedSignature(message);
        $scope.sanitizeBody(message);
        $scope.decryptAttachments(message);

        // This timeout is really important to load the structure of Squire
        $timeout(function() {
            $scope.composerStyle();
            $scope.onAddFile(message);
            // forward case: we need to save to get the attachments
            if(save === true) {
                $scope.save(message, true, true).then(function() {
                    $scope.decryptAttachments(message);
                });
            }
        });

        $timeout(function() {
            $scope.focusComposer(message);
            message.recipientFieldFocussed = 1;
        }, 100);
    };

    $scope.onAddFile = function(message) {
        $('#uid' + message.uid + ' .btn-add-attachment').click(function() {
            if(angular.isUndefined(message.ID)) {
                // We need to save to get an ID
                    $scope.addFile(message);
            } else {
                $scope.addFile(message);
            }
        });
    };

    $scope.addFile = function(message) {
        $('#uid' + message.uid + ' .dropzone').click();
    };

    $scope.sanitizeBody = function(message) {
        message.Body = DOMPurify.sanitize(message.Body, {
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['style']
        });
    };

    $scope.editorStyle = function(message) {
        var styles = {};
        var composer = $('.composer:visible');

        if (message.maximized === true) {
            var composerHeight = composer.outerHeight();
            var composerHeader = composer.find('.composer-header').outerHeight();
            var composerFooter = composer.find('.composer-footer').outerHeight();
            var composerMeta = composer.find('.composerMeta').outerHeight();

            styles.height = composerHeight - (composerHeader + composerFooter + composerFooter + composerMeta);
        } else {
            var bcc = composer.find('.bcc-container').outerHeight();
            var cc = composer.find('.cc-container').outerHeight();
            var preview = composer.find('.previews').outerHeight();
            var height = 300 - bcc - cc - preview;

            height = (height < 130) ? 130 : height;

            styles.height = height + 'px';
        }

        return styles;
    };

    $scope.composerStyle = function() {
        var composers = $('.composer');

        _.each(composers, function(composer, index) {
            var margin = 20;
            var reverseIndex = $scope.messages.length - index;
            var message = $scope.messages[index];
            var styles = {};
            var widthWindow = $('#main').width();
            var navbar = $('#navbar').outerHeight();
            var windowHeight = $(window).height() - margin - navbar;
            var composerHeight = $(composer).outerHeight();

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

			styles.overflowY = 'auto'; // TODO move this propertie to CSS

        	// Height
        	if(windowHeight < composerHeight) {
        		styles.height = windowHeight + 'px';
        	}

            $(composer).css(styles);

            setTimeout(function() {
                $(composer).find('.angular-squire').css($scope.editorStyle(message));
            });
        });
    };

    $scope.completedSignature = function(message) {
        if (angular.isUndefined(message.Body)) {
            var signature = DOMPurify.sanitize('<div>' + tools.replaceLineBreaks(authentication.user.Signature) + '</div>', {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style']
            });

            message.Body = ($(signature).text().length === 0 && $(signature).find('img').length === 0)? "" : "<br /><br />" + signature;
        }
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

                // TODO: swap ???
                bottom.css({
                    top:    clickedTop,
                    zIndex: clickedZ
                });
                clicked.css({
                    top:    bottomTop,
                    zIndex: bottomZ
                });
            } else {
                _.each($scope.messages, function(element, iteratee) {
                    if (iteratee > index) {
                        element.zIndex = ($scope.messages.length - (iteratee - index))*10;
                    } else {
                        element.zIndex = ($scope.messages.length)*10;
                    }
                });
            }

            // focus correct field
            var composer = $('#uid' + message.uid);

            if (message.ToList.length === 0) {
                $(composer).find('.to-list').focus();
            } else if (message.Subject.length === 0) {
                $(composer).find('.subject').focus();
            } else {
                $timeout(function() {
                    message.editor.focus();
                }, 500);
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
                $timeout(function() {
                    message.fields = false;
                    message.recipientFieldFocussed = 0;
                    $('.typeahead-container').scrollTop(0);
                    $scope.$apply();
                });
            });

            message.editor.addEventListener('input', function() {
                $scope.saveLater(message);
            });

            message.editor.addEventListener('dragenter', function(e) {
                $scope.isOver = true;
                $scope.$apply();
            });
            message.editor.addEventListener('dragover', function(e) {
                $scope.isOver = true;
                $scope.$apply();
            });

            _.each($('.composer-dropzone'), function(dropzone) {
                dropzone.removeEventListener('dragover', dragover);
                dropzone.addEventListener('dragover', dragover);
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

    $scope.recipientFieldEllipsis = function(message, list) {
            if ((message.recipientFields[list].scrollHeight - message.recipientFields[list].offsetHeight) > 20) {
                return true;
            } else {
                return false;
            }
    };

    $scope.toggleFields = function(message) {
        message.fields = !message.fields;
        $timeout(function() {
            message.recipientFieldFocussed = (message.fields) ? 4 : 0;
            $scope.apply();
        });
        $scope.composerStyle();
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

    $scope.clearEncrypt = function(message, params, form) {
        params.password = '';
        params.confirm = '';
        params.hint = '';
        form.$setUntouched();
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

        message.ExpirationTime = params.expiration * 3600; // seconds
        $scope.closePanel(message);
    };

    $scope.clearExpiration = function(message) {
        delete message.ExpirationTime;
        $scope.closePanel(message);
    };

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

    /**
     * Determine if we need to save the message
     */
    $scope.needToSave = function(message) {
        if($scope.saving === true) { // Current backup
            return false;
        } else {
            if(angular.isDefined(message.old)) {
                var currentMessage = _.pick(message, $scope.oldProperties);
                var oldMessage = _.pick(message.old, $scope.oldProperties);

                return JSON.stringify(oldMessage) !== JSON.stringify(currentMessage);
            } else {
                return true;
            }
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

        return true;
    };

    $scope.save = function(message, silently, forward) {
        message.saved++;

        var deferred = $q.defer();
        var parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead')
        };

        $scope.saving = true;

        if (typeof parameters.Message.ToList === 'string') {
            parameters.Message.ToList = [];
        }

        if(angular.isDefined(message.ParentID)) {
            parameters.ParentID = message.ParentID;
            parameters.Action = message.Action;
        }

        if(angular.isDefined(message.ID)) {
            parameters.id = message.ID;
        } else {
            parameters.Message.IsRead = 1;
        }

        parameters.Message.AddressID = message.From.ID;

        savePromise = message.encryptBody(authentication.user.PublicKey).then(function(result) {
            var draftPromise;
            var CREATE = 1;
    		var UPDATE = 2;
            var action;

            parameters.Message.Body = result;

            if(angular.isUndefined(message.ID)) {
                draftPromise = Message.createDraft(parameters).$promise;
                action = CREATE;
            } else {
                draftPromise = Message.updateDraft(parameters).$promise;
                action = UPDATE;
            }

            draftPromise.then(function(result) {
                var process = function(result) {
                    message.ID = result.Message.ID;
                    message.IsRead = result.Message.IsRead;

                    if(forward === true && result.Message.Attachments.length > 0) {
                        message.Attachments = result.Message.Attachments;
                        message.attachmentsToggle = true;
                    }

                    message.BackupDate = new Date();
                    message.Location = CONSTANTS.MAILBOX_IDENTIFIERS.drafts;
                    $scope.saveOld(message);
                    $scope.saving = false;

                    // Add draft in message list
                    if($state.is('secured.drafts')) {
                        $rootScope.$broadcast('refreshMessages');
                    }

                    deferred.resolve(result);
                };

                if(result.Code === 15034 || result.Code === 15033) { // Draft ID does not correspond to a draft
                    var saveMePromise = Message.createDraft(parameters).$promise;

                    saveMePromise.then(function(result) {
                        process(result);
                    });
                } else {
                    process(result);
                }
            });
        });

        if(silently !== true) {
            message.track(deferred.promise);
        }

        return deferred.promise;
    };

    $scope.send = function(message) {
        var deferred = $q.defer();
        var validate = $scope.validate(message);

        $scope.saving = false;
        $scope.sending = true;

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

                                return message.encryptPackets(key).then(function(keyPackets) {
                                    return parameters.Packages.push({Address: email, Type: 1, Body: body, KeyPackets: keyPackets});
                                });
                            }));
                        } else { // outside user
                            outsiders = true;

                            if(message.IsEncrypted === 1) {
                                var replyToken = message.generateReplyToken();
                                var replyTokenPromise = pmcw.encryptMessage(replyToken, [], message.Password);

                                promises.push(replyTokenPromise.then(function(encryptedToken) {
                                    return pmcw.encryptMessage(message.Body, [], message.Password).then(function(result) {
                                        var body = result;

                                        return message.encryptPackets('', message.Password).then(function(result) {
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
                        if (outsiders === true && message.IsEncrypted === 0 && message.ExpirationTime) {
                            notify({
                                message: 'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://support.protonmail.ch/knowledge-base/expiration/" target="_blank">click here</a>.',
                                classes: 'notification-danger',
                                duration: 10000 // 10 seconds
                            });
                            $scope.sending = false;
                            deferred.reject();
                        } else {
                            Message.send(parameters).$promise.then(function(result) {
                                var updateMessages = [{Action: 1, ID: message.ID, Message: result.Sent}];

                                if (result.Parent) {
                                    updateMessages.push({Action:3, ID: result.Parent.ID, Message: result.Parent});
                                    $rootScope.$broadcast('updateReplied', _.pick(result.Parent, 'IsReplied', 'IsRepliedAll', 'IsForwarded'));
                                    if(result.Parent.ID === $stateParams.id) {
                                        $state.go('^');
                                    }
                                }

                                $scope.sending = false;

                                if(angular.isDefined(result.Error)) {
                                    notify({
                                        message: result.Error,
                                        classes: 'notification-danger'
                                    });
                                    deferred.reject();
                                } else {
                                    messageCache.set(updateMessages);
                                    notify({
                                        message: $translate.instant('MESSAGE_SENT'),
                                        classes: 'notification-success'
                                    });
                                    $scope.close(message, false);
                                    deferred.resolve(result);
                                }
                            });
                        }
                    });
                });
            }, function() {
                $scope.sending = false;
                deferred.reject();
            });

            message.track(deferred.promise);

        } else {
            $scope.sending = false;
            deferred.reject();
        }

        return deferred.promise;
    };

    $scope.minimize = function(message) {
        $rootScope.activeComposer = false;
        message.minimized = true;
        message.previousMaximized = message.maximized;
        message.maximized = false;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
    };

    $scope.unminimize = function(message) {
        $rootScope.activeComposer = true;
        message.minimized = false;
        message.maximized = message.previousMaximized;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
    };

    $scope.maximize = function(message) {
        $rootScope.activeComposer = true;
        message.maximized = true;
    };

    $scope.normalize = function(message) {
        message.minimized = false;
        message.maximized = false;
    };

    $scope.blur = function(message) {
        message.blur = true;
    };

    $scope.focus = function(message) {
        message.blur = false;
    };

    $scope.openCloseModal = function(message, save) {
        message.editor.removeEventListener('input', function() {
            $scope.saveLater(message);
        });

        message.editor.removeEventListener('dragenter', function(e) {
            $scope.isOver = true;
            $scope.$apply();
        });
        message.editor.removeEventListener('dragover', function(e) {
            $scope.isOver = true;
            $scope.$apply();
        });

        if (message.saved < 2) {
            $scope.discard(message);
        } else {
            $scope.close(message, true);
        }
    };

    $scope.close = function(message, save) {
        $rootScope.activeComposer = false;
        var index = $scope.messages.indexOf(message);
        var messageFocussed = !!message.focussed;

        if (save === true) {
            $scope.saveLater(message);
        }

        message.close();

        // Remove message in messages
        $scope.messages.splice(index, 1);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Message closed and focussed?
        if(messageFocussed && $scope.messages.length > 0) {
            // Focus the first message
            $scope.focusComposer(_.first($scope.messages));
        }

        setTimeout(function () {
            $scope.composerStyle();
        }, 250);
    };

    $scope.discard = function(message) {
        $rootScope.activeComposer = false;

        var index = $scope.messages.indexOf(message);
        var messageFocussed = !!message.focussed;
        var id = message.ID;

        message.close();

        // Remove message in composer controller
        $scope.messages.splice(index, 1);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Remove message in message list controller
        $rootScope.$broadcast('discardDraft', id);

        // Message closed and focussed?
        if(messageFocussed && $scope.messages.length > 0) {
            // Focus the first message
            $scope.focusComposer(_.first($scope.messages));
        }

        setTimeout(function () {
            $scope.composerStyle();
        }, 250);
    };

    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };
});
