import _ from 'lodash';
import {
    arrayToBinaryString,
    encodeBase64,
    getKeys,
    encryptMessage,
    generateSessionKey,
    decryptMIMEMessage,
    decryptMessageLegacy,
    encryptSessionKey
} from 'pmcrypto';

import { VERIFICATION_STATUS, MIME_TYPES, AES256, MESSAGE_FLAGS } from '../../constants';
import { toText } from '../../../helpers/parserHTML';
import { inlineCss } from '../../../helpers/domHelper';
import { setBit, clearBit, toggleBit } from '../../../helpers/bitHelper';
import {
    isMIME,
    isInternal,
    isExternal,
    isDraft,
    isReplied,
    isRepliedAll,
    isForwarded,
    isSent,
    isSentEncrypted,
    isSentAndReceived,
    isPGPInline,
    isPGPEncrypted,
    isRequestReadReceipt,
    isAttachPublicKey,
    isSign,
    inSigningPeriod,
    isImported
} from '../../../helpers/message';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function messageModel(
    $timeout,
    dispatchers,
    embeddedUtils,
    gettextCatalog,
    AttachmentLoader,
    sanitize,
    getEncryptionType,
    attachmentConverter,
    publicKeyStore,
    attachedPublicKey,
    addressesModel,
    keysModel,
    readReceiptModel
) {
    const I18N = {
        ENCRYPTION_ERROR: gettextCatalog.getString('Error encrypting message', null, 'Error')
    };
    const ENCRYPTED_HEADERS_FILENAME = gettextCatalog.getString(
        'Encrypted Headers',
        null,
        'Encrypted Headers filename'
    );
    const defaultMessage = {
        ID: '',
        Order: 0,
        Subject: '',
        PasswordHint: '',
        Unread: 1,
        Flags: 0,
        Sender: {},
        ToList: [],
        Time: 0,
        Size: 0,
        Attachments: [],
        NumAttachments: 0,
        ExpirationTime: 0,
        AddressID: '',
        CCList: [],
        BCCList: [],
        LabelIDs: [],
        ExternalID: null
    };

    const emptyMessage = gettextCatalog.getString('Message empty', null, 'Message content if empty');
    const AUTOREPLY_HEADERS = ['X-Autoreply', 'X-Autorespond', 'X-Autoreply-From', 'X-Mail-Autoreply'];
    const { dispatcher } = dispatchers(['message']);

    class Message {
        constructor(msg) {
            _.extend(this, angular.copy(msg));
            const { ParsedHeaders = {}, xOriginalTo } = msg;

            this.isAutoReply = AUTOREPLY_HEADERS.some((header) => header in ParsedHeaders);
            this.xOriginalTo = xOriginalTo || ParsedHeaders['X-Original-To'];

            return this;
        }

        addFlag(flag) {
            this.Flags = setBit(this.Flags, flag);
        }

        toggleFlag(flag) {
            this.Flags = toggleBit(this.Flags, flag);
        }

        removeFlag(flag) {
            this.Flags = clearBit(this.Flags, flag);
        }

        toggleReadReceipt() {
            this.toggleFlag(MESSAGE_FLAGS.FLAG_RECEIPT_REQUEST);
        }

        isAttachPublicKey() {
            return isAttachPublicKey(this);
        }

        isSign() {
            return isSign(this);
        }

        toggleAttachPublicKey() {
            this.toggleFlag(MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
            // Auto sign when attaching the public key.
            this.isAttachPublicKey() && this.addFlag(MESSAGE_FLAGS.FLAG_SIGN);
        }

        toggleSign() {
            this.toggleFlag(MESSAGE_FLAGS.FLAG_SIGN);
        }

        isSent() {
            return isSent(this);
        }

        isSentAndReceived() {
            return isSentAndReceived(this);
        }

        isInternal() {
            return isInternal(this);
        }

        isEO() {
            return !!this.Password;
        }

        isExternal() {
            return isExternal(this);
        }

        isDraft() {
            return isDraft(this);
        }

        isReplied() {
            return isReplied(this);
        }

        isRepliedAll() {
            return isRepliedAll(this);
        }

        isForwarded() {
            return isForwarded(this);
        }

        isRequestReadReceipt() {
            return isRequestReadReceipt(this);
        }

        getVerificationStatus() {
            return this.verified;
        }

        generateReplyToken() {
            // Use a base64-encoded AES256 session key as the reply token
            return generateSessionKey(AES256).then((key) => encodeBase64(arrayToBinaryString(key)));
        }

        encryptionType() {
            const encType = getEncryptionType(this);

            if (encType.length > this.verified) {
                // Old messages are not signed, so missing sender signatures should be treated like external missing signatures, no warning
                if (!inSigningPeriod(this) && isSentEncrypted(this) && !isImported(this)) {
                    return encType[0];
                }

                return encType[this.verified];
            }

            return encType[0];
        }

        isPlainText() {
            return this.MIMEType === PLAINTEXT;
        }

        isSentByMe() {
            const { Address: senderAddress } = this.Sender;
            return addressesModel.getByEmail(senderAddress);
        }

        isSentEncrypted() {
            return isSentEncrypted(this);
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
            return _.find(this.Attachments || [], { ID });
        }

        getAttachments() {
            return this.Attachments || [];
        }

        attachmentsSize() {
            return (this.Attachments || []).reduce((acc, { Size = 0 } = {}) => acc + +Size, 0);
        }

        countEmbedded() {
            if (this.isPlainText()) {
                return 0;
            }
            const body = this.getDecryptedBody();
            const testDiv = embeddedUtils.getBodyParser(body);

            return embeddedUtils.extractEmbedded(this.Attachments, testDiv).length;
        }

        addAttachments(list = []) {
            this.Attachments = [].concat(this.Attachments, list);
            this.NumEmbedded = this.countEmbedded();
        }

        removeAttachment({ ID } = {}) {
            this.Attachments = (this.Attachments || []).filter((att) => att.ID !== ID);
            this.NumEmbedded = this.countEmbedded();
        }

        setDecryptedBody(input = '', purify = true) {
            this.DecryptedBody = !purify ? input : inlineCss(sanitize.message(input)); // Keep this order: sanitize first, then inline CSS
        }

        getDecryptedBody() {
            return this.DecryptedBody || '';
        }

        exportPlainText() {
            /*
             * The replace removes any characters that are produced by the copying process (like zero width characters)
             * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
             */
            if (this.MIMEType !== 'text/html') {
                return this.getDecryptedBody().replace(/\u200B/g, '');
            }
            return toText(this.getDecryptedBody(), true, true).replace(/\u200B/g, '');
        }

        getParsedHeaders(parameter) {
            const { ParsedHeaders = {} } = this;

            if (parameter) {
                return ParsedHeaders[parameter];
            }

            return ParsedHeaders;
        }

        getListUnsubscribe() {
            return this.getParsedHeaders('List-Unsubscribe') || '';
        }

        getListUnsubscribePost() {
            return this.getParsedHeaders('List-Unsubscribe-Post') || '';
        }

        requireReadReceiptConfirmation() {
            return readReceiptModel.requireConfirmation(this);
        }

        close() {
            if (angular.isDefined(this.timeoutSaving)) {
                $timeout.cancel(this.timeoutSaving);
            }
        }

        isPGPEncrypted() {
            return isPGPEncrypted(this);
        }

        isPGPInline() {
            return isPGPInline(this);
        }

        async encryptBody(publicKeys) {
            try {
                const privateKeys = keysModel.getPrivateKeys(this.From.ID)[0];
                const { data } = await encryptMessage({
                    data: this.getDecryptedBody(),
                    publicKeys: await getKeys(publicKeys),
                    privateKeys,
                    format: 'utf8',
                    compression: true
                });

                this.Body = data;

                return data;
            } catch (e) {
                throw new Error(I18N.ENCRYPTION_ERROR);
            }
        }

        isMIME() {
            return isMIME(this);
        }

        async decryptMIME({ message, privateKeys, publicKeys, date }) {
            const headerFilename = ENCRYPTED_HEADERS_FILENAME;
            const sender = this.Sender.Address;
            const result = await decryptMIMEMessage({
                message,
                privateKeys,
                publicKeys,
                date,
                headerFilename,
                sender
            });
            try {
                // extract the message body and attachments
                const { body = emptyMessage, mimetype = PLAINTEXT } = (await result.getBody()) || {};
                this.MIMEType = mimetype;

                const pmcryptoVerified = await result.verify();

                const verified =
                    !publicKeys.length && pmcryptoVerified === VERIFICATION_STATUS.SIGNED_AND_INVALID
                        ? VERIFICATION_STATUS.SIGNED_NO_PUB_KEY
                        : pmcryptoVerified;

                const attachments = attachmentConverter(this, await result.getAttachments(), verified);
                const encryptedSubject = await result.getEncryptedSubject();

                return { message: body, attachments, verified, encryptedSubject };
            } catch (e) {
                this.MIMEParsingFailed = true;
                return { message, attachments: [], verified: 0 };
            }
        }

        decryptBody() {
            const privateKeys = keysModel.getPrivateKeys(this.AddressID);

            // decryptMessageLegacy expects message to be a string!
            const message = this.Body;
            this.decrypting = true;
            const { Address: sender } = this.Sender || {};

            const getPubKeys = (sender) => {
                // Sender can be empty
                // if so, do not look up public key
                if (!sender) {
                    return Promise.resolve(null);
                }

                return publicKeyStore.get([sender]).then(({ [sender]: list }) => list);
            };

            return getPubKeys(sender)
                .then((list) => {
                    const pubKeys = list.reduce((acc, { key, compromised }) => {
                        !compromised && acc.push(key);
                        return acc;
                    }, []);

                    if (this.isMIME()) {
                        return this.decryptMIME({
                            message,
                            privateKeys,
                            publicKeys: pubKeys,
                            date: new Date(this.Time * 1000)
                        }).then((result) => {
                            this.decrypting = false;
                            return result;
                        });
                    }

                    return decryptMessageLegacy({
                        message,
                        privateKeys,
                        publicKeys: pubKeys,
                        date: new Date(this.Time * 1000)
                    }).then(({ data, verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED }) => {
                        this.decryptedMIME = data;
                        this.decrypting = false;
                        this.hasError = false;

                        const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
                        const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
                        const verified =
                            !list.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;

                        return { message: data, attachments: [], verified };
                    });
                })
                .catch((error) => {
                    this.networkError = error.status === -1;
                    this.hasError = true;
                    this.decrypting = false;
                    throw error;
                });
        }

        async encryptAttachmentKeyPackets(publicKey = '', passwords = []) {
            const packets = {};
            const publicKeys = publicKey.length ? await getKeys(publicKey) : [];

            return Promise.all(
                this.Attachments.filter(({ ID }) => ID.indexOf('PGPAttachment')).map((attachment) => {
                    return AttachmentLoader.getSessionKey(this, attachment).then(
                        ({ sessionKey = {}, AttachmentID, ID } = {}) => {
                            attachment.sessionKey = sessionKey; // Update the ref
                            return encryptSessionKey({
                                data: sessionKey.data,
                                algorithm: sessionKey.algorithm,
                                publicKeys,
                                passwords
                            }).then(({ message }) => {
                                packets[AttachmentID || ID] = encodeBase64(
                                    arrayToBinaryString(message.packets.write())
                                );
                            });
                        }
                    );
                })
            ).then(() => packets);
        }

        emailsToString() {
            return _.map(this.ToList.concat(this.CCList, this.BCCList), 'Address');
        }

        getAttachedPublicKey() {
            return attachedPublicKey.extractFromEmail(this);
        }

        async clearTextBody(forceDecrypt = false) {
            if (this.getDecryptedBody() && !forceDecrypt) {
                return this.getDecryptedBody();
            }

            try {
                const result = await this.decryptBody();

                // handle attachments + optionally reverifying them
                // prevent adding pgp attachments twice: (calling clearTextBody twice, it happens)
                // result.attachments should first: this ensures the latest Verified value is used.
                this.Attachments = result.attachments.length ? result.attachments : this.Attachments;

                if (!this.isMIME()) {
                    await Promise.all(
                        this.Attachments.filter(AttachmentLoader.has).map((attachment) =>
                            AttachmentLoader.reverify(attachment, this)
                        )
                    );
                }

                this.setDecryptedBody(result.message, !this.isPlainText());
                this.verified = result.verified;
                this.failedDecryption = false;

                if (result.encryptedSubject && this.Subject !== result.encryptedSubject) {
                    this.encryptedSubject = result.encryptedSubject;
                }
                this.NumAttachments = this.Attachments.length;
                this.NumEmbedded = this.countEmbedded();

                this.attachedPublicKey = await this.getAttachedPublicKey();

                this.hasError = false;

                dispatcher.message('decrypted', { message: this });

                return this.getDecryptedBody();
            } catch (err) {
                this.setDecryptedBody(this.Body, false);
                this.MIMEType = PLAINTEXT;
                this.failedDecryption = true;
                this.hasError = true;
                throw err;
            }
        }

        loadPGPAttachments() {
            return this.decryptBody()
                .then((result) => {
                    // prevent adding pgp attachments twice: (calling clearTextBody twice, it happened)
                    this.Attachments = _.uniq(this.Attachments.concat(result.attachments), false, ({ ID }) => ID);
                    this.NumAttachments = this.Attachments.length;
                    this.NumEmbedded = this.countEmbedded();
                })
                .then(() => this.getAttachedPublicKey())
                .then((publicKey) => (this.attachedPublicKey = publicKey));
        }
    }

    return (m = {}) => new Message({ ...defaultMessage, ...m });
}
export default messageModel;
