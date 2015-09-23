angular.module("proton.models.message", ["proton.constants"])

.factory("Message", function(
    $resource,
    $rootScope,
    $compile,
    $templateCache,
    $timeout,
    $q,
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
    var invertedMailboxIdentifiers = _.invert(CONSTANTS.MAILBOX_IDENTIFIERS);
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
            countUnread: {
                method: 'get',
                url: url.get() + '/messages/unread',
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
                url: url.get() + '/messages/:id',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);
                    return json.Message;
                }
            },
             totalCount: {
                    method: 'get',
                    url: url.get() + '/messages/total',
            },
            query: {
                method: 'get',
                isArray: true,
                url: url.get() + '/messages',
                transformResponse: function(data) {
                    var json = angular.fromJson(data);

                    $rootScope.Total = json.Total;

                    return json.Messages;
                }
            },
            latest: {
                method: 'get',
                url: url.get() + '/messages/latest/:time'
            },
            unreaded: {
                method: 'get',
                url: url.get() + '/messages/unread'
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
            },
        }
    );

    _.extend(Message.prototype, {
        promises: [],
        countdown: 0,
        parameters: function(mailbox) {
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

            return texts[this.IsEncrypted];
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

        labels: function() {
            var labels = [];

            _.each(this.LabelIDs, function(id) {
                labels.push(_.findWhere(authentication.user.Labels, {ID: id}));
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

        decryptBody: function(body, time) {
            var deferred = $q.defer();

            authentication.getPrivateKey().then(function(key) {
                pmcw.decryptMessageRSA(body, key, time).then(function(result) {
                    deferred.resolve(result);
                });
            });

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

            if (this.isDraft() || (!_.isUndefined(this.IsEncrypted) && parseInt(this.IsEncrypted))) {
                if (_.isUndefined(this.DecryptedBody) && !!!this.decrypting) {
                    this.decrypting = true;

                    try {
                        authentication.getPrivateKey()
                        .then(
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
                    }
                    catch (err) {
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
            if (body===undefined) {
                return body;
            }
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

    if(this.ExpirationTime) {
        var interval = 1000; // 1 sec
        var timer;
        var tick = function() {
            timer = $timeout(function() {
                if(Message.countdown > 0) {
                    Message.countdown -= 1000;

                    if(Message.countdown > 0) {
                        tick();
                    }
                }
            }, interval);
        };
    }

    return Message;
});
