angular.module("proton.controllers.Compose", ["proton.constants"])

.controller("ComposeMessageController", function(
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    action,
    Attachment,
    attachments,
    authentication,
    cache,
    confirmModal,
    CONSTANTS,
    Contact,
    Message,
    embedded,
    networkActivityTracker,
    notify,
    pmcw,
    tools,
    User
) {
    // Variables
    var promiseComposerStyle;
    var timeoutStyle;
    var dropzone;

    $scope.addresses = authentication.user.Addresses;
    $scope.messages = [];
    $scope.isOver = false;
    $scope.queuedSave = false;
    $scope.preventDropbox = false;
    $scope.maxExpiration = CONSTANTS.MAX_EXPIRATION_TIME;
    $scope.uid = 1;
    $scope.isAppleDevice = navigator.userAgent.match(/(iPod|iPhone|iPad)/); // Determine if user navigated from Apple device
    $scope.oldProperties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments', 'ExpirationTime'];
    $scope.numTags = [];
    $scope.pendingAttachements = [];
    $scope.weekOptions = [
        {label: '0', value: 0},
        {label: '1', value: 1},
        {label: '2', value: 2},
        {label: '3', value: 3},
        {label: '4', value: 4}
    ];
    $scope.dayOptions = [
        {label: '0', value: 0},
        {label: '1', value: 1},
        {label: '2', value: 2},
        {label: '3', value: 3},
        {label: '4', value: 4},
        {label: '5', value: 5},
        {label: '6', value: 6}

    ];
    $scope.hourOptions = [
        {label: '0', value: 0},
        {label: '1', value: 1},
        {label: '2', value: 2},
        {label: '3', value: 3},
        {label: '4', value: 4},
        {label: '5', value: 5},
        {label: '6', value: 6},
        {label: '7', value: 7},
        {label: '8', value: 8},
        {label: '9', value: 9},
        {label: '10', value: 10},
        {label: '11', value: 11},
        {label: '12', value: 12},
        {label: '13', value: 13},
        {label: '14', value: 14},
        {label: '15', value: 15},
        {label: '16', value: 16},
        {label: '17', value: 17},
        {label: '18', value: 18},
        {label: '19', value: 19},
        {label: '20', value: 20},
        {label: '21', value: 21},
        {label: '22', value: 22},
        {label: '23', value: 23}
    ];

    // Listeners
    $scope.$watch('messages.length', function(newValue, oldValue) {
        if ($scope.messages.length > 0) {
            $rootScope.activeComposer = true;
            window.onbeforeunload = function() {
                return gettextCatalog.getString('By leaving now, you will lose what you have written in this email. You can save a draft if you want to come back to it later on.', null);
            };
        } else {
            $rootScope.activeComposer = false;
            window.onbeforeunload = undefined;
        }
    });

    $scope.$on('updateUser', function(event) {
        $scope.addresses = authentication.user.Addresses;
    });

    $scope.$on('onDrag', function() {
        _.each($scope.messages, function(message) {
            $scope.togglePanel(message, 'attachments');
        });
    });

    // When the user delete a conversation and a message is a part of this conversation
    $scope.$on('deleteConversation', function(event, ID) {
        _.each($scope.messages, function(message) {
            if(ID === message.ID) {
                // Close the composer
                $scope.close(message, false, false);
            }
        });
    });

    // When a message is updated we try to update the message
    $scope.$on('refreshMessage', function(event) {
        _.each($scope.messages, function(message) {
            if(angular.isDefined(message.ID)) {
                var messageCached = cache.getMessageCached(message.ID);

                if(angular.isDefined(messageCached)) {
                    message.Time = messageCached.Time;
                    message.ConversationID = messageCached.ConversationID;
                }
            }
        });
    });

    $scope.$on('newMessage', function() {
        if(
            ($scope.messages.length >= CONSTANTS.MAX_NUMBER_COMPOSER) ||
            ($scope.messages.length === 1 && $rootScope.mobileMode === true)
        ) {
            notify({message: gettextCatalog.getString('Maximum composer reached', null, 'Error'), classes: 'notification-danger'});
        } else {
            var message = new Message();
            initMessage(message, false);
        }
    });

    $rootScope.$on('loadMessage', function(event, message, save) {
        var current = _.findWhere($scope.messages, {ID: message.ID});
        var mess = new Message(_.pick(message, 'ID', 'AddressID', 'Subject', 'Body', 'From', 'ToList', 'CCList', 'BCCList', 'Attachments', 'Action', 'ParentID', 'IsRead', 'LabelIDs'));

        if(mess.NumAttachments > 0) {
            mess.attachmentsToggle = true;
        } else {
            mess.attachmentsToggle = false;
        }

        if(angular.isUndefined(current)) {
            initMessage(mess, save);
        }
    });

    $scope.$on('sendMessage', function(event, element) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];
        message && $scope.send(message);
    });

    $scope.$on('closeMessage', function(event, element) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];

        if (angular.isDefined(message)) {
            $scope.close(message, false, false);
        }
    });

    $scope.$on('editorLoaded', function(event, element, editor) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];

        if (message) {
            message.editor = editor;
            $scope.listenEditor(message);
            $scope.focusComposer(message);
        }
    });

    $scope.$on('editorFocussed', function(event, element, editor) {
        var composer = $(element).parents('.composer');
        var index = $('.composer').index(composer);
        var message = $scope.messages[index];

        if (angular.isDefined(message)) {
            $scope.focusComposer(message);
            message.autocompletesFocussed = false;
            message.ccbcc = false;
            message.attachmentsToggle = false;
        }

        $rootScope.$broadcast('composerModeChange');
    });

    $scope.$on('subjectFocussed', function(event, message) {
        var current = _.findWhere($scope.messages, {uid: message.uid});

        current.autocompletesFocussed = false;
        current.ccbcc = false;
        current.attachmentsToggle = false;
    });



    function onResize() {
        $timeout.cancel(timeoutStyle);

        timeoutStyle = $timeout(function() {
            $scope.composerStyle();
        }, 1000);
    }

    function onOrientationChange() {
        _.each($scope.messages, function(message) {
            $scope.focusComposer(message);
        });
    }

    function onDragOver(event) {


        /*
            event.preventDefault();
            if we disable the default behavior then
            the text can't be draged inside the iframe.
        */

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

        /* /!\ force digest over state change */
        $scope.$digest(function() {
            $scope.isOver = true;
        });

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
    $(window).on('orientationchange', onOrientationChange);
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
        window.onbeforeunload = undefined;
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
        var enabledAddresses = _.chain(authentication.user.Addresses)
            .where({Status: 1})
            .sortBy('Send')
            .value();
        var sender = enabledAddresses[0];

        if (angular.isDefined(message.AddressID)) {
            var originalAddress = _.findWhere(enabledAddresses, {ID: message.AddressID});

            if (angular.isDefined(originalAddress)) {
                sender = originalAddress;
            }
        }

        _.defaults(message, {
            ToList: [],
            CCList: [],
            BCCList: [],
            Subject: '',
            PasswordHint: '',
            Attachments: [],
            IsEncrypted: 0,
            Body: message.Body,
            From: sender
        });
    };

    $scope.slideDown = function(message) {
        message.attachmentsToggle = !!!message.attachmentsToggle;
    };

    $scope.onFocusSubject = function(message) {
        $rootScope.$broadcast('subjectFocussed', message);
    };


    $scope.cancelAskEmbedding = function(){
        $scope.pendingAttachements = [];
        $scope.askEmbedding = false;
    };

    $scope.processPending  = function(message, embedding){

        _.forEach($scope.pendingAttachements, function (file) {

            if(embedding) {
                // required for BE to get a cid-header
                file.inline = 1;
                // for loading UX
                // message.editor.insertImage("", {alt: file.name, id:file.name});

            }

            $scope.addAttachment(file, message);

        });

        // close the dialog
        $scope.cancelAskEmbedding();

    };


    $scope.dropzoneConfig = function(message) {
        return {
            options: {
                addRemoveLinks: false,
                dictDefaultMessage: gettextCatalog.getString('Drop a file here to upload', null, 'Info'),
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
                    dropzone = this;

                    var total_num = angular.isDefined(message.Attachments) ? message.Attachments.length : 0;
                    total_num += angular.isDefined(message.queuedFiles) ? message.queuedFiles : 0;

                    if (total_num === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
                        dropzone.removeFile(file);
                        done('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
                        notify({message: 'Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments', classes: 'notification-danger'});
                    } else if (totalSize >= (sizeLimit * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE)) {
                        dropzone.removeFile(file);
                        done('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/CONSTANTS.BASE_SIZE/CONSTANTS.BASE_SIZE)/10 + ' MB.');
                        notify({message: 'Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + Math.round(10*totalSize/CONSTANTS.BASE_SIZE/CONSTANTS.BASE_SIZE)/10 + ' MB.', classes: 'notification-danger'});
                    } else if (totalSize === 0) {
                        /* file is too big */
                        dropzone.removeFile(file);
                        done('Attachments are limited to ' + sizeLimit + ' MB.');
                        notify({message: 'Attachments are limited to ' + sizeLimit + ' MB.', classes: 'notification-danger'});
                    } else {
                        if (angular.isUndefined(message.queuedFiles)) {
                            message.queuedFiles = 0;
                            message.queuedFilesSize = 0;
                        }

                        message.queuedFiles++;
                        message.queuedFilesSize += file.size;

                        var process = function() {
                            message.queuedFiles--;
                            message.queuedFilesSize -= file.size;

                            // check if embedded before upload!
                            var img = new RegExp("image");
                            var isImg = img.test(file.type);

                            if (isImg) {
                                $scope.pendingAttachements.push(file);
                                // add attachment with embeded and include the img ?
                                dropzone.removeFile(file);
                                $scope.$applyAsync(() => { $scope.askEmbedding = true; });
                            } else {
                                $scope.addAttachment(file, message).finally(function () {
                                    dropzone.removeFile(file);
                                });
                            }
                        };

                        if (angular.isUndefined(message.ID)) {
                            if (angular.isUndefined(message.savePromise)) {
                                $scope.save(message, false, false, false); // message, forward, notification
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

                     /* /!\ force digest over state change */
                    $scope.$digest(function() {
                        $scope.isOver = false;
                    });

                },
                error: function(event) {

                    /* Notification is already handled by the accept method */
                    /*
                    var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

                    if(event.size > sizeLimit * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE) {
                        notify({message: 'Attachments are limited to ' + sizeLimit + ' MB.', classes: 'notification-danger'});
                    }
                    */
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

    $scope.decryptAttachments = function(message) {
        var removeAttachments = [];
        var promises = [];

        if (message.Attachments && message.Attachments.length > 0) {

            var keys = authentication.getPrivateKeys(message.From.ID);

            _.each(message.Attachments, function(attachment) {

                try {
                    // decode key packets
                    var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

                    var promise = pmcw.decryptSessionKey(keyPackets, keys).then(function(sessionKey) {
                        attachment.sessionKey = sessionKey;
                    }, function(error) {
                        notify({message: 'Error during decryption of the session key', classes: 'notification-danger'});
                        $log.error(error);
                        removeAttachments.push(attachment);
                    });

                    promises.push(promise);
                } catch(error) {
                    removeAttachments.push(attachment);
                }
            });
        }

        $q.all(promises).finally(function() {
            if (removeAttachments.length > 0) {
                _.each(removeAttachments, function(attachment) {
                    notify({classes: 'notification-danger', message: 'Decryption of attachment ' + attachment.Name + ' failed. It has been removed from this draft.'});
                    $scope.removeAttachment(attachment, message);
                });
            }

            if (_.find(message.Attachments, {isEmbedded: true}).length > 0) {
               _.each(message.Attachments, function(attachment) {
                   // $scope.addAttachment(file, message); // file ???
               });
            }
        });
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
        attachment.cancel(); // Also remove the attachment in the UI
        // FIXME Reload message/attachments from the server when this happens.
        // A late cancel might succeed on the back-end but not be reflected on the front-end
        // Need to be careful if there are currently-uploading attachments, an do autosave first
    };

    $scope.addAttachment = function(file, message) {
        var tempPacket = {};

        tempPacket.filename = file.name;
        tempPacket.uploading = true;
        tempPacket.Size = file.size;
        tempPacket.Inline = file.inline || 0;

        message.uploading++;
        message.Attachments.push(tempPacket);
        message.attachmentsToggle = true;
        $rootScope.$broadcast('composerModeChange');

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

        return attachments.load(file, message.From.Keys[0].PublicKey).then(
            function(packets) {
                var preview = packets.Preview;

                return attachments.upload(packets, message, tempPacket).then(
                    function(result) {

                        cleanup( result );

                        if(angular.isDefined( result.Headers['content-id'] ) && file.inline === 1) {
                            var cid = result.Headers['content-id'].replace(/[<>]+/g,'');
                            embedded.addEmbedded(message,cid,preview, result.MIMEType);
                        }

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

        var index = message.Attachments.indexOf(attachment);
        // Remove attachment in UI
        var headers = attachment.Headers;
        message.Attachments.splice(index, 1);

        Attachment.remove({
            "MessageID": message.ID,
            "AttachmentID": attachment.AttachmentID || attachment.ID
        }).then(function(result) {
            var data = result.data;

            if(angular.isDefined(data) && data.Code === 1000) {
                // Attachment removed, may remove embedded ref
                message.Body = embedded.removeEmbedded(message,headers);

            } else if (angular.isDefined(data) && angular.isDefined(data.Error)) {
                var mockFile = { name: attachment.Name, size: attachment.Size, type: attachment.MIMEType, ID: attachment.ID };
                message.Attachments.push(attachment);
                dropzone.options.addedfile.call(dropzone, mockFile);
                notify({message: data.Error, classes: 'notification-danger'});
            } else {
                notify({message: 'Error during the remove request', classes: 'notification-danger'});
                $log.error(result);
            }
        }, function(error) {
            notify({message: 'Error during the remove request', classes: 'notification-danger'});
            $log.error(error);
        });
    };

    /**
     * Add message in composer list
     * @param {Object} message
     * @param {Boolean} save
     */
    function initMessage(message, save) {
        if (authentication.user.Delinquent < 3) {
            // Not in the delinquent state
        } else {
            // In delinquent state
            notify({message: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'), classes: 'notification-danger'});
            return false;
        }

        if (authentication.user.ComposerMode === 1) {
            message.maximized = true;
            $rootScope.maximizedComposer = true;
        }

        // Mark message as read
        if (message.IsRead === 0) {
            var ids = [message.ID];

            action.readMessage(ids);
        }

        // if tablet we maximize by default
        if (tools.findBootstrapEnvironment() === 'sm') {
            message.maximized = true;
            if ($scope.messages.length > 0) {
                notify.closeAll();
                notify({message: gettextCatalog.getString('Maximum composer reached', null, 'Error'), classes: 'notification-danger'});
                return;
            }
        }

        message.uid = $scope.uid++;
        message.numTags = [];
        message.recipientFields = [];
        message.uploading = 0;
        message.toFocussed = false;
        message.autocompletesFocussed = false;
        message.ccbcc = false;
        $scope.messages.unshift(message);
        $scope.setDefaults(message);
        $scope.insertSignature(message);
        $scope.sanitizeBody(message);
        $scope.decryptAttachments(message);
        $scope.isOver = false;

        // This timeout is really important to load the structure of Squire
        $timeout(function() {
            $scope.composerStyle();
            // forward case: we need to save to get the attachments
            // embedded case: if has embedded image we have to save the attachments
            if (save === true) {
                $scope.save(message, save, false).then(function() { // message, forward, notification
                    $scope.decryptAttachments(message);
                    // check for the embedded images
                    // as it's a forward it won't process
                    // the decryption (thanks to service storage)

                    $scope.sanitizeBody(message);

                    $scope.composerStyle();


                }, function(error) {
                    $log.error(error);
                });
            }
        }, 100, false);
    }

    $scope.sanitizeBody = function(message) {

        message.Body = DOMPurify.sanitize(message.Body, {
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['style', 'input', 'form']
        });

        embedded.parser(message).then( function(result) {
           message.Body = result;
        });

    };

    $scope.composerStyle = function() {
        var composers = $('.composer');
        var environment = function() {
            if (!composers) { return; }

            var set = {};

            set.composerWidth = composers.eq(0).outerWidth();
            set.margin = ($('html').hasClass('ua-windows_nt')) ? 40 : 20;
            set.windowWidth = $('body').outerWidth();
            set.messagesCount = $scope.messages.length;
            set.isBootstrap = (tools.findBootstrapEnvironment() === 'xs') ? true : false;

            /*
            Is the available space enough ?
            */
            if (!set.isBootstrap && ((set.windowWidth / set.messagesCount) < set.composerWidth) ) {
                /* overlap is a ratio that will share equaly the space available between overlayed composers. */
                set.overlap = ((set.windowWidth - set.composerWidth - (2 * set.margin)) / (set.messagesCount - 1));
            }

            return set;
        };

        /* used as _ context */
        var context = environment();

        _.each(composers, function(composer, index) {
            var styles = { opacity: 1 };

            if (this.isBootstrap) {
                var top = 80; // px

                styles.top = top + 'px';
            } else {
                var c = this;
                var messagesCount = c.messagesCount;
                var margin = c.margin;
                var isCurrent = ((messagesCount - index) === messagesCount) ? true : false;

                if (isCurrent) {
                    // set the current composer to right : margin
                    styles.right = margin;
                } else {
                    var composerWidth = c.composerWidth;
                    var windowWidth = c.windowWidth;
                    var innerWindow = c.innerWindow;
                    var overlap = c.overlap;

                    styles.right = (overlap) ? (index * overlap) : (index * (composerWidth + margin) + margin);
                    styles.top = '';
                }
            }

            /* Set the new styles */
            $timeout(function() {
                $(composer).css(styles);
            }, 250);
        }, context);
    };

    /**
     * Insert / Update signature in the message body
     * @param {Object} message
     */
    $scope.insertSignature = function(message) {
        message.Body = (angular.isUndefined(message.Body))? '' : message.Body;

        var content = (angular.isUndefined(message.From.Signature))?authentication.user.Signature:message.From.Signature;
            content = DOMPurify.sanitize(content, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });

        var $content = $('<div>' + content + '</div>'),
            signature = "",
            newSign = false,
            space = "<div><br /></div>",
            className = "protonmail_signature_block";

        var currentBody = $.parseHTML(message.Body),
            tempDOM = angular.element('<div>').append(currentBody);

        // use children to match only first-child signatures (reply/forward case)
        var countSignatures = tempDOM.children('.'+className).length,
            firstSignature = tempDOM.children('.protonmail_signature_block:first'),
            firstQuote = tempDOM.children('.protonmail_quote:first'),
            countQuotes = tempDOM.find('.protonmail_quote').length;

        if ($content.text().length === 0 && $content.find('img').length === 0){
            // remove the empty DOM elements
            content = "";
        }

        var PMSignature = authentication.user.PMSignature ? CONSTANTS.PM_SIGNATURE : '';

        if(content !== '' || PMSignature !== ''){
            signature = DOMPurify.sanitize('<div class="'+className+'">' + tools.replaceLineBreaks(content + PMSignature + space) +'</div>', {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        }


        if ( countSignatures > 0) {
            // update the first signature (reply/foward case)
            // .first() + replace fail, use :first selector
            firstSignature.replaceWith(signature);

        } else {
            // insert signature at the right place
            (countQuotes > 0) ? firstQuote.before(signature) : tempDOM.append(signature);

            newSign = true;
            firstSignature = tempDOM.children('.protonmail_signature_block:first');
        }


        /* Handle free space around the signature */

       if( firstQuote.prevAll("div").length === 0 && newSign) {
          firstQuote.before(space + space);
       }

       if(firstSignature.prevAll("div").length === 0  && newSign) {
          firstSignature.before(space + space);
       }

       message.Body = tempDOM.html();
       message.editor && message.editor.fireEvent("refresh");


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
                        $(element).css('z-index', ($scope.messages.length + (iteratee - index))*100);
                    } else {
                        $(element).css('z-index', ($scope.messages.length)*100);
                    }
                });

                var bottom = $('.composer').eq($('.composer').length-1);
                var bottomTop = bottom.css('top');
                var bottomZ = bottom.css('zIndex');
                var clicked = $('.composer').eq(index);
                var clickedTop = clicked.css('top');
                var clickedZ = clicked.css('zIndex');

                if (clickedZ==='auto') {
                    clickedZ = 100; // fix for mobile safari issue
                }

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
                        element.zIndex = ($scope.messages.length - (iteratee - index))*100;
                    } else {
                        element.zIndex = ($scope.messages.length)*100;
                    }
                });
            }

            // focus correct field
            var composer = angular.element('#uid' + message.uid);

            if ((message.ToList.length+message.CCList.length+message.BCCList.length) === 0) {
                $timeout(function () {
                    $scope.focusTo(message);
                });
            } else if (message.Subject.length === 0) {
                $(composer).find('.subject').focus();
            } else if (message.editor) {
                message.editor.focus();
            }

            _.each($scope.messages, function(m) {
                m.focussed = false;
            });

            message.focussed = true;
        }
    };

    /**
     * Watcher onInput to find and remove attachements if we remove an embedded
     * image from the input
     * @return {Function} Taking message as param
     */
    function removerEmbeddedWatcher() {
        let latestCids = [];

        return (message) => {
            const input = message.editor.getHTML() || '' ;

            // Extract CID per embedded image
            const cids = (input.match(/rel=("([^"]|"")*")/g) || [])
                .map((value) => value.split('rel="')[1].slice(0, -1));

            // If we add or remove an embedded image, the diff is true
            if (cids.length !== latestCids.length) {
                // Find attachements not in da input
                const AttToRemove = message
                    .Attachments
                    .filter((attachment) => {

                        // If the file is uploading it means: its first time
                        if (attachment.uploading) {
                            return false;
                        }

                        const cid = attachment.Headers['content-id'].replace(/[<>]+/g, '');
                        return cids.indexOf(cid) === -1;
                    });

                if (AttToRemove.length) {
                    AttToRemove
                        .forEach((att) => $scope.removeAttachment(att, message));
                }
            }

            latestCids = cids;
        };
    }

    $scope.listenEditor = function(message) {

        const watcherEmbedded = removerEmbeddedWatcher();

        if (message.editor) {
            var dropzone = angular.element('#uid' + message.uid + ' .composer-dropzone')[0];

            message.editor.addEventListener('focus', function() {
                $scope
                    .$applyAsync(() => {
                        message.ccbcc = false;
                    });
            });

            message.editor.addEventListener('input', function() {
                watcherEmbedded(message);
                $scope.saveLater(message);
            });

            message.editor.addEventListener('dragstart', onDragStart);
            message.editor.addEventListener('dragend', onDragEnd);
            message.editor.addEventListener('dragenter', onDragEnter);
            message.editor.addEventListener('dragover', onDragOver);
            dropzone.addEventListener('dragover', dragover);

            $scope.saveOld(message);
        }

    };

    $scope.attToggle = function(message) {
        message.attachmentsToggle = !!!message.attachmentsToggle;
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.attHide = function(message) {
        message.attachmentsToggle = false;
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.toggleCcBcc = function(message) {
        message.ccbcc = !!!message.ccbcc;
        message.autocompletesFocussed = true;
        message.attachmentsToggle = false;
    };

    $scope.hideFields = function(message) {
        message.ccbcc = false;
    };

    $scope.togglePanel = function(message, panelName) {
        if (message.displayPanel === true) {
            $scope.closePanel(message);
        } else {
            $scope.openPanel(message, panelName);
        }
    };

    $scope.openPanel = function(message, panelName) {
        message.displayPanel = true;
        message.panelName = panelName;

        if (panelName === 'encrypt') {
            $timeout(function() {
                 angular.element('#uid' + message.uid + ' input[name="outsidePw"]').focus();
            });
        }
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

    /**
     * Intialize the expiration panel
     * @param {Object} message
     * @param {Object} params
     */
    $scope.initExpiration = function(message, params) {
        var hours = 0;
        var days = 0;
        var weeks = 0;

        if(angular.isDefined(message.ExpirationTime)) {
            hours = message.ExpirationTime / 3600;
            days = Math.floor(hours / 24);
            hours = hours % 24;
            weeks = Math.floor(days / 7);
            days = days % 7;
        }

        params.expirationWeeks = _.findWhere($scope.weekOptions, {value: weeks});
        params.expirationDays = _.findWhere($scope.dayOptions, {value: days});
        params.expirationHours = _.findWhere($scope.hourOptions, {value: hours});
    };

    /**
     * Set expiration time if valid value
     * @param {Object} message
     * @param {Object} params
     */
    $scope.setExpiration = function(message, params) {
        var hours = params.expirationHours.value + params.expirationDays.value * 24 + params.expirationWeeks.value * 24 * 7;
        var error = false;

        if (parseInt(hours) > CONSTANTS.MAX_EXPIRATION_TIME) { // How can we enter in this situation?
            notify({message: 'The maximum expiration is 4 weeks.', classes: 'notification-danger'});
            error = true;
        }

        if (isNaN(hours)) {
            notify({message: 'Invalid expiration time.', classes: 'notification-danger'});
             error = true;
        }

        if(error === false) {
            message.ExpirationTime = hours * 3600; // seconds
        }
    };

    /**
     * Remove expiration time value
     * @param {Object} message
     */
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

    /**
     * Delay the saving
     * @param {Object} message
     */
    $scope.saveLater = function(message) {
        if(angular.isDefined(message.timeoutSaving)) {
            $timeout.cancel(message.timeoutSaving);
        }

        message.timeoutSaving = $timeout(function() {
            if($scope.needToSave(message)) {
                $scope.save(message, false, false, true); // message, forward, notification, autosaving
            }
        }, CONSTANTS.SAVE_TIMEOUT_TIME); // 3 seconds
    };

    $scope.validate = function(message) {
        var deferred = $q.defer();

        angular.element('input').blur();

        // We delay the validation to let the time for the autocomplete
        $timeout(function() {
            // set msgBody input element to editor content
            message.setMsgBody();

            // Check if there is an attachment uploading
            if (message.uploading === true) {
                deferred.reject('Wait for attachment to finish uploading or cancel upload.');
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
                deferred.reject('Invalid email(s): ' + invalidEmails.join(',') + '.');
                return false;
            }

            // MAX 25 to, cc, bcc
            if ((message.ToList.length + message.BCCList.length + message.CCList.length) > 25) {
                deferred.reject('The maximum number (25) of Recipients is 25.');
                return false;
            }

            if (message.ToList.length === 0 && message.BCCList.length === 0 && message.CCList.length === 0) {
                deferred.reject('Please enter at least one recipient.');
                return false;
            }

            // Check title length
            if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
                deferred.reject('The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.');
                return false;
            }

            // Check body length
            if (message.Body.length > 16000000) {
                deferred.reject('The maximum length of the message body is 16,000,000 characters.');
                return false;
            }

            deferred.resolve();
        }, 500);

        return deferred.promise;
    };

    /**
     * Call when the user change the FROM
     * @param {Resource} message - Message to save
     */
    $scope.changeFrom = function(message) {
        $scope.insertSignature(message);

        // save when DOM is updated
        $scope.save(message, false, false, true);
    };

    /**
     * Save the Message
     * @param {Resource} message - Message to save
     * @param {Boolean} forward - Forward case
     * @param {Boolean} notification - Add a notification when the saving is complete
     * @param {Boolean} autosaving
     */
    $scope.save = function(message, forward, notification, autosaving) {
        // Variables
        var deferred = $q.defer();
        var parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead')
        };

        // Functions
        // Schedule this save after the in-progress one completes
        var nextSave = function(result) {
            return $scope.save(message, forward, notification);
        };

        if(angular.isDefined(message.timeoutSaving)) {
            $timeout.cancel(message.timeoutSaving);
        }

        if(message.saving === true && message.savePromise) {
            message.savePromise = message.savePromise.then(nextSave, nextSave);
            deferred.resolve(message.savePromise);
        } else {
            message.saving = true;
            message.autosaving = autosaving || false;

            if(angular.isUndefined(parameters.Message.Subject)) {
                parameters.Message.Subject = '';
            }

            if(angular.isString(parameters.Message.ToList)) {
                parameters.Message.ToList = [];
            }

            if(angular.isString(parameters.Message.CCList)) {
                parameters.Message.CCList = [];
            }

            if(angular.isString(parameters.Message.BCCList)) {
                parameters.Message.BCCList = [];
            }

            if(angular.isDefined(message.ParentID)) {
                parameters.ParentID = message.ParentID;
                parameters.Action = message.Action;
            }

            if (angular.isDefined(message.ID)) {
                parameters.id = message.ID;
            } else {
                parameters.Message.IsRead = 1;
            }

            if (autosaving === false) {
                parameters.Message.IsRead = 1;
            }

            parameters.Message.AddressID = message.From.ID;

            // Encrypt message body with the first public key for the From address
            message.encryptBody(message.From.Keys[0].PublicKey)
            .then(function(result) {
                var draftPromise;
                var CREATE = 1;
                var UPDATE = 2;
                var actionType;


                // Set encrypted body
                parameters.Message.Body = result;

                if(angular.isDefined(message.ID)) {
                    draftPromise = Message.updateDraft(parameters).$promise;
                    actionType = UPDATE;
                } else {
                    draftPromise = Message.createDraft(parameters).$promise;
                    actionType = CREATE;
                }

                // Save draft before to send
                draftPromise
                .then(function(result) {
                    if(angular.isDefined(result) && result.Code === 1000) {
                        var events = [];
                        var conversation = cache.getConversationCached(result.Message.ConversationID);
                        var numUnread = angular.isDefined(conversation) ? conversation.NumUnread : 0;
                        var numMessages;

                        if (actionType === CREATE) {
                            numMessages = angular.isDefined(conversation) ? (conversation.NumMessages + 1) : 1;
                        } else if (actionType === UPDATE) {
                            numMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
                        }

                        message.ID = result.Message.ID;
                        message.IsRead = result.Message.IsRead;
                        message.Time = result.Message.Time;

                        if(forward === true && result.Message.Attachments.length > 0) {
                            message.Attachments = result.Message.Attachments;
                            message.attachmentsToggle = true;
                        }

                        result.Message.Senders = [result.Message.Sender]; // The back-end doesn't return Senders so need a trick
                        result.Message.Recipients = _.uniq(result.Message.ToList.concat(result.Message.CCList).concat(result.Message.BCCList)); // The back-end doesn't return Recipients

                        $scope.saveOld(message);

                        // Update draft in message list
                        events.push({Action: actionType, ID: result.Message.ID, Message: result.Message});

                        // Generate conversation event
                        events.push({Action: 3, ID: result.Message.ConversationID, Conversation: {
                            NumAttachments: result.Message.Attachments.length,
                            NumMessages: numMessages,
                            NumUnread: numUnread,
                            Recipients: result.Message.Recipients,
                            Senders: result.Message.Senders,
                            Subject: result.Message.Subject,
                            ID: result.Message.ConversationID,
                            LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
                        }});

                        // Send events
                        cache.events(events);

                        if(notification === true) {
                            notify({message: gettextCatalog.getString('Message saved', null), classes: 'notification-success'});
                        }

                        message.saving = false;
                        message.autosaving = false;

                        deferred.resolve(result);
                    } else if (angular.isDefined(result) && result.Code === 15033) {
                        // Case where the user delete draft in an other terminal
                        delete message.ID;
                        message.saving = false;
                        message.autosaving = false;
                        deferred.resolve($scope.save(message, forward, notification));
                    } else if (angular.isDefined(result) && result.Error) {
                        // Errors from backend
                        message.saving = false;
                        message.autosaving = false;
                        deferred.reject(result.Error);
                    } else {
                        message.saving = false;
                        message.autosaving = false;
                        deferred.reject(result);
                    }
                }, function(error) {
                    message.saving = false;
                    message.autosaving = false;
                    error.message = 'Error during the draft request';
                    deferred.reject(error);
                });
            }, function(error) {
                message.saving = false;
                message.autosaving = false;
                error.message = 'Error encrypting message';
                deferred.reject(error);
            });

            message.savePromise = deferred.promise.finally(function() {
                message.saving = false;
                message.autosaving = false;
            });
        }

        if (autosaving === false) {
            networkActivityTracker.track(deferred.promise);
        }

        return deferred.promise;
    };

    /**
     * Return the subject title of the composer
     */
     $scope.subject = function(message) {
        return message.Subject || gettextCatalog.getString('New message', null, 'Title');
     };

    /**
     * Check if the subject of this message is empty
     * And ask the user to send anyway
     * @param {Object} message
     */
    $scope.checkSubject = function(message) {
        var deferred = $q.defer();
        var title = gettextCatalog.getString('No subject', null, 'Title');
        var text = gettextCatalog.getString('No subject, send anyway?', null, 'Info');

        if(angular.isUndefined(message.Subject) || message.Subject.length === 0) {
            message.Subject = '';
            confirmModal.activate({
                params: {
                    title: title,
                    message: text,
                    confirm: function() {
                        confirmModal.deactivate();
                        deferred.resolve();
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                        deferred.reject();
                    }
                }
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    /**
     * Try to send message specified
     * @param {Object} message
     */
    $scope.send = function(msg) {

        // Prevent mutability
        const message = new Message(msg);

        var deferred = $q.defer();
        $scope.validate(message)
        .then(function() {
            embedded.parser(message,'cid').then(function(result) {
                message.Body = result;
                $scope.save(message, false, false, false)
                .then(function() {
                    $scope.checkSubject(message).then(function() {
                        message.encrypting = true;
                        var parameters = {};
                        var emails = message.emailsToString();

                        parameters.id = message.ID;
                        parameters.ExpirationTime = message.ExpirationTime;
                        message.getPublicKeys(emails)
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                var keys = result.data; // Save result in keys variables
                                var outsiders = false; // Initialize to false a Boolean variable to know if there are outsiders email in recipients list
                                var promises = [];

                                parameters.Packages = [];

                                _.each(emails, function(email) {
                                    // Inside user
                                    if(keys && keys[email].length > 0) {
                                        var key = keys[email];

                                        // Encrypt content body in with the public key user
                                        promises.push(message.encryptBody(key).then(function(result) {
                                            var body = result;

                                            // Encrypt attachments with the public key
                                            return message.encryptPackets(key).then(function(keyPackets) {
                                                return parameters.Packages.push({Address: email, Type: 1, Body: body, KeyPackets: keyPackets});
                                            });
                                        }));
                                    }
                                    // Outside user
                                    else {
                                        outsiders = true;

                                        if(message.IsEncrypted === 1) {
                                            var replyToken = message.generateReplyToken();
                                            var replyTokenPromise = pmcw.encryptMessage(replyToken, [], message.Password);

                                            promises.push(replyTokenPromise.then(function(encryptedToken) {
                                                return pmcw.encryptMessage(message.Body, [], message.Password).then(function(result) {

                                                    var body = result;

                                                    return message.encryptPackets('', message.Password).then(function(result) {
                                                        var keyPackets = result;

                                                        return parameters.Packages.push({Address: email, Type: 2, Body: body, KeyPackets: keyPackets, PasswordHint: message.PasswordHint, Token: replyToken, EncToken: encryptedToken});
                                                    }, function(error) {
                                                        message.encrypting = false;
                                                        $log.error(error);
                                                    });
                                                }, function(error) {
                                                    message.encrypting = false;
                                                    $log.error(error);
                                                });

                                            }, function(error) {
                                                message.encrypting = false;
                                                $log.error(error);
                                            }));
                                        }
                                    }
                                });

                                // If there are some outsiders
                                if(outsiders === true && message.IsEncrypted === 0) {
                                    parameters.AttachmentKeys = [];
                                    parameters.ClearBody = message.Body; // Add a clear body in parameter

                                    if(message.Attachments.length > 0) {
                                        // Add clear attachments packet in parameter
                                        promises.push(message.clearPackets().then(function(packets) {
                                            parameters.AttachmentKeys = packets;
                                        }, function(error) {
                                            $log.error(error);
                                        }));
                                    }
                                }

                                // When all promises are complete
                                $q.all(promises).then(function() {
                                    if (outsiders === true && message.IsEncrypted === 0 && message.ExpirationTime) {
                                        $log.error(message);
                                        message.encrypting = false;
                                        deferred.reject(new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.'));
                                    } else {
                                        message.encrypting = false;
                                        message.sending = true;
                                        Message.send(parameters).$promise.then(function(result) {
                                            if (angular.isDefined(result.Error)) {
                                                message.sending = false;
                                                deferred.reject(new Error(result.Error));
                                            } else {
                                                var events = [];
                                                var messages = cache.queryMessagesCached(result.Sent.ConversationID);
                                                var conversation = cache.getConversationCached(result.Sent.ConversationID);
                                                var numMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
                                                var numUnread = angular.isDefined(conversation) ? conversation.NumUnread : 0;

                                                message.sending = false; // Change status
                                                result.Sent.Senders = [result.Sent.Sender]; // The back-end doesn't return Senders so need a trick
                                                result.Sent.Recipients = _.uniq(message.ToList.concat(message.CCList).concat(message.BCCList)); // The back-end doesn't return Recipients
                                                events.push({Action: 3, ID: result.Sent.ID, Message: result.Sent}); // Generate event for this message

                                                if (result.Parent) {
                                                    events.push({Action: 3, ID: result.Parent.ID, Message: result.Parent});
                                                }

                                                events.push({Action: 3, ID: result.Sent.ConversationID, Conversation: {
                                                    NumMessages: numMessages,
                                                    NumUnread: numUnread,
                                                    Recipients: result.Sent.Recipients,
                                                    Senders: result.Sent.Senders,
                                                    Subject: result.Sent.Subject,
                                                    ID: result.Sent.ConversationID,
                                                    LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.sent],
                                                    LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
                                                }});

                                                cache.events(events); // Send events to the cache manager
                                                notify({message: gettextCatalog.getString('Message sent', null), classes: 'notification-success'}); // Notify the user
                                                $scope.close(message, false, false); // Close the composer window

                                                $timeout(function() {
                                                    $stateParams.message = result.Sent.ID; // Define target ID
                                                    $rootScope.$broadcast('initMessage', result.Sent.ID, true); // Scroll and open the message sent
                                                }, 500);

                                                deferred.resolve(result); // Resolve finally the promise
                                            }
                                        }, function(error) {
                                            message.sending = false;
                                            error.message = 'There was a problem sending your message. Please try again.';
                                            deferred.reject(error);
                                        });
                                    }
                                }, function(error) {
                                    message.encrypting = false;
                                    error.message = 'Error during the promise preparation';
                                    deferred.reject(error);
                                });
                            } else {
                                message.encrypting = false;
                                error.message = 'Error during get public keys user request';
                                deferred.reject(error);
                            }
                        }, function(error) {
                            message.encrypting = false;
                            error.message = 'Error getting the public key';
                            deferred.reject(error);
                        });
                    }, function(error) {
                        deferred.reject();
                    });
                }, function(error) {
                    deferred.reject(); // Don't add parameter in the rejection because $scope.save already do that.
                });

            });
        }, function(error) {
            deferred.reject(error);
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     * Focus the first not minimized composer window
     * @param {Object} message
     * @param {Boolean} discard
     * @param {Boolean} save
     */

    $scope.focusFirstComposer = function(message) {
        var messageFocussed = !!message.focussed;
        var isFocusable = _.find($scope.messages, function (x) { return x.minimized === false; });
        if(messageFocussed && !angular.isUndefined(isFocusable)) {
            $scope.focusComposer(isFocusable);
        }
    };

    $scope.minimize = function(message) {
        message.minimized = true;
        message.previousMaximized = message.maximized;
        message.maximized = false;
        $rootScope.maximizedComposer = false;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        $scope.focusFirstComposer(message);
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.unminimize = function(message) {
        message.minimized = false;
        message.maximized = message.previousMaximized;
        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.maximize = function(message) {
        message.maximized = true;
        $rootScope.maximizedComposer = true;
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.normalize = function(message) {
        message.minimized = false;
        message.maximized = false;
        $rootScope.maximizedComposer = false;
        $rootScope.$broadcast('composerModeChange');
    };

    $scope.openCloseModal = function(message, save) {
        var dropzones = $('#uid' + message.uid + ' .composer-dropzone');

        message.editor.removeEventListener('input', function() {
            $scope.saveLater(message);
        });

        message.editor.removeEventListener('DOMNodeRemoved');

        message.editor.removeEventListener('dragenter', onDragEnter);
        message.editor.removeEventListener('dragover', onDragOver);
        message.editor.removeEventListener('dragstart', onDragStart);
        message.editor.removeEventListener('dragend', onDragEnd);

        // We need to manage step by step the dropzone in the case where the composer is collapsed
        if(angular.isDefined(dropzones) && angular.isDefined(_.first(dropzones))) {
            _.first(dropzones).removeEventListener('dragover', dragover);
        }

        $scope.close(message, false, true);
    };


    /**
     * Remove a message from the list of messages
     * @param  {Array} list    List of messages
     * @param  {Ressource} message Message to remove
     * @return {Array}
     */
    function removeMessage(list, message) {
        return _.filter(list, (item) => message.ID !== item.ID);
    }

    /**
     * Close the composer window
     * @param {Object} message
     * @param {Boolean} discard
     * @param {Boolean} save
     */
    $scope.close = function(message, discard, save) {

        if(discard === true && angular.isDefined(message.ID)) {
            $scope.discard(message);
        }

        $rootScope.activeComposer = false;
        $rootScope.maximizedComposer = false;

        if (save === true) {
            $scope.save(message, true, false, false);
        }

        message.close();

        // Remove message in composer controller
        $scope.messages = removeMessage($scope.messages, message);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();

        // Message closed and focussed?
        $scope.focusFirstComposer(message);

        $timeout(function () {
            $scope.composerStyle();
        }, 250);
    };

    /**
     * Move draft message to trash
     * @param {Object} message
     * @return {Promise}
     */
    $scope.discard = function(message) {
        var title = gettextCatalog.getString('Delete', null);
        var question = gettextCatalog.getString('Permanently delete this draft?', null);

        confirmModal.activate({
            params: {
                title: title,
                message: question,
                confirm: function() {
                    action.discardMessage(message);
                    notify({message: gettextCatalog.getString('Message discarded', null), classes: 'notification-success'});
                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Transform the recipients list to a string
     * @param {Object} message
     * @return {String}
     */
    $scope.recipients = function(message) {
        var recipients = [];

        if (message.ToList.length > 0) {
            recipients = recipients.concat(_.map(message.ToList, function(contact, index) {
                if (index === 0) {
                    return gettextCatalog.getString('To', null, 'Title') + ': ' + $filter('contact')(contact, 'Name');
                } else {
                    return $filter('contact')(contact, 'Name');
                }
            }));
        }

        if (message.CCList.length > 0) {
            recipients = recipients.concat(_.map(message.CCList, function(contact, index) {
                if (index === 0) {
                    return gettextCatalog.getString('CC', null, 'Title') + ': ' + $filter('contact')(contact, 'Name');
                } else {
                    return $filter('contact')(contact, 'Name');
                }
            }));
        }

        if (message.BCCList.length > 0) {
            recipients = recipients.concat(_.map(message.BCCList, function(contact, index) {
                if (index === 0) {
                    return gettextCatalog.getString('BCC', null, 'Title') + ': ' + $filter('contact')(contact, 'Name');
                } else {
                    return $filter('contact')(contact, 'Name');
                }
            }));
        }


        return recipients.join(', ');
    };

    /**
     * Display fields (To, Cc, Bcc) and focus the input in the To field.
     * @param {Object} message
     */
    $scope.focusTo = function(message) {
        var input = angular.element('#uid' + message.uid + ' .toRow input.new-value-email');

        message.autocompletesFocussed = true;

        $timeout(function() {
            input.focus();
        });
    };

    $scope.focusNextInput = function(event) {
        angular.element(event.target).parent().find('input.new-value-email:first').focus();
    };

    /**
     * Give the focus inside the content editor
     * @param {Object} message
     * @param {Object} event
     */
    $scope.focusEditor = function(message, event) {
        event.preventDefault();
        message.editor.focus();
    };

    /**
     * Return if emails value has correct format
     * @param {Object} message
     * @return {Boolean}
     */
    $scope.emailsAreValid = function(message) {
        var emails = message.ToList.concat(message.CCList).concat(message.BCCList);

        return _.where(emails, {invalid: true}).length === 0;
    };
});
