angular.module("proton.models.newmessage", ["proton.constants"])

.factory("NewMessage", function(
    $rootScope,
    $compile,
    $http,
    $templateCache,
    $timeout,
    $q,
    $state,
    $stateParams,
    $translate,
    $log,
    authentication,
    url,
    User,
    pmcw,
    CONSTANTS,
    CONFIG,
    networkActivityTracker,
    notify,
    tools
) {
    var api = {
        promises: [], // This array the list of promises
        // POST
        /**
         * Send message
         * @param {Object} message
         * @return {Promise}
         */
        send: function(message) {
            return $http.post(url.get() + '/messages/send/' + message.ID, message);
        },
        /**
         * Create a new draft message
         * @param {Object} message
         * @return {Promise}
         */
        createDraft: function(message) {
            return $http.post(url.get() + '/messages/draft', message);
        },
        // GET
        /**
         * Get data from a specific message
         * @param {String} id - Message ID encrypted
         * @return {Promise}
         */
        get: function(id) {
            return $http.get(url.get() + '/messages/' + id);
        },
        /**
         * Get metadata of a list of messages
         * @param {Object} request
         * @return {Promise}
         */
        query: function(request) {
            return $http.get(url.get() + '/messages', {
                params: request,
                transformResponse: function(data) {
                    var json = angular.fromJson(data);

                    $rootScope.Total = json.Total;

                    _.each(json.Messages, function(message) {
                        message.NumAttachments = message.HasAttachment;
                        message.Senders = [message.Sender];
                        message.Recipients = _.uniq([].concat(message.ToList || []).concat(message.CCList || []).concat(message.BCCList || []));
                    });

                    return json.Messages;
                }
            });
        },
        /**
         * Return the total and the number of message unread in each location
         * @return {Promise}
         */
        count: function() {
            return $http.get(url.get() + '/messages/count');
        },
        // PUT
        /**
         * Update data of an existing draft
         * @param {Object} message
         * @return {Promise}
         */
        updateDraft: function(message) {
            return $http.put(url.get() + '/messages/draft/' + message.ID, message);
        },
        /**
         * Star a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        star: function(IDs) {
            return $http.put(url.get() + '/messages/star', IDs);
        },
        /**
         * Unstar a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        unstar: function(IDs) {
            return $http.put(url.get() + '/messages/unstar', IDs);
        },
        /**
         * Mark as read a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        read: function(IDs) {
            return $http.put(url.get() + '/messages/read', IDs);
        },
        /**
         * Mark as unread a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        unread: function(IDs) {
            return $http.put(url.get() + '/messages/unread', IDs);
        },
        /**
         * Move to trash a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        trash: function(IDs) {
            return $http.put(url.get() + '/messages/trash', IDs);
        },
        /**
         * Move to inbox a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        inbox: function(IDs) {
            return $http.put(url.get() + '/messages/inbox', IDs);
        },
        /**
         * Move to spam a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        spam: function(IDs) {
            return $http.put(url.get() + '/messages/spam', IDs);
        },
        /**
         * Move to archive a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        archive: function(IDs) {
            return $http.put(url.get() + '/messages/archive', IDs);
        },
        /**
         * Delete a list of message
         * @param {Array} IDs
         * @return {Promise}
         */
        delete: function(IDs) {
            return $http.put(url.get() + '/messages/delete', IDs);
        },
        // DELETE
        /**
         * Empty draft folder
         * @return {Promise}
         */
        emptyDraft: function() {
            return $http.delete(url.get() + '/messages/draft');
        },
        /**
         * Empty spam folder
         * @return {Promise}
         */
        emptySpam: function() {
            return $http.delete(url.get() + '/messages/spam');
        },
        /**
         * Empty trash folder
         * @return {Promise}
         */
        emptyTrash: function() {
            return $http.delete(url.get() + '/messages/trash');
        },
        /**
         * Return the total of attachment
         * @param {Object} message
         * @return {Integer} size
         */
        sizeAttachments: function(message) {
            var size = 0;

            _.each(message.Attachments, function(attachment) {
                if (angular.isDefined(attachment.Size)) {
                    size += parseInt(attachment.Size);
                }
            });

            return size;
        },
        /**
         * Return the type of encryption
         * @param {Object} message
         * @return {String}
         */
        encryptionType: function(message) {
            var texts = [
                $translate.instant('UNENCRYPTED_MESSAGE'),
                $translate.instant('END_TO_END_ENCRYPTED_INTERNAL_MESSAGE'),
                $translate.instant('EXTERNAL_MESSAGE_STORED_ENCRYPTED'),
                $translate.instant('END_TO_END_ENCRYPTED_FOR_OUTSIDE'),
                $translate.instant('EXTERNAL_MESSAGE_STORED_ENCRYPTED'),
                $translate.instant('STORED_ENCRYPTED'),
                $translate.instant('END_TO_END_ENCRYPTED_FOR_OUTSIDE_REPLY'),
                $translate.instant('ENCRYPTED_PGP'),
                $translate.instant('ENCRYPTED_PGP_MIME'),
            ];

            return texts[message.IsEncrypted];
        },
        /**
         * Check if the message is located in draft
         * @param {Object} message
         * @return {Boolean}
         */
        isDraft: function(message) {
            return angular.isDefined(message.LabelIDs) && message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.drafts) !== -1;
        },
        /**
         * Toggle imagesHidden parameter
         * @param {Object} message
         */
        toggleImages: function(message) {
            message.imagesHidden = !!!message.imagesHidden;
        },
        /**
         * Return
         */
        plainText: function() {
            var body = message.DecryptedBody || message.Body;

            return body;
        },
        /**
         *
         */
        labels: function() {
            var labels = [];

            _.each(this.LabelIDs, function(id) {
                var label =  _.findWhere(authentication.user.Labels, {ID: id});

                if(angular.isDefined(label)) {
                    labels.push(label);
                }
            });

            return labels;
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

        loading: function() {
            return !_.isEmpty(this.promises);
        },

        track: function (promise) {
            this.promises = _.union(this.promises, [promise]);

            promise.catch(function(result) {
                if(angular.isDefined(result)) {
                    $log.error(result);
                    if ( angular.isDefined( result.message ) ) {
                        notify({message: result.message, classes: 'notification-danger'});
                    }
                    else if ( angular.isDefined( result.Error ) ) {
                        notify({message: result.Error, classes: 'notification-danger'});
                    }
                    else if ( angular.isDefined( result.data ) && angular.isDefined( result.data.Error ) ) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                    else if ( angular.isString( result ) ) {
                        notify({message: result, classes: 'notification-danger'});
                    }
                }
            });

            promise.finally(function () {
                this.promises = _.without(this.promises, promise);
            }.bind(this));

            return promise;
        },

        encryptBody: function(key) {
            return pmcw.encryptMessage(this.Body, key);
        },

        decryptBody: function() {
            var deferred = $q.defer();

            authentication.getPrivateKey().then(function(key) {
                pmcw.decryptMessageRSA(this.Body, key, this.Time).then(function(result) {
                    deferred.resolve(result);
                });
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

            _.each(this.Attachments, function(element) {
                if(element.sessionKey === undefined) {
                    promises.push(authentication.getPrivateKey().then(function(pk) {
                        var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(element.KeyPackets));
                        return pmcw.decryptSessionKey(keyPackets, pk).then(function(key) {
                            element.sessionKey = key;
                            packets.push({
                                ID: element.ID,
                                Key: pmcw.encode_base64(pmcw.arrayToBinaryString(element.sessionKey.key)),
                                Algo: element.sessionKey.algo
                            });
                        });
                    }));
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

            return User.pubkeys({emails: base64}).$promise;
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
                if (angular.isUndefined(this.DecryptedBody) && this.decrypting !== true) {
                    this.decrypting = true;

                    try {
                        authentication.getPrivateKey().then(
                            function(key) {
                                pmcw.decryptMessageRSA(this.Body, key, this.Time)
                                .then(
                                    function(result) {
                                        this.DecryptedBody = result;
                                        this.failedDecryption = false;
                                        deferred.resolve(result);
                                    }.bind(this),
                                    function(err) {
                                        this.failedDecryption = true;
                                        deferred.reject(err);
                                    }.bind(this)
                                );
                            }.bind(this),
                            function(err) {
                                this.failedDecryption = true;
                                deferred.reject(err);
                            }.bind(this)
                        );
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

            this.decrypting = false;

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
    };

    return api;
});
