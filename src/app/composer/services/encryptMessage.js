import _ from 'lodash';

/* @ngInject */
function encryptMessage($rootScope, pmcw, srp, ComposerRequestStatus, outsidersMap, CONSTANTS, gettextCatalog) {
    const { SEND_TYPES } = CONSTANTS;
    const ERROR_REQUEST_KEYS = gettextCatalog.getString('Cannot get public keys', null, 'Encrypt message');

    const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', message);

    /**
     * Unencrypted for outside.
     * @return {Promise}
     */
    const cleartextUser = async () => ({ Type: SEND_TYPES.SEND_CLEAR, Signature: 0 });

    /**
     * Return the cleartext body session key.
     * @param {Object} Options.data sessionKey
     * @return {Promise}
     */
    const getCleartextBodyKeyPacket = ({ data }) => async () => pmcw.encode_base64(pmcw.arrayToBinaryString(data));

    /**
     * Encrypt the body's session key.
     * @param  {Object} options.{ data, algorithm } SessionKey
     * @param  {Array}  publicKeys
     * @param  {Array}  passwords
     * @return {Promise}
     */
    const encryptBodyKeyPacket = async ({ sessionKey = {}, publicKeys = [], passwords = [] }) => {
        const { message } = await pmcw.encryptSessionKey({
            data: sessionKey.data,
            algorithm: sessionKey.algorithm,
            publicKeys: publicKeys.length > 0 ? pmcw.getKeys(publicKeys) : [],
            passwords
        });
        return pmcw.encode_base64(pmcw.arrayToBinaryString(message.packets.write()));
    };

    /**
     * Encrypt for a ProtonMail user.
     * @param  {Array} publicKey
     * @param  {Object} sessionKey
     * @return {Promise}
     */
    const insideUser = async (message, publicKey, sessionKey) => {
        const [BodyKeyPacket, AttachmentKeyPackets] = await Promise.all([
            encryptBodyKeyPacket({ sessionKey, publicKeys: publicKey }),
            message.encryptAttachmentKeyPackets(publicKey)
        ]);

        return {
            Type: CONSTANTS.SEND_TYPES.SEND_PM,
            BodyKeyPacket,
            AttachmentKeyPackets,
            Signature: 0
        };
    };

    /**
     * Encrypt for outside (EO).
     * Encrypt the token, the body session key and each attachment's session key.
     * @todo  SRP Support
     * @param  {Message} message
     * @return {Promise}
     */
    const encryptedOutsideUser = async (message, sessionKey) => {
        try {
            const Token = message.generateReplyToken();

            const [{ data: EncToken }, BodyKeyPacket, AttachmentKeyPackets, verifier] = await Promise.all([
                pmcw.encryptMessage({ data: Token, publicKeys: [], passwords: [message.Password] }),
                encryptBodyKeyPacket({ passwords: message.Password, sessionKey }),
                message.encryptAttachmentKeyPackets([], [message.Password]),
                srp.randomVerifier(message.Password)
            ]);

            return {
                Auth: verifier.Auth,
                Type: SEND_TYPES.SEND_EO,
                PasswordHint: message.PasswordHint,
                Token,
                EncToken,
                BodyKeyPacket,
                AttachmentKeyPackets,
                Signature: 0
            };
        } catch (err) {
            message.encrypting = false;
            dispatchMessageAction(message);
            console.error(err);
            throw err;
        }
    };

    /**
     * Build process per emails based on their type (with public key or not or eo)
     * @param  {Message} message
     * @param  {Array} emails
     * @param  {Array} options.publicKeys
     * @param  {Object} options.sessionKey
     * @param  {Uint8Array} options.dataPacket
     * @return {Object}                    { promises:<List:promises>, cleartext:Boolean, packageSet:Object }
     */
    const parseRecipients = (message, emails, { publicKeys, sessionKey, dataPacket }) => {
        /**
         * Build a package set for the message.
         * @todo: PGP/MIME packages will need to be added to another package
         * set, but is not yet implemented.
         */
        const packageSet = {
            Type: 0,
            Addresses: {},
            MIMEType: message.MIMEType || 'text/html',
            Body: pmcw.encode_base64(pmcw.arrayToBinaryString(dataPacket[0]))
        };

        const cleartextBodyKeyPacket = getCleartextBodyKeyPacket(sessionKey);

        const bindPackageSet = (promise, email) => {
            return promise.then((pkg) => {
                packageSet.Addresses[email] = pkg;
                packageSet.Type |= pkg.Type;
            });
        };

        const { promises, cleartext } = emails.reduce(
            (acc, email) => {
                // Inside user
                if (publicKeys[email] && publicKeys[email].length > 0) {
                    acc.promises.push(bindPackageSet(insideUser(message, publicKeys[email], sessionKey), email));
                    return acc;
                }

                // Encrypted for outside (EO)
                if (message.IsEncrypted === 1) {
                    acc.promises.push(bindPackageSet(encryptedOutsideUser(message, sessionKey), email));
                    return acc;
                }

                // Cleartext for outside
                acc.cleartext = true;
                acc.promises.push(bindPackageSet(cleartextUser(), email));
                return acc;
            },
            { cleartext: false, promises: [] }
        );

        if (cleartext) {
            // Add cleartext body & attachments keys only if necessary
            const cleartextBodyAttachments = async () => {
                const [bodyKey, attachmentKeys] = await Promise.all([cleartextBodyKeyPacket(), message.cleartextAttachmentKeyPackets()]);

                packageSet.BodyKey = bodyKey;
                packageSet.AttachmentKeys = attachmentKeys;
            };
            promises.push(cleartextBodyAttachments());
        }

        return { promises, cleartext, packageSet };
    };

    /*
         * Encrypt a message, given a list of emails and their public keys.
         * Returns an object containing a cleartext field set to true if the
         * message is sent unencrypted to some recipients, and an encrypt function
         * that encrypts the message and returns a list of package sets.
         */
    async function encryptFromPublicKeys(message, emails, publicKeys) {
        // First get the body's session key and data packet
        const { sessionKey, dataPacket } = await message.cleartextBodyPackets();
        const { promises, cleartext, packageSet } = parseRecipients(message, emails, { sessionKey, dataPacket, publicKeys });

        // The message won't keep the ref
        outsidersMap.set(message.ID, cleartext);

        return {
            cleartext,
            encrypt() {
                return Promise.all(promises).then(() => [packageSet]);
            }
        };
    }

    /**
     * Encrypt a message given a list of recipients. This function has the same
     * return value as encryptFromPublicKeys.
     * @param  {Message} message
     * @param  {Array} emails
     * @return {Promise}
     */
    async function encryptFromEmails(message, emails) {
        try {
            const uniqueEmails = _.uniq(emails);
            const { data } = await message.getPublicKeys(uniqueEmails);

            return encryptFromPublicKeys(message, uniqueEmails, data);
        } catch (err) {
            const { data = {} } = err || {};
            console.error('Cannot encrypt message', err);
            message.encrypting = false;
            dispatchMessageAction(message);
            throw new Error(data.Error || ERROR_REQUEST_KEYS);
        }
    }

    return encryptFromEmails;
}
export default encryptMessage;
