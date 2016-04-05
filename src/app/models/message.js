angular.module("proton.models.message", ["proton.constants"])

.factory("Message", function(
    $compile,
    $http,
    $log,
    $q,
    $resource,
    $rootScope,
    $state,
    $stateParams,
    $templateCache,
    $timeout,
    $filter,
    gettextCatalog,
    authentication,
    CONFIG,
    CONSTANTS,
    networkActivityTracker,
    notify,
    pmcw,
    tools,
    url,
    User
) {
    var Message = $resource(
        url.get() + '/messages/:id',
        authentication.params({
            id: '@id'
        }), {
            // POST
            send: {
                method: 'post',
                url: url.get() + '/messages/send/:id'
            },
            createDraft: {
                method: 'post',
                url: url.get() + '/messages/draft'
            },
            // GET
            get: {
                method: 'get',
                url: url.get() + '/messages/:id',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);

                    return json.Message;
                }
            },
            query: {
                method: 'get',
                url: url.get() + '/messages'
            },
            count: {
                method: 'get',
                url: url.get() + '/messages/count'
            },
            totalCount: {
                method: 'get',
                url: url.get() + '/messages/total'
            },
            // PUT
            updateDraft: {
                method: 'put',
                url: url.get() + '/messages/draft/:id'
            },
            star: {
                method: 'put',
                url: url.get() + '/messages/star'
            },
            unstar: {
                method: 'put',
                url: url.get() + '/messages/unstar'
            },
            read: {
                method: 'put',
                url: url.get() + '/messages/read'
            },
            unread: {
                method: 'put',
                url: url.get() + '/messages/unread'
            },
            trash: {
                method: 'put',
                url: url.get() + '/messages/trash'
            },
            inbox: {
                method: 'put',
                url: url.get() + '/messages/inbox'
            },
            spam: {
                method: 'put',
                url: url.get() + '/messages/spam'
            },
            archive: {
                method: 'put',
                url: url.get() + '/messages/archive'
            },
            delete: {
                method: 'put',
                url: url.get() + '/messages/delete'
            },
            // DELETE
            emptyDraft: {
                method: 'delete',
                url: url.get() + '/messages/draft'
            },
            emptySpam: {
                method: 'delete',
                url: url.get() + '/messages/spam'
            },
            emptyTrash: {
                method: 'delete',
                url: url.get() + '/messages/trash'
            }
        }
    );

    _.extend(Message.prototype, {
        promises: [],
        sizeAttachments: function() {
            var size = 0;

            angular.forEach(this.Attachments, function(attachment) {
                if (angular.isDefined(attachment.Size)) {
                    size += parseInt(attachment.Size);
                }
            });

            return size;
        },
        encryptionType: function() {
            var texts = [
                gettextCatalog.getString('Unencrypted message'),
                gettextCatalog.getString('End to end encrypted internal message'),
                gettextCatalog.getString('External message stored encrypted'),
                gettextCatalog.getString('End to end encrypted for outside'),
                gettextCatalog.getString('External message stored encrypted'),
                gettextCatalog.getString('Stored encrypted'),
                gettextCatalog.getString('End to end encrypted for outside reply'),
                gettextCatalog.getString('End to end encrypted using PGP'),
                gettextCatalog.getString('End to end encrypted using PGP/MIME'),
            ];

            return texts[this.IsEncrypted];
        },

        isDraft: function() {
            return this.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
        },

        toggleImages: function() {
            this.imagesHidden = !!!this.imagesHidden;
        },

        plainText: function() {
            var body = this.DecryptedBody || this.Body;

            return body;
        },

        /**
         * Label/unlabel an array of messages
         * @param {String} labelID
         * @param {Integer} action - 0 for remove or 1 for add
         * @param {Array} messageIDs
         */
        updateLabels: function(labelID, action, messageIDs) {
            return $http.put(url.get() + '/messages/label', {LabelID: labelID, Action: action, MessageIDs: messageIDs});
        },

        labels: function() {
            return $filter('labels')(this.LabelIDs);
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

        close: function() {
            if(angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
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

        allowSend: function() {
            return this.uploading > 0 || this.allowOthers();
        },

        allowSave: function() {
            return this.allowSend();
        },

        allowDiscard: function() {
            return this.allowSend();
        },

        allowOthers: function() {
            return (this.saving === true && this.autosaving === false) || this.sending || this.encrypting;
        },

        encryptBody: function(key) {
            return pmcw.encryptMessage(this.Body, key);
        },

        /**
         * Decrypt the body
         * @return {Promise}
         */
        decryptBody: function() {
            var deferred = $q.defer();
            var keys = authentication.getPrivateKeys(this.AddressID);

            this.decrypting = true;

            pmcw.decryptMessageRSA(this.Body, keys, this.Time).then(function(result) {
                this.decrypting = false;
                deferred.resolve(result);
            }.bind(this), function(error) {
                this.decrypting = false;
                deferred.reject(error);
            }.bind(this));

            return deferred.promise;
        },

        encryptPackets: function(keys, passwords) {
            var deferred = $q.defer();
            var packets = [];

            if (keys===(undefined||'')) {
                keys = [];
            }

            if (passwords===(undefined||'')) {
                passwords = [];
            }

            _.each(this.Attachments, function(element) {
                packets.push(pmcw.encryptSessionKey(element.sessionKey.key, element.sessionKey.algo, keys, passwords).then(function (keyPacket) {
                    return {
                        ID: element.AttachmentID || element.ID,
                        KeyPackets: pmcw.encode_base64(pmcw.arrayToBinaryString(keyPacket))
                    };
                }));
            }, function(error) {
                console.log(error);
            });

            $q.all(packets).then(function(result) {
                deferred.resolve(result);
            });

            return deferred.promise;
        },

        clearPackets: function() {
            var packets = [];
            var promises = [];
            var deferred = $q.defer();

            var keys = authentication.getPrivateKeys(this.AddressID);

            _.each(this.Attachments, function(element) {
                if(element.sessionKey === undefined) {
                    var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(element.KeyPackets));
                    return pmcw.decryptSessionKey(keyPackets, keys).then(function(key) {
                        element.sessionKey = key;
                        packets.push({
                            ID: element.ID,
                            Key: pmcw.encode_base64(pmcw.arrayToBinaryString(element.sessionKey.key)),
                            Algo: element.sessionKey.algo
                        });
                    });
                }
                else {
                    promises.push(packets.push({
                        ID: element.AttachmentID || element.ID,
                        Key: pmcw.encode_base64(pmcw.arrayToBinaryString(element.sessionKey.key)),
                        Algo: element.sessionKey.algo
                    }));
                }
            });

            $q.all(promises).then(function() {
                deferred.resolve(packets);
            });

            return deferred.promise;
        },

        emailsToString: function() {
            return _.map(this.ToList.concat(this.CCList).concat(this.BCCList), function(email) { return email.Address; });
        },

        getPublicKeys: function(emails) {
            var base64 = pmcw.encode_base64(emails.join(','));

            return User.pubkeys(base64);
        },

        cleanKey: function(key) {
            return key.replace(/(\r\n|\n|\r)/gm,'');
        },

        generateReplyToken: function() {
            // Use a base64-encoded AES256 session key as the reply token
            return pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateKeyAES()));
        },

        clearTextBody: function() {
            var body;
            var deferred = $q.defer();

            if (this.isDraft() || this.IsEncrypted > 0) {
                if (angular.isUndefined(this.DecryptedBody)) {
                    try {
                        this.decryptBody().then(function(result) {
                            this.DecryptedBody = result;
                            this.failedDecryption = false;
                            deferred.resolve(result);
                        }.bind(this), function(err) {
                            this.failedDecryption = true;
                            deferred.reject(err);
                        }.bind(this));
                    } catch (err) {
                        this.failedDecryption = true;
                        deferred.reject(err);
                    }
                } else {
                    this.failedDecryption = false;
                    deferred.resolve(this.DecryptedBody);
                }
            } else {
                deferred.resolve(this.Body);
            }

            return deferred.promise;
        },

        clearImageBody: function(body) {
            if (angular.isUndefined(body)) {

            } else if (this.containsImage === false || body.match('<img') === null) {
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
