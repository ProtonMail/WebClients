angular.module("proton.models.message", [])

.factory("Message", function(
    $resource,
    $rootScope,
    $compile,
    $templateCache,
    $injector,
    $interval,
    authentication,
    localStorageService,
    pmcw,
    mailboxIdentifiers,
    networkActivityTracker,
    notify,
    tools,
    CONSTANTS
) {

    var invertedMailboxIdentifiers = _.invert(mailboxIdentifiers);
    var Message = $resource(
        authentication.baseURL + "/messages/:MessageID",
        authentication.params({
            MessageID: "@MessageID"
        }), {
            query: {
                method: "get",
                isArray: true,
                transformResponse: getFromJSONResponse('Messages')
            },
            search: {
                method: "get",
                transformResponse: function(data) {
                    return angular.fromJson(data);
                },
                url: authentication.baseURL + "/messages/search"
            },
            advSearch: {
                method: "get",
                transformResponse: function(data) {
                    return angular.fromJson(data);
                },
                url: authentication.baseURL + "/messages/adv_search"
            },
            delete: {
                method: "delete"
            },
            get: {
                method: "get",
                url: authentication.baseURL + "/messages/:MessageID",
                transformResponse: getFromJSONResponse()
            },
            patch: {
                method: "put",
                url: authentication.baseURL + "/messages/:MessageID/:action"
            },
            count: {
                method: "get",
                url: authentication.baseURL + "/messages/count",
                transformResponse: getFromJSONResponse('MessageCount')
            },
            saveDraft: {
                method: "post",
                url: authentication.baseURL + "/messages/draft",
                transformResponse: getFromJSONResponse()
            },
            updateDraft: {
                method: "put",
                url: authentication.baseURL + "/messages/draft"
            },
            send: {
                method: "post",
                url: authentication.baseURL + "/messages",
                headers: {
                    'Accept': 'application/vnd.protonmail.api+json;apiversion=2;appversion=1'
                }
            },
            pubkeys: {
                method: 'get',
                url: authentication.baseURL + "/users/pubkeys/:Emails",
                isArray: false,
                transformResponse: getFromJSONResponse()
            },
            // Get all messages with this label
            labels: {
                method: 'get',
                isArray: false,
                transformResponse: function(data) {
                    return angular.fromJson(data);
                },
                url: authentication.baseURL + "/label"
            },
            // Apply labels on messages
            apply: {
                method: 'put',
                url: authentication.baseURL + "/labels/apply"
            }
        }
    );

    Message.REPLY_PREFIX = /re:/i;
    Message.FORWARD_PREFIX = /fw:/i;

    _.extend(Message, {
        reply: function(base) {
            var message = base.cite();
            message.RecipientList = base.Sender;
            message.MessageTitle = (Message.REPLY_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Re: " + base.MessageTitle;

            return message;
        },
        replyall: function(base) {
            var message = base.cite();
            message.RecipientList = [base.Sender, base.CCList, base.BCCList].join(",");
            message.MessageTitle = (Message.REPLY_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Re: " + base.MessageTitle;

            return message;
        },
        forward: function(base) {
            var message = base.cite();
            message.MessageTitle = (Message.FORWARD_PREFIX.test(base.MessageTitle)) ? base.MessageTitle : "Fw: " + base.MessageTitle;

            return message;
        }
    });

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
                action: this.Tag == 'starred' ? "star" : "unstar"
            });
        },
        moveTo: function(location) {
            // If location is given as a name ('inbox', 'sent', etc), convert it to identifier (0, 1, 2)
            if (_.has(mailboxIdentifiers, location)) {
                this.Location = mailboxIdentifiers[location];
            } else {
                this.Location = location;
            }

            return this.$patch({
                action: invertedMailboxIdentifiers[this.Location]
            });
        },
        setReadStatus: function(status) {
            this.IsRead = +status;
            $rootScope.unreadCount = $rootScope.unreadCount + (status ? -1 : 1);
            return this.$patch({
                action: status ? "read" : "unread"
            });
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
            return this.Location == mailboxIdentifiers.drafts;
        },

        cite: function() {
            var message = new Message();
            var baseBody = this.clearTextBody();

            try {
                var _baseBody = $(baseBody);
                if (_baseBody.find("body").length > 0) {
                    baseBody = _baseBody.find("body");
                }
            } catch (err) {}

            var citeBody = $("<blockquote type=\"cite\">").append(baseBody);
            var citation = $("<div class=\"moz-cite-prefix\">On " +
                this.moment().format("l, LT") + ", " +
                this.SenderName + " wrote:<br><br></div>");

            var signature = $("<div class=\"signature\">" + authentication.user.Signature + "</div>");

            message.MessageBody = $("<div>").append("<br><br>").append(citation).append(citeBody).append(signature).html();
            message.IsEncrypted = '0';
            return message;
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
            if ($('#iOSeditor').is(':visible')) { // TODO
                messageBody = $('#iOSeditor').val();
                messageBody = messageBody.replace(/(?:\r\n|\r|\n)/g, '<br />');
            } else {
                messageBody = this.MessageBody;
            }

            messageBody = tools.fixImages(messageBody);

            // if there is no message body we "pad" with a line return so encryption and decryption doesnt break
            if (messageBody.trim().length < 1) messageBody = '\n';
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

            return true;
        },

        save: function(silently) {
            if (this.validate(true)) { // draft mode
                var newMessage = new Message(_.pick(this, 'MessageID', 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint', 'IsEncrypted'));

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
                        return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
                    });
                }

                newMessage.MessageBody = {
                    outsiders: ''
                };

                pmcw.encryptMessage(this.RawMessageBody, authentication.user.PublicKey).then(function(result) {
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

        startAutoSave: function() {
            if (angular.isDefined(this.saveInterval)) {
                this.stopAutoSave();
            }

            this.saveInterval = $interval(function() {
                this.save(true); // ninja mode
            }.bind(this), CONSTANTS.AUTO_SAVE_INTERVAL_TIME, 0); // 30 seconds
        },

        stopAutoSave: function() {
            if (angular.isDefined(this.saveInterval)) {
                this.saveInterval.cancel();
            }
        },

        setSessionKey: function() {

        },

        removeSessionKey: function() {

        },

        clearTextBody: function() {
            var body;

            if (this.isDraft() ||
                (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {

                if (_.isUndefined(this._decryptedBody)) {
                    try {
                        var local = localStorageService.get('protonmail_pw');
                        var pw = pmcw.decode_base64(local);

                        if (!!!this.decrypting) {
                            this.decrypting = true;
                            pmcw.decryptPrivateKey(authentication.user.EncPrivateKey, pw).then(function(key) {
                                pmcw.decryptMessageRSA(this.MessageBody, key, this.Time).then(function(result) {
                                    this._decryptedBody = result;
                                    this.failedDecryption = false;
                                    this.decrypting = false;
                                }.bind(this));
                            }.bind(this));
                        }
                    } catch (err) {
                        this._decryptedBody = "";
                        this.failedDecryption = true;
                    }
                }

                body = this._decryptedBody;
            } else {
                body = this.MessageBody;
            }

            // Images
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
