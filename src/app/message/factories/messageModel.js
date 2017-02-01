angular.module('proton.message')
.factory('messageModel', ($q, $filter, $timeout, pmcw, User, gettextCatalog, authentication, AttachmentLoader) => {
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
    const defaultKeys = Object.keys(defaultMessage);
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
    const cleanKey = (key) => key.replace(/(\r\n|\n|\r)/gm, '');
    return (m = defaultMessage) => {
        const message = angular.copy(m);
        const isDraft = () => message.Type === 1;
        const getAttachment = (ID) => _.findWhere(message.Attachments || [], { ID });
        const getAttachments = () => message.Attachments || [];
        const getDecryptedBody = () => message.DecryptedBody || '';
        const encryptionType = () => encryptionTypes[message.IsEncrypted];
        const plainText = () => message.getDecryptedBody();
        const labels = () => $filter('labels')(message.LabelIDs);
        const disableOthers = () => (message.saving && !message.autosaving) || message.sending || message.encrypting || message.askEmbedding;
        const disableSend = () => message.uploading > 0 || disableOthers();
        const disableSave = disableSend;
        const disableDiscard = disableSend;
        const generateReplyToken = () => pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateKeyAES())); // Use a base64-encoded AES256 session key as the reply token
        const attachmentsSize = () => (message.Attachments || []).reduce((acc, { Size = 0 } = {}) => acc + (+Size), 0);
        const getJSON = () => _.pick(message, defaultKeys);

        function setDecryptedBody(input = '', purify = true) {
            message.DecryptedBody = !purify ? input : DOMPurify.sanitize(input, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        }

        function countEmbedded() {
            return message.Attachments
                .filter(({ Headers = {} }) => Headers['content-disposition'] === 'inline')
                .length;
        }

        function addAttachments(list = []) {
            message.Attachments = [].concat(message.Attachments).concat(list);
            message.NumEmbedded = countEmbedded();
        }

        function removeAttachment({ ID } = {}) {
            message.Attachments = (message.Attachments || [])
                .filter((att) => att.ID !== ID);
            message.NumEmbedded = countEmbedded();
        }

        function close() {
            if (angular.isDefined(message.timeoutSaving)) {
                $timeout.cancel(message.timeoutSaving);
            }
        }

        function encryptBody(pubKey) {
            const privKey = authentication.getPrivateKeys(message.From.ID);
            return pmcw.encryptMessage(getDecryptedBody(), pubKey, [], privKey)
                .catch((error) => {
                    error.message = gettextCatalog.getString('Error encrypting message');
                    throw error;
                });
        }

        /**
         * Decrypt the body
         * @return {Promise}
         */
        function decryptBody() {
            const privKey = authentication.getPrivateKeys(message.AddressID);
            let pubKeys = null;
            const sender = [message.Sender.Address];

            message.decrypting = true;

            return getPublicKeys(sender)
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        pubKeys = data[sender];
                    }
                    return pmcw.decryptMessageRSA(message.Body, privKey, message.Time, pubKeys)
                        .then((rep) => (message.decrypting = false, rep))
                        .catch((error) => {
                            message.decrypting = false;
                            throw error;
                        });
                });
        }

        function encryptPackets(keys = '', passwords = '') {
            const keysPackets = keys !== '' ? keys : [];
            const passwordsPackets = passwords !== '' ? passwords : [];

            const promises = message.Attachments.map((attachment) => {
                return AttachmentLoader.getSessionKey(message, attachment)
                    .then(({ sessionKey = {}, AttachmentID, ID } = {}) => {
                        // Update the ref
                        attachment.sessionKey = sessionKey;
                        const { key, algo } = sessionKey;
                        return pmcw.encryptSessionKey(key, algo, keysPackets, passwordsPackets)
                            .then((keyPacket) => ({
                                ID: AttachmentID || ID,
                                KeyPackets: pmcw.encode_base64(pmcw.arrayToBinaryString(keyPacket))
                            }));
                    });
            });

            return Promise.all(promises);
        }

        function clearPackets() {
            const packets = [];
            const promises = [];
            const keys = authentication.getPrivateKeys(message.AddressID);

            _.each(message.Attachments, (element) => {
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

            return $q.all(promises).then(() => packets);
        }

        function emailsToString() {
            return _.map(
                [].concat(message.ToList, message.CCList, message.BCCList),
                ({ Address } = {}) => Address
            );
        }

        function getPublicKeys(emails) {
            const base64 = pmcw.encode_base64(emails.join(','));

            return User.pubkeys(base64);
        }

        function clearTextBody() {
            const deferred = $q.defer();

            if (isDraft() || message.IsEncrypted > 0) {
                if (!getDecryptedBody()) {
                    try {
                        decryptBody()
                        .then((result) => {
                            setDecryptedBody(result.data);
                            message.Signature = result.signature;
                            message.failedDecryption = false;
                            deferred.resolve(result.data);
                        })
                        .catch((err) => {
                            setDecryptedBody(message.Body, false);
                            message.failedDecryption = true;

                            // We need to display the encrypted body to the user if it fails
                            message.MIMEType = 'text/plain';
                            deferred.reject(err);
                        });
                    } catch (err) {
                        setDecryptedBody(message.Body, false);
                        message.MIMEType = 'text/plain';
                        message.failedDecryption = true;
                        deferred.reject(err);
                    }
                } else {
                    deferred.resolve(getDecryptedBody());
                }
            } else {
                setDecryptedBody(message.Body, false);
                deferred.resolve(getDecryptedBody());
            }

            return deferred.promise;
        }
        return _.extend(message, {
            addAttachments,
            attachmentsSize,
            cleanKey,
            clearPackets,
            clearTextBody,
            close,
            countEmbedded,
            decryptBody,
            disableDiscard,
            disableOthers,
            disableSave,
            disableSend,
            emailsToString,
            encryptBody,
            encryptionType,
            encryptPackets,
            generateReplyToken,
            getAttachment,
            getAttachments,
            getDecryptedBody,
            getJSON,
            getPublicKeys,
            isDraft,
            labels,
            plainText,
            removeAttachment,
            setDecryptedBody
        });
    };
});
