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
    messageCache,
    notify,
    pmcw,
    tools
) {
    // Variables
    var promiseComposerStyle;
    var dragsters = [];
    var timeoutStyle;
    var dropzone;

    $scope.messages = [];
    $scope.isOver = false;
    $scope.sending = false;
    $scope.saving = false;
    $scope.queuedSave = false;
    $scope.preventDropbox = false;
    $scope.maxExpiration = CONSTANTS.MAX_EXPIRATION_TIME;
    $scope.uid = 1;
    $scope.oldProperties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments', 'ExpirationTime'];
    $scope.numTags = [];

    Contact.index.updateWith($scope.user.Contacts);

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
        $scope.initMessage(message, false);
    });

    $scope.$on('loadMessage', function(event, message, save) {
        var mess = new Message(_.pick(message, 'ID', 'Subject', 'Body', 'From', 'ToList', 'CCList', 'BCCList', 'Attachments', 'Action', 'ParentID', 'attachmentsToggle', 'IsRead'));

        mess.saved = 2;
        $scope.initMessage(mess, save);
    });

    $scope.$on('deleteMessage', function(event, id) {
        _.each($scope.messages, function(message) {
            if(message.ID === id) {
                $scope.close(message, false, false);
            }
        });
    });

    $scope.$on('editorLoaded', function(event, element, editor) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];

        if (message) {
            message.editor = editor;
            $scope.listenEditor(message);
            $scope.focusComposer(message);
            message.recipientFieldFocussed = 1;
        }
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

    function onDragEnter(event) {
        $scope.isOver = true;
        $scope.$apply();
    }

    function onDragStart(event) {
        $scope.preventDropbox = true;
    }

    function onMouseOver(event) {
        if($scope.isOver === true) {
            $scope.isOver = false;
        }
    }

    function onDragEnd(event) {
        event.preventDefault();
        $scope.preventDropbox = false;
        $scope.isOver = false;
    }

    $(window).on('resize', onResize);
    $(window).on('dragover', onDragOver);
    $(window).on('dragstart', onDragStart);
    $(window).on('dragend', onDragEnd);
    // $(window).on('mouseover', onMouseOver);

    $scope.$on('$destroy', function() {
        $(window).off('resize', onResize);
        $(window).off('dragover', onDragOver);
        // $(window).off('mouseover', onMouseOver);
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
    };

    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                addRemoveLinks: false,
                dictDefaultMessage: $translate.instant('DROP_FILE_HERE_TO_UPLOAD'),
                url: "/file/post",
                autoProcessQueue: false,
                paramName: "file", // The name that will be used to transfer the file
                previewTemplate: '<div style="display:none"></div>',
                previewsContainer: '.previews',
                accept: function(file, done) {

                    var totalSize = $scope.getAttachmentsSize(message);
                    var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

                    totalSize += angular.isDefined(message.queuedFilesSize) ? message.queuedFilesSize : 0;
                    totalSize += file.size;

                    $scope.isOver = false;

                    var dropzone = this;

                    var total_num = angular.isDefined(message.Attachments) ? message.Attachments.length : 0;
                    total_num += angular.isDefined(message.queuedFiles) ? message.queuedFiles : 0;

                    if(total_num === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
                        dropzone.removeFile(file);
                        done('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
                        notify({message: 'Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments', classes: 'notification-danger'});
                    } else if(totalSize >= (sizeLimit * 1024 * 1024)) {
                        dropzone.removeFile(file);
                        done('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/1024/1024)/10 + ' MB.');
                        notify({message: 'Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/1024/1024)/10 + ' MB.', classes: 'notification-danger'});
                    } else {
                        if ( angular.isUndefined( message.queuedFiles ) ) {
                            message.queuedFiles = 0;
                            message.queuedFilesSize = 0;
                        }
                        message.queuedFiles++;
                        message.queuedFilesSize += file.size;

                        var process = function() {
                            message.queuedFiles--;
                            message.queuedFilesSize -= file.size;
                            $scope.addAttachment(file, message).finally(function () {
                                dropzone.removeFile(file);
                            });
                        };

                        if(angular.isUndefined(message.ID)) {
                            if (angular.isUndefined(message.savePromise)) {
                                $scope.save(message, false, false, false); // message, silently, forward, notification
                            }

                            message.savePromise.then(process);
                        } else {
                           process();
                        }

                        done();
                    }
                },
                init: function(event) {
                    var dropzone = this;

                    _.forEach(message.Attachments, function (attachment) {
                        var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };

                        dropzone.options.addedfile.call(dropzone, mockFile);
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
        var removeAttachments = [];

        if(message.Attachments && message.Attachments.length > 0) {
            _.each(message.Attachments, function(attachment) {
                try {
                    // decode key packets
                    var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
                    // get user's pk
                    var key = authentication.getPrivateKey().then(function(pk) {
                        // decrypt session key from keypackets
                        pmcw.decryptSessionKey(keyPackets, pk).then(function(sessionKey) {
                            attachment.sessionKey = sessionKey;
                        }, function(error) {
                            notify({message: 'Error during decryption of the session key', classes: 'notification-danger'});
                            $log.error(error);
                        });
                    }, function(error) {
                        notify({message: 'Error during decryption of the private key', classes: 'notification-danger'});
                        $log.error(error);
                    });
                } catch(error) {
                    removeAttachments.push(attachment);
                }
            });
        }

        if(removeAttachments.length > 0) {
            _.each(removeAttachments, function(attachment) {
                notify({classes: 'notification-danger', message: 'Decryption of attachment ' + attachment.Name + ' failed. It has been removed from this draft.'});
                $scope.removeAttachment(attachment, message);
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

    $scope.cancelAttachment = function(attachment, message) {
        // Cancel the request
        attachment.cancel();
        // Remove the attachment in the view
        message.Attachments = _.without(message.Attachments, attachment);
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

        var cleanup = function( result ) {
            var index = message.Attachments.indexOf(tempPacket);

            if ( angular.isDefined( result ) && angular.isDefined( result.AttachmentID ) ) {
                message.Attachments.splice(index, 1, result);
            }
            else {
                message.Attachments.splice(index, 1);
            }

            message.uploading--;
            onResize();
        };

        return attachments.load(file).then(
            function(packets) {
                return attachments.upload(packets, message.ID, tempPacket).then(
                    function(result) {
                        cleanup( result );
                    },
                    function(error) {
                        cleanup();
                        notify({message: 'Error during file upload', classes: 'notification-danger'});
                        $log.error(error);
                    }
                );
            },
            function(error) {
                cleanup();
                notify({message: 'Error encrypting attachment', classes: 'notification-danger'});
                $log.error(error);
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
                notify({message: response.Error, classes: 'notification-danger'});
                message.Attachments.push(attachment);
                var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };

                dropzone.options.addedfile.call(dropzone, mockFile);
            }
        }, function(error) {
            notify({message: 'Error during the remove request', classes: 'notification-danger'});
            $log.error(error);
        });
    };

    $scope.initMessage = function(message, save) {
        $rootScope.activeComposer = true;

        if (authentication.user.ComposerMode === 1) {
            message.maximized = true;
        }

        // if tablet we maximize by default
        if (tools.findBootstrapEnvironment() === 'sm') {
            if ($scope.messages.length > 0) {
                notify.closeAll();
                notify({message: $translate.instant('MAXIMUM_COMPOSER_REACHED'), classes: 'notification-danger'});
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
        $scope.completedSignature(message);
        $scope.sanitizeBody(message);
        $scope.decryptAttachments(message);

        // This timeout is really important to load the structure of Squire
        $timeout(function() {
            $scope.composerStyle();
            $scope.onAddFile(message);
            // forward case: we need to save to get the attachments
            if(save === true) {
                $scope.save(message, true, true, false).then(function() { // message, silently, forward, notification
                    $scope.decryptAttachments(message);
                    $scope.composerStyle();
                }, function(error) {
                    $log.error(error);
                });
            }
        });
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
            } else {
                var marginRight = margin; // px
                var widthComposer = 480; // px

                if (Math.ceil(widthWindow / $scope.messages.length) > (widthComposer + marginRight)) {
                    right = (index * (widthComposer + marginRight)) + marginRight;
                } else {
                    widthWindow -= margin; // margin left
                    var overlap = (((widthComposer * $scope.messages.length) - widthWindow) / ($scope.messages.length - 1));
                    right = index * (widthComposer - overlap);
                }

                if (reverseIndex === $scope.messages.length) {
                    right = marginRight;
                    index = $scope.messages.length;
                }

                styles.top = '';
                styles.right = right + 'px';
            }

			styles.overflowY = 'auto'; // TODO move this propertie to CSS

        	// Height - depreciated. pure css solution - Jason
        	// if(windowHeight < composerHeight) {
        		// styles.height = windowHeight + 'px';
        	// } else {
                // styles.height = 'auto';
            // }

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

            message.editor.addEventListener('dragstart', onDragStart);
            message.editor.addEventListener('dragend', onDragEnd);
            message.editor.addEventListener('dragenter', onDragEnter);
            message.editor.addEventListener('dragover', onDragOver);

            _.each($('.composer-dropzone'), function(dropzone) {
                dropzone.removeEventListener('dragover', dragover);
                dropzone.addEventListener('dragover', dragover);
            });

            $scope.saveOld(message);
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
            notify({message: 'Please enter a password for this email.', classes: 'notification-danger'});
            return false;
        }

        if (params.password !== params.confirm) {
            notify({message: 'Message passwords do not match.', classes: 'notification-danger'});
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

    $scope.initExpiration = function(message, params) {
        var expiration;

        if(message.ExpirationTime) {
            expiration = message.ExpirationTime / 3600;
        }

        params.expiration = expiration || 42;
    };

    $scope.setExpiration = function(message, params) {
        if (parseInt(params.expiration) > CONSTANTS.MAX_EXPIRATION_TIME) { // How can we enter in this situation?
            notify({message: 'The maximum expiration is 4 weeks.', classes: 'notification-danger'});
            return false;
        }

        if (isNaN(params.expiration)) {
            notify({message: 'Invalid expiration time.', classes: 'notification-danger'});
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
                $scope.save(message, true, false, false); // message, silently, forward, notification
            }
        }, CONSTANTS.SAVE_TIMEOUT_TIME);
    };

    $scope.validate = function(message) {
        // set msgBody input element to editor content
        message.setMsgBody();

        // Check if there is an attachment uploading
        if (message.uploading === true) {
            notify({message: 'Wait for attachment to finish uploading or cancel upload.', classes: 'notification-danger'});
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
            notify({message: 'Invalid email(s): ' + invalidEmails.join(',') + '.', classes: 'notification-danger'});
            return false;
        }

        // MAX 25 to, cc, bcc
        if ((message.ToList.length + message.BCCList.length + message.CCList.length) > 25) {
            notify({message: 'The maximum number (25) of Recipients is 25.', classes: 'notification-danger'});
            return false;
        }

        if (message.ToList.length === 0 && message.BCCList.length === 0 && message.CCList.length === 0) {
            notify({message: 'Please enter at least one recipient.', classes: 'notification-danger'});
            return false;
        }

        // Check title length
        if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
            notify({message: 'The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.', classes: 'notification-danger'});
            return false;
        }

        // Check body length
        if (message.Body.length > 16000000) {
            notify({message: 'The maximum length of the message body is 16,000,000 characters.', classes: 'notification-danger'});
            return false;
        }

        return true;
    };

    /**
     * Save the Message
     * @param {Resource} message - Message to save
     * @param {Boolean} silently - Freeze the editor to avoid user interaction
     * @param {Boolean} forward - Forward case
     * @param {Boolean} notification - Add a notification when the saving is complete
     */
    $scope.save = function(message, silently, forward, notification) {
        message.saved++;

        // Variables
        var deferred = $q.defer();
        var parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead')
        };

        // Functions
        var nextSave = function(result) {
            // Schedule this save after the in-progress one completes
            if ( $scope.needToSave(message) ) {
                return $scope.save(message, silently, forward, notification);
            }
            return result;
        };

        if ($scope.saving) {
            message.savePromise = message.savePromise.then(nextSave, nextSave);
            return message.savePromise;
        }

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

                    message.BackupDate = new Date(); // Draft save at
                    message.Location = CONSTANTS.MAILBOX_IDENTIFIERS.drafts;
                    $scope.saveOld(message);

                    // Add draft in message list
                    if($state.is('secured.drafts')) {
                        $rootScope.$broadcast('refreshMessages');
                    }

                    if(notification === true) {
                        notify({message: "Message saved", classes: 'notification-success'});
                    }

                    deferred.resolve(result);
                };

                if(result.Code === 1000) {
                    process(result);
                } else if(result.Code === 15034 || result.Code === 15033) { // Draft ID does not correspond to a draft
                    var saveMePromise = Message.createDraft(parameters).$promise;

                    saveMePromise.then(function(result) {
                        process(result);
                    }, function(error) {
                        error.message = 'Error creating draft';
                        deferred.reject(error);
                    });
                } else {
                    $log.error(result);
                    deferred.reject(result);
                }
            }, function(error) {
                error.message = 'Error during the draft request';
                deferred.reject(error);
            });
        }, function(error) {
            error.message = 'Error encrypting message';
            deferred.reject(error);
        });

        message.savePromise = deferred.promise.finally(function() {
            $scope.saving = false;
        });

        if(silently !== true) {
            message.track(message.savePromise);
        }

        return message.savePromise;
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
                                        }, function(error) {
                                            $log.error(error);
                                        });
                                    }, function(error) {
                                        $log.error(error);
                                    });
                                }, function(error) {
                                    $log.error(error);
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
                            }, function(error) {
                                $log.error(error);
                            }));
                        }
                    }

                    $q.all(promises).then(function() {
                        if (outsiders === true && message.IsEncrypted === 0 && message.ExpirationTime) {
                            $scope.sending = false;
                            $log.error(message);
                            deferred.reject(new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.'));
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
                                    deferred.reject(new Error(result.Error));
                                } else {
                                    messageCache.set(updateMessages);
                                    notify({ message: $translate.instant('MESSAGE_SENT'), classes: 'notification-success' });
                                    $scope.close(message, false, false);
                                    deferred.resolve(result);
                                }
                            }, function(error) {
                                $scope.sending = false;
                                error.message = 'Error during the sending';
                                deferred.reject(error);
                            });
                        }
                    }, function(error) {
                        $scope.sending = false;
                        error.message = 'Error during the promise preparation';
                        deferred.reject(error);
                    });
                }, function(error) {
                    $scope.sending = false;
                    error.message = 'Error during the getting of the public key';
                    deferred.reject(error);
                });
            }, function(error) {
                $scope.sending = false;
                deferred.reject(); // Don't add parameter in the rejection because $scope.save already do that.
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

        message.editor.removeEventListener('dragenter', onDragEnter);
        message.editor.removeEventListener('dragover', onDragOver);
        message.editor.removeEventListener('dragstart', onDragStart);
        message.editor.removeEventListener('dragend', onDragEnd);

        $scope.close(message, false, true);
    };

    $scope.close = function(message, discard, save) {
        var index = $scope.messages.indexOf(message);
        var messageFocussed = !!message.focussed;
        var id = message.ID;

        $rootScope.activeComposer = false;

        if (save === true) {
            $scope.save(message, true, false, false);
        }

        message.close();

        // Remove message in composer controller
        $scope.messages.splice(index, 1);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        if(discard === true && angular.isDefined(id)) {
            // Remove message in message list controller
            $rootScope.$broadcast('discardDraft', id);
            notify({message: 'Message discarded', classes: 'notification-success'}); // TODO translate
        }

        // Message closed and focussed?
        if(messageFocussed && $scope.messages.length > 0) {
            // Focus the first message
            $scope.focusComposer(_.first($scope.messages));
        }

        $timeout(function () {
            $scope.composerStyle();
        }, 250);
    };

    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };
});
