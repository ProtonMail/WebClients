angular.module("proton.models.message", ["proton.constants"])

.factory("Message", function(
    $resource,
    $rootScope,
    $compile,
    $templateCache,
    $interval,
    $timeout,
    $q,
    $state,
    authentication,
    localStorageService,
    pmcw,
    CONSTANTS,
    networkActivityTracker,
    notify,
    tools
) {

    var invertedMailboxIdentifiers = _.invert(CONSTANTS.MAILBOX_IDENTIFIERS);
    var Message = $resource(
        authentication.baseURL + '/messages/:id',
        authentication.params({
            id: '@id'
        }), {
            // POST
            send: {
                method: 'post',
                url: authentication.baseURL + '/messages/send'
            },
            reply: {
                method: 'post',
                url: authentication.baseURL + '/messages/reply/:id'
            },
            replyAll: {
                method: 'post',
                url: authentication.baseURL + '/messages/replyall/:id'
            },
            forward: {
                method: 'post',
                url: authentication.baseURL + '/messages/forward/:id'
            },
            draft: {
                method: 'post',
                url: authentication.baseURL + '/messages/draft/:id'
            },
            // GET
            latest: {
                method: 'get',
                url: authentication.baseURL + '/messages/latest/:time'
            },
            unreaded: {
                method: 'get',
                url: authentication.baseURL + '/messages/unread'
            },
            // PUT
            star: {
                method: 'put',
                url: authentication.baseURL + '/messages/star'
            },
            unstar: {
                method: 'put',
                url: authentication.baseURL + '/messages/unstar'
            },
            read: {
                method: 'put',
                url: authentication.baseURL + '/messages/read'
            },
            unread: {
                method: 'put',
                url: authentication.baseURL + '/messages/unread'
            },
            trash: {
                method: 'put',
                url: authentication.baseURL + '/messages/trash'
            },
            inbox: {
                method: 'put',
                url: authentication.baseURL + '/messages/inbox'
            },
            spam: {
                method: 'put',
                url: authentication.baseURL + '/messages/spam'
            },
            archive: {
                method: 'put',
                url: authentication.baseURL + '/messages/archive'
            },
            // DELETE
        }
    );

    _.extend(Message.prototype, {
        readableTime: function() {
            return this.moment().format('LL');
        },
        longReadableTime: function() {
            var dt = this.moment();
            return dt.format('LLL') + " (" + dt.fromNow() + ")";
        },
        moment: function() {
            if (!this._moment) {
                var time = this.Time;
                if (_.isString(time)) {
                    time = parseInt(time);
                }
                this._moment = moment.unix(time);
            }
            return this._moment;
        },
        toggleStar: function() {
            this.Tag = this.Tag === "starred" ? "" : "starred";
            return this.$patch({
                action: this.Tag === 'starred' ? "star" : "unstar"
            });
        },
        moveTo: function(location) {
            // If location is given as a name ('inbox', 'sent', etc), convert it to identifier (0, 1, 2)
            if (_.has(CONSTANTS.MAILBOX_IDENTIFIERS, location)) {
                this.Location = CONSTANTS.MAILBOX_IDENTIFIERS[location];
            } else {
                this.Location = location;
            }

            this.selected = false; // unselect the message

            return this.$patch({
                action: invertedMailboxIdentifiers[this.Location]
            });
        },
        setReadStatus: function(status) {
            var location = $state.current.name.replace('secured.', '');

            this.IsRead = +status;
            // $rootScope.unreadCount = $rootScope.unreadCount + (status ? -1 : 1); TODO adapt with location
            return this.$patch({ action: status ? "read" : "unread"});
        },
        delete: function() {
            return this.$delete();
        },
        numberOfAttachments: function() {
            return this.AttachmentIDList.split(",").length;
        },
        location: function() {
            return invertedMailboxIdentifiers[this.Location];
        },

        isDraft: function() {
            return this.Location === CONSTANTS.MAILBOX_IDENTIFIERS.drafts;
        },

        toggleImages: function() {
            this.imagesHidden = !!!this.imagesHidden;
        },

        plainText: function() {
            var body = this._decryptedBody || this.MessageBody;

            return body;
        },

        setMsgBody: function() {
            var messageBody;

            // get the message content from either the editor or textarea if its iOS
            // if its iOS / textarea we need to replace natural linebreaks with HTML linebreaks
            if ($rootScope.isMobile) {
                messageBody = this.messageBody.replace(/(?:\r\n|\r|\n)/g, '<br />');
            } else {
                messageBody = this.MessageBody;
                messageBody = tools.fixImages(messageBody);
            }

            // if there is no message body we "pad" with a line return so encryption and decryption doesnt break
            if (messageBody.trim().length < 1) {
                messageBody = '\n';
            }
            // Set input elements
            this.MessageBody = messageBody;
        },

        validate: function(draft) {
            _.defaults(this, {
                RecipientList: '',
                CCList: '',
                BCCList: '',
                MessageTitle: '',
                MessageBody: ''
            });

            // set msgBody input element to editor content
            this.setMsgBody();

            // TODO
            // attachment session keys decrypted
            // if($('.attachment-link.nokey').length) {
            //     notify('Attachments not ready. Please wait and try again.');
            //     return false;
            // }

            // set session keys
            // setSessionKeys();

            // Check internet connection
            //if ((window.navigator.onLine !== true && location.hostname != 'localhost') ||
            // if (!tools.hostReachable()) {
            //     notify('No internet connection. Please wait and try again.');
            //     return false;
            // }

            // Check if there is an attachment uploading
            // if ($('.fileUploading').length !== 0) {
            //     notify('Wait for attachment to finish uploading or cancel upload.');
            //     return false;
            // }

            // Check all emails to make sure they are valid
            var invalidEmails = '';
            var allEmails = this.RecipientList + this.CCList + this.BCCList;

            allEmails = allEmails.split(',');

            for (i = 0; i < allEmails.length; i++) {
                if (allEmails[i].trim() !== '') {
                    if (!tools.validEmail(allEmails[i])) {
                        if (invalidEmails === '') {
                            invalidEmails = allEmails[i].trim();
                        } else {
                            invalidEmails += ', ' + allEmails[i].trim();
                        }
                    }
                }
            }

            if (invalidEmails !== '') {
                notify('Invalid email(s): ' + invalidEmails + '.');
                return false;
            }

            // MAX 25 to, cc, bcc
            var rl = this.RecipientList.split(',');
            var ccl = this.CCList.split(',');
            var bccl = this.BCCList.split(',');

            if (!!!draft) {
                if ((rl.length + ccl.length + bccl.length) > 25) {
                    notify('The maximum number (25) of Recipients is 25.');
                    return false;
                }

                if (this.RecipientList.trim().length === 0 && this.BCCList.trim().length === 0 && this.CCList.trim().length === 0) {
                    notify('Please enter at least one recipient.');
                    // TODO focus RecipientList
                    return false;
                }
            }

            // Check title length
            if (this.MessageTitle && this.MessageTitle.length > CONSTANTS.MAX_TITLE_LENGTH) {
                notify('The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.');
                // TODO $('#MessageTitle').focus();
                return false;
            }

            // Check body length
            if (this.msgBody && this.msgBody.length > 16000000) {
                notify('The maximum length of the message body is 16,000,000 characters.');
                return false;
            }

            return this.needToSave();
        },

        close: function() {
            if(angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }
        },

        saveLater: function(silently) {
            if(angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }

            this.timeoutSaving = $timeout(function() {
                this.save(silently);
            }.bind(this), CONSTANTS.SAVE_TIMEOUT_TIME);
        },

        needToSave: function() {
            if(angular.isDefined(this.old)) {
                var properties = ['MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'MessageBody', 'PasswordHint', 'IsEncrypted'];
                var currentMessage = _.pick(this, properties);
                var oldMessage = _.pick(this.old, properties);

                return JSON.stringify(oldMessage) !== JSON.stringify(currentMessage);
            } else {
                return true;
            }
        },

        saveOld: function() {
            var properties = ['MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'MessageBody', 'PasswordHint', 'IsEncrypted'];

            this.old = _.pick(this, properties);

            _.defaults(this.old, {
                BCCList: "",
                CCList: "",
                MessageTitle: "",
                RecipientList: ""
            });
        },

        save: function(silently) {
            if (this.validate(true)) { // draft mode
                var newMessage = new Message(_.pick(this, 'MessageID', 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint', 'IsEncrypted'));
                this.saveOld();
                _.defaults(newMessage, {
                    RecipientList: '',
                    CCList: '',
                    BCCList: '',
                    MessageTitle: '',
                    PasswordHint: '',
                    Attachments: [],
                    IsEncrypted: 0
                });

                if (this.Attachments) {
                    newMessage.Attachments = _.map(this.Attachments, function(att) {
                        return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType');
                    });
                }

                newMessage.MessageBody = {
                    outsiders: ''
                };

                pmcw.encryptMessage(this.MessageBody, authentication.user.PublicKey).then(function(result) {
                    newMessage.MessageBody.self = result;

                    var newDraft = angular.isUndefined(this.MessageID);
                    var draftPromise;

                    if (newDraft) {
                        draftPromise = newMessage.$saveDraft();
                    } else {
                        draftPromise = newMessage.$updateDraft();
                    }

                    draftPromise.then(function(result) {
                        if (newDraft) {
                            this.MessageID = parseInt(result.MessageID);
                            if(!!!silently) {
                                notify('Draft saved');
                            }
                        } else {
                          if(!!!silently) {
                              notify('Draft updated');
                          }
                        }
                        this.BackupDate = new Date();
                    }.bind(this));

                    if(!!!silently) {
                        networkActivityTracker.track(draftPromise);
                    }
                }.bind(this));
            }
        },

        setSessionKey: function() {

        },

        removeSessionKey: function() {

        },

        clearTextBody: function() {
            var body;
            var deferred = $q.defer();

            if (this.isDraft() || (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {

                if (_.isUndefined(this._decryptedBody) && !!!this.decrypting) {
                    this.decrypting = true;

                    try {
                        var local = localStorageService.get('protonmail_pw');
                        var pw = pmcw.decode_base64(local);

                        pmcw.decryptPrivateKey(authentication.user.EncPrivateKey, pw).then(function(key) {
                            pmcw.decryptMessageRSA(this.MessageBody, key, this.Time).then(function(result) {
                                this._decryptedBody = result;
                                this.failedDecryption = false;
                                this.decrypting = false;
                                deferred.resolve(result);
                            }.bind(this));
                        }.bind(this));
                    } catch (err) {
                        this._decryptedBody = "";
                        this.failedDecryption = true;
                    }
                } else {
                    deferred.resolve(this._decryptedBody);
                }
            } else {
                deferred.resolve(this.MessageBody);
            }

            return deferred.promise;
        },

        clearImageBody: function(body) {
            if (this.containsImage === false || body.match('<img') === null) {
                this.containsImage = false;
            } else {
                this.containsImage = true;
                if (angular.isUndefined(this.imagesHidden) || this.imagesHidden === true) {
                    this.imagesHidden = true;
                    body = tools.breakImages(body);
                } else {
                    this.imagesHidden = false;
                    body = tools.fixImages(body);
                }
            }

            return body;
        }
    });

    return Message;
});
