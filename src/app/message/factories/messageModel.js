angular.module('proton.message')
.factory('messageModel', ($q, $timeout, pmcw, User, gettextCatalog, authentication, AttachmentLoader) => {
    const defaultMessage = {
        ID: '',
        Order: 0,
        Subject: '',
        PasswordHint: '',
        IsRead: 0,
        Type: 0,
        Sender: {},
        ToList: [],
        Time: 0,
        Size: 0,
        Attachments: [],
        NumAttachments: 0,
        IsEncrypted: 0,
        ExpirationTime: 0,
        IsReplied: 0,
        IsRepliedAll: 0,
        IsForwarded: 0,
        AddressID: '',
        CCList: [],
        BCCList: [],
        LabelIDs: [],
        ExternalID: null
    };
    const encryptionTypes = [
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
    const emptyMessage = gettextCatalog.getString('Message empty', null, 'Message content if empty');

    class Message {

        constructor(msg) {
            _.extend(this, angular.copy(msg));
            return this;
        }

        isDraft() {
            return this.Type === 1;
        }

        generateReplyToken() {
            // Use a base64-encoded AES256 session key as the reply token
            return pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateKeyAES()));
        }

        encryptionType() {
            return encryptionTypes[this.IsEncrypted];
        }

        isPlainText() {
            return this.MIMEType === 'text/plain';
        }

        plainText() {
            return this.getDecryptedBody();
        }

        disableOthers() {
            return (this.saving && !this.autosaving) || this.sending || this.encrypting || this.askEmbedding;
        }

        disableSend() {
            return this.uploading > 0 || this.disableOthers();
        }

        disableSave() {
            return this.disableSend();
        }
        disableDiscard() {
            return this.disableSend();
        }

        getAttachment(ID) {
            return _.findWhere(this.Attachments || [], { ID });
        }

        getAttachments() {
            return this.Attachments || [];
        }

        attachmentsSize() {
            return (this.Attachments || [])
                .reduce((acc, { Size = 0 } = {}) => acc + (+Size), 0);
        }

        countEmbedded() {
            return this.Attachments
                .filter(({ Headers = {} }) => Headers['content-disposition'] === 'inline')
                .length;
        }

        addAttachments(list = []) {
            this.Attachments = [].concat(this.Attachments, list);
            this.NumEmbedded = this.countEmbedded();
        }

        removeAttachment({ ID } = {}) {
            this.Attachments = (this.Attachments || [])
                .filter((att) => att.ID !== ID);
            this.NumEmbedded = this.countEmbedded();
        }

        setDecryptedBody(input = '', purify = true) {
            this.DecryptedBody = !purify ? input : DOMPurify.sanitize(input, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        }

        getDecryptedBody() {
            return this.DecryptedBody || '';
        }

        getListUnsubscribe() {
            const { ParsedHeaders = {} } = this;
            return ParsedHeaders['List-Unsubscribe'] || '';
        }

        close() {
            if (angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }
        }

        encryptBody(pubKey) {
            const privKey = authentication.getPrivateKeys(this.From.ID);
            return pmcw.encryptMessage(this.getDecryptedBody(), pubKey, [], privKey)
            .then((body) => (this.Body = body, body))
            .catch((error) => {
                error.message = gettextCatalog.getString('Error encrypting message');
                throw error;
            });
        }

        parse(content = '') {
            const deferred = $q.defer();
            const mailparser = new MailParser({ defaultCharset: 'UTF-8' });

            mailparser.on('end', (mail) => {
                const { attachments, text = '', html = '' } = mail;

                if (attachments) {
                    this.PgpMimeWithAttachments = true; // Used to display an alert on the message view
                }

                if (html) {
                    deferred.resolve(html);
                } else if (text) {
                    this.MIMEType = 'text/plain';
                    deferred.resolve(text);
                } else {
                    deferred.resolve(emptyMessage);
                }
            });

            mailparser.write(content);
            mailparser.end();

            return deferred.promise;
        }

        decryptBody() {
            const privKey = authentication.getPrivateKeys(this.AddressID);
            const sender = (this.Sender || {}).Address;

            this.decrypting = true;

            const getPubKeys = (sender) => {
                // Sender can be empty (╯︵╰,)
                // if so, do not look up public key
                if (!sender) {
                    return Promise.resolve(null);
                }
                return this.getPublicKeys([sender])
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000 && data[sender].length > 0) {
                            return data[sender];
                        }
                        return null;
                    });
            };

            return getPubKeys(sender)
                .then((pubKeys) => {
                    return pmcw.decryptMessageRSA(this.Body, privKey, this.Time, pubKeys)
                        .then((rep) => {
                            this.decrypting = false;

                            if (this.IsEncrypted === 8 || this.MIMEType === 'multipart/mixed') {
                                return this.parse(rep.data)
                                    .then((data) => ({ data }));
                            }

                            return rep;
                        })
                        .catch((error) => {
                            this.decrypting = false;
                            throw error;
                        });
                });
        }

        encryptAttachmentKeyPackets(publicKeys = [], passwords = []) {
            const packets = {};

            return Promise.all(
                this.Attachments.map((attachment) => {
                    return AttachmentLoader.getSessionKey(this, attachment)
                    .then(({ sessionKey = {}, AttachmentID, ID } = {}) => {
                        attachment.sessionKey = sessionKey; // Update the ref
                        const { key, algo } = sessionKey;
                        return pmcw.encryptSessionKey(key, algo, publicKeys, passwords)
                        .then((keyPacket) => {
                            packets[AttachmentID || ID] = pmcw.encode_base64(pmcw.arrayToBinaryString(keyPacket));
                        });
                    });
                })
            )
            .then(() => packets);
        }

        cleartextAttachmentKeyPackets() {
            const packets = {};

            return Promise.all(
                this.Attachments.map((attachment) => {
                    return AttachmentLoader.getSessionKey(this, attachment)
                    .then(({ sessionKey = {}, AttachmentID, ID } = {}) => {
                        attachment.sessionKey = sessionKey; // Update the ref
                        packets[AttachmentID || ID] = pmcw.encode_base64(pmcw.arrayToBinaryString(sessionKey.key));
                    });
                })
            )
            .then(() => packets);
        }

        cleartextBodyPackets() {
            const privateKeys = authentication.getPrivateKeys(this.AddressID);

            return pmcw.splitFile(this.Body)
            .then(({ keys, data }) => {
                const dataPacket = pmcw.encode_base64(pmcw.arrayToBinaryString(data));

                return pmcw.decryptSessionKey(keys, privateKeys)
                .then((sessionKey) => ({ sessionKey, dataPacket }));
            });
        }

        emailsToString() {
            const list = [].concat(this.ToList, this.CCList, this.BCCList);
            return _.map(list, ({ Address } = {}) => Address);
        }

        getPublicKeys(emails = []) {
            const base64 = pmcw.encode_base64(emails.filter(Boolean).join(','));
            return User.pubkeys(base64);
        }

        clearTextBody() {
            const deferred = $q.defer();

            if (this.isDraft() || this.IsEncrypted > 0) {
                if (!this.getDecryptedBody()) {
                    try {
                        this.decryptBody()
                            .then((result) => {
                                this.setDecryptedBody(result.data, !this.isPlainText());
                                this.Signature = result.signature;
                                this.failedDecryption = false;
                                deferred.resolve(result.data);
                            })
                            .catch((err) => {
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
                    deferred.resolve(this.getDecryptedBody());
                }
            } else {
                this.setDecryptedBody(this.Body, false);
                deferred.resolve(this.getDecryptedBody());
            }

            return deferred.promise;
        }
    }

    return (m = defaultMessage) => (new Message(m));
});
