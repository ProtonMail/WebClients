angular.module('proton.models.message', ['proton.constants'])

.factory('Message', (
    $compile,
    $http,
    $log,
    $q,
    $sce,
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
) => {
    const Message = $resource(
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
                url: url.get() + '/messages/:id'
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

        setDecryptedBody(input = '', purify = true) {
            this.DecryptedBody = !purify ? input : DOMPurify.sanitize(input, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        },

        getDecryptedBodyKey() {
            return 'DecryptedBody';
        },

        getDecryptedBody() {
            return this.DecryptedBody || '';
        },

        attachmentsSize() {
            return (this.Attachments || []).reduce((acc, { Size = 0 } = {}) => acc + (+Size), 0);
        },

        countEmbedded() {
            return this.Attachments
                .filter(({ Headers = {} }) => Headers['content-disposition'] === 'inline')
                .length;
        },

        addAttachments(list = []) {
            this.Attachments = [].concat(this.Attachments).concat(list);
            this.NumEmbedded = this.countEmbedded();
        },

        removeAttachment({ ID } = {}) {
            this.Attachments = (this.Attachments || [])
                .filter((att) => att.ID !== ID);
            this.NumEmbedded = this.countEmbedded();
        },

        encryptionType() {
            const texts = [
                gettextCatalog.getString('Unencrypted message', null),
                gettextCatalog.getString('End to end encrypted internal message', null),
                gettextCatalog.getString('External message stored encrypted', null),
                gettextCatalog.getString('End to end encrypted for outside', null),
                gettextCatalog.getString('External message stored encrypted', null),
                gettextCatalog.getString('Stored encrypted', null),
                gettextCatalog.getString('End to end encrypted for outside reply', null),
                gettextCatalog.getString('End to end encrypted using PGP', null),
                gettextCatalog.getString('End to end encrypted using PGP/MIME', null)
            ];

            return texts[this.IsEncrypted];
        },

        isDraft() {
            return this.Type === 1;
        },

        plainText() {
            return this.getDecryptedBody();
        },

        /**
         * Label/unlabel an array of messages
         * @param {String} labelID
         * @param {Integer} action - 0 for remove or 1 for add
         * @param {Array} messageIDs
         */
        updateLabels(labelID, action, messageIDs) {
            return $http.put(url.get() + '/messages/label', { LabelID: labelID, Action: action, MessageIDs: messageIDs });
        },

        labels() {
            return $filter('labels')(this.LabelIDs);
        },

        close() {
            if (angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }
        },

        defaults() {
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

        disableSend() {
            return this.uploading > 0 || this.disableOthers();
        },

        disableSave() {
            return this.disableSend();
        },

        disableDiscard() {
            return this.disableSend();
        },

        disableOthers() {
            return (this.saving === true && this.autosaving === false) || this.sending || this.encrypting || this.askEmbedding;
        },

        encryptBody(key) {
            const deferred = $q.defer();
            pmcw
                .encryptMessage(this.getDecryptedBody(), key)
                .then(deferred.resolve)
                .catch((error) => {
                    error.message = gettextCatalog.getString('Error encrypting message');
                    deferred.reject(error);
                });

            return deferred.promise;
        },

        /**
         * Decrypt the body
         * @return {Promise}
         */
        decryptBody() {
            const deferred = $q.defer();
            const keys = authentication.getPrivateKeys(this.AddressID);

            this.decrypting = true;

            pmcw
                .decryptMessageRSA(this.Body, keys, this.Time)
                .then((result) => {
                    this.decrypting = false;
                    deferred.resolve(result);
                })
                .catch((error) => {
                    this.decrypting = false;
                    deferred.reject(error);
                });
            return deferred.promise;
        },

        encryptPackets(keys = '', passwords = '') {
            const deferred = $q.defer();
            const packets = [];
            const keysPackets = keys !== '' ? keys : [];
            const passwordsPackets = passwords !== '' ? passwords : [];

            this.Attachments.forEach((element = {}) => {
                const { sessionKey = {}, AttachmentID, ID } = element;
                const { key, algo } = sessionKey;

                if (key) {
                    const defferedAction = pmcw
                        .encryptSessionKey(key, algo, keysPackets, passwordsPackets)
                        .then((keyPacket) => ({
                            ID: AttachmentID || ID,
                            KeyPackets: pmcw.encode_base64(pmcw.arrayToBinaryString(keyPacket))
                        }));

                    packets.push(defferedAction);
                }

            });

            $q.all(packets).then(deferred.resolve);

            return deferred.promise;
        },

        clearPackets() {
            const packets = [];
            const promises = [];
            const deferred = $q.defer();
            const keys = authentication.getPrivateKeys(this.AddressID);

            _.each(this.Attachments, (element) => {
                if (element.sessionKey === undefined) {
                    const keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(element.KeyPackets));

                    promises.push(pmcw.decryptSessionKey(keyPackets, keys).then((key) => {
                        element.sessionKey = key;
                        packets.push({
                            ID: element.ID,
                            Key: pmcw.encode_base64(pmcw.arrayToBinaryString(element.sessionKey.key)),
                            Algo: element.sessionKey.algo
                        });
                    }));
                } else {
                    promises.push(packets.push({
                        ID: element.AttachmentID || element.ID,
                        Key: pmcw.encode_base64(pmcw.arrayToBinaryString(element.sessionKey.key)),
                        Algo: element.sessionKey.algo
                    }));
                }
            });

            $q.all(promises).then(() => {
                deferred.resolve(packets);
            });

            return deferred.promise;
        },

        emailsToString() {
            return _.map(
                this.ToList.concat(this.CCList).concat(this.BCCList),
                ({ Address } = {}) => Address
            );
        },

        getPublicKeys(emails) {
            const base64 = pmcw.encode_base64(emails.join(','));

            return User.pubkeys(base64);
        },

        cleanKey(key) {
            return key.replace(/(\r\n|\n|\r)/gm, '');
        },

        generateReplyToken() {
            // Use a base64-encoded AES256 session key as the reply token
            return pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateKeyAES()));
        },

        clearTextBody() {
            const deferred = $q.defer();

            if (this.isDraft() || this.IsEncrypted > 0) {
                if (!this.getDecryptedBody()) {
                    try {
                        this.decryptBody()
                        .then((result) => {
                            this.setDecryptedBody(result);
                            this.failedDecryption = false;
                            deferred.resolve(result);
                        }, (err) => {
                            this.setDecryptedBody(this.Body, false);
                            this.failedDecryption = true;

                            // We need to display the encrypted body to the user if it fails
                            this.MIMEType = 'text/plain';
                            deferred.reject(err);
                        });
                    } catch (err) {
                        this.setDecryptedBody(this.Body, false);
                        this.MIMEType = 'text/plain';
                        this.failedDecryption = true;
                        deferred.reject(err);
                    }
                } else {
                    this.failedDecryption = false;
                    deferred.resolve(this.getDecryptedBody());
                }
            } else {
                this.setDecryptedBody(this.Body, false);
                deferred.resolve(this.getDecryptedBody());
            }

            return deferred.promise;
        }
    });

    return Message;
});
