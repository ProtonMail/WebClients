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
    $translate,
    authentication,
    localStorageService,
    User,
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
                url: authentication.baseURL + '/messages/send/:id'
            },
            createDraft: {
                method: 'post',
                url: authentication.baseURL + '/messages/draft'
            },
            // GET
            countUnread: {
                method: 'get',
                url: authentication.baseURL + '/messages/unread',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);
                    var counters = {};

                    _.each(json.Labels, function(obj) { counters[obj.LabelID] = obj.Count; });
                    _.each(json.Locations, function(obj) { counters[obj.Location] = obj.Count; });

                    return counters;
                }
            },
            get: {
                method: 'get',
                url: authentication.baseURL + '/messages/:id',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);

                    return json.Message;
                }
            },
            query: {
                method: 'get',
                isArray: true,
                url: authentication.baseURL + '/messages',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);

                    $rootScope.TotalPages = json.TotalPages;
                    $rootScope.Total = json.Total;
                    return json.Messages;
                }
            },
            latest: {
                method: 'get',
                url: authentication.baseURL + '/messages/latest/:time'
            },
            unreaded: {
                method: 'get',
                isArray: true,
                url: authentication.baseURL + '/messages/unread'
            },
            // PUT
            updateDraft: {
                method: 'put',
                url: authentication.baseURL + '/messages/draft/:id'
            },
            star: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/star'
            },
            unstar: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/unstar'
            },
            read: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/read'
            },
            unread: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/unread'
            },
            trash: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/trash'
            },
            inbox: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/inbox'
            },
            spam: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/spam'
            },
            archive: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/archive'
            },
            delete: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/messages/delete'
            }
            // DELETE
        }
    );

    _.extend(Message.prototype, {
        promises: [],
        readableTime: function() {
            if (this.moment().isSame(moment(), 'day')) {
                return this.moment().format('h:mm a');
            }
            else {
                return this.moment().format('LL');
            }
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
        numberOfAttachments: function() {
            return this.Attachments.length;
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
            var body = this.DecryptedBody || this.Body;

            return body;
        },

        setMsgBody: function() {
            var body;

            // get the message content from either the editor or textarea if its iOS
            // if its iOS / textarea we need to replace natural linebreaks with HTML linebreaks
            if ($rootScope.isMobile) {
                body = this.Body.replace(/(?:\r\n|\r|\n)/g, '<br />');
            } else {
                body = this.Body;
                body = tools.fixImages(body);
            }
            // if there is no message body we "pad" with a line return so encryption and decryption doesnt break
            if (body.trim().length < 1) {
                body = '\n';
            }
            // Set input elements
            this.Body = body;
        },

        validate: function(force) {
            // set msgBody input element to editor content
            this.setMsgBody();

            // Check internet connection
            if (window.navigator.onLine !== true && location.hostname !== 'localhost') {
                notify('No internet connection. Please wait and try again.');
                return false;
            }

            // Check if there is an attachment uploading
            if (this.uploading === true) {
                notify('Wait for attachment to finish uploading or cancel upload.');
                return false;
            }

            // Check all emails to make sure they are valid
            var invalidEmails = [];
            var allEmails = _.map(this.ToList.concat(this.CCList).concat(this.BCCList), function(email) { return email.Address.trim(); });

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
            if (force === true) {
                if ((this.ToList.length + this.BCCList.length + this.CCList.length) > 25) {
                    notify('The maximum number (25) of Recipients is 25.');
                    return false;
                }

                if (this.ToList.length === 0 && this.BCCList.length === 0 && this.CCList.length === 0) {
                    notify('Please enter at least one recipient.');
                    return false;
                }
            }

            // Check title length
            if (this.Subject && this.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
                notify('The maximum length of the subject is ' + CONSTANTS.MAX_TITLE_LENGTH + '.');
                return false;
            }

            // Check body length
            if (this.Body.length > 16000000) {
                notify('The maximum length of the message body is 16,000,000 characters.');
                return false;
            }

            if(force !== true) {
                return this.needToSave();
            } else {
                return true;
            }
        },

        close: function() {
            if(angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }
        },

        needToSave: function() {
            if(angular.isDefined(this.old)) {
                var properties = ['Subject', 'ToList', 'CCList', 'BCCList', 'Body', 'PasswordHint', 'IsEncrypted', 'Attachments'];
                var currentMessage = _.pick(this, properties);
                var oldMessage = _.pick(this.old, properties);

                return JSON.stringify(oldMessage) !== JSON.stringify(currentMessage);
            } else {
                return true;
            }
        },

        defaults: function() {
            _.defaults(this, {
                ToList: [],
                BCCList: [],
                CCList: [],
                Attachments: [],
                Subject: '',
                IsEncrypted: 0,
                PasswordHint: ''
            });
        },

        loading: function() {
            return !_.isEmpty(this.promises);
        },

        track: function (promise) {
            this.promises = _.union(this.promises, [promise]);

            promise.finally(function () {
                this.promises = _.without(this.promises, promise);
            }.bind(this));

            return promise;
        },

        encryptBody: function(key) {
            return pmcw.encryptMessage(this.Body, key);
        },

        decryptBody: function(body, time) {
            var deferred = $q.defer();
            var local = localStorageService.get('protonmail_pw');
            var pw = pmcw.decode_base64(local);

            pmcw.decryptPrivateKey(authentication.user.EncPrivateKey, pw).then(function(key) {
                pmcw.decryptMessageRSA(body, key, time).then(function(result) {
                    deferred.resolve(result);
                });
            });

            return deferred.promise;
        },

        encryptPackets: function(key) {
            var deferred = $q.defer();
            var packets = [];

            _.each(this.Attachments, function(element) {
                packets.push(pmcrypto.encryptSessionKey(element.sessionKey.key, element.sessionKey.algo, key, []).then(function (keyPacket) {
                    return {
                        ID: element.AttachmentID,
                        KeyPackets: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(keyPacket))
                    };
                }));
            });

            $q.all(packets).then(function(result) {
                deferred.resolve(result);
            });

            return deferred.promise;
        },

        clearPackets: function() {
            var deferred = $q.defer();
            var packets = [];

            _.each(this.Attachments, function(element) {
                packets.push({
                    ID: element.AttachmentID,
                    Key: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(element.sessionKey.key)),
                    Algo: element.sessionKey.algo
                });
            });

            return packets;
        },

        emailsToString: function() {
            return _.map(this.ToList.concat(this.CCList).concat(this.BCCList), function(email) { return email.Address; });
        },

        getPublicKeys: function(emails) {
            var base64 = pmcw.encode_base64(emails.join(','));

            return User.pubkeys({emails: base64}).$promise;
        },

        cleanKey: function(key) {
            return key.replace(/(\r\n|\n|\r)/gm,'');
        },

        generateReplyToken: function() {
            // Use a base64-encoded AES256 session key as the reply token
            return pmcrypto.encode_base64(pmcrypto.generateKeyAES());
        },

        clearTextBody: function() {
            var body;
            var deferred = $q.defer();

            if (this.isDraft() || (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {

                if (_.isUndefined(this.DecryptedBody) && !!!this.decrypting) {
                    this.decrypting = true;

                    try {
                        var local = localStorageService.get('protonmail_pw');
                        var pw = pmcw.decode_base64(local);

                        pmcw.decryptPrivateKey(authentication.user.EncPrivateKey, pw).then(function(key) {
                            pmcw.decryptMessageRSA(this.Body, key, this.Time).then(function(result) {
                                this.DecryptedBody = result;
                                this.failedDecryption = false;
                                this.decrypting = false;
                                deferred.resolve(result);
                            }.bind(this));
                        }.bind(this));
                    } catch (err) {
                        this.DecryptedBody = "";
                        this.failedDecryption = true;
                    }
                } else {
                    deferred.resolve(this.DecryptedBody);
                }
            } else {
                deferred.resolve(this.Body);
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
