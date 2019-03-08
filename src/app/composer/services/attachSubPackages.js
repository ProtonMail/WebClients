import _ from 'lodash';
import { encryptMessage } from 'pmcrypto';

import { SEND_TYPES } from '../../constants';

/* @ngInject */
function attachSubPackages(dispatchers, srp) {
    const { dispatcher } = dispatchers(['actionMessage']);
    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);

    /**
     * Package for a ProtonMail user.
     * @param { Array } publickeys
     * @param { Object } topPackage
     * @param { Object } message
     * @returns {Promise.<{Type: number, BodyKeyPacket: *, AttachmentKeyPackets: *, Signature: number}>}
     */
    const sendPM = async ({ publickeys }, message) => {
        return {
            Type: SEND_TYPES.SEND_PM,
            PublicKey: publickeys.length ? publickeys[0] : undefined,
            Signature: +message.Attachments.every(({ Signature }) => Signature)
        };
    };

    /**
     * Package for a outside user using ProtonMail encryption
     * @param  {Object} message
     * @param  {Object} topPackage
     * @return {Promise}
     */
    const sendPMEncryptedOutside = async (message) => {
        try {
            const Token = await message.generateReplyToken();

            const [{ data: EncToken }, { Auth }] = await Promise.all([
                encryptMessage({ data: Token, publicKeys: [], passwords: [message.Password] }),
                srp.getVerify({ Password: message.Password })
            ]);

            return {
                Auth,
                Type: SEND_TYPES.SEND_EO,
                PasswordHint: message.PasswordHint,
                Token,
                EncToken,
                Signature: +message.Attachments.every(({ Signature }) => Signature)
            };
        } catch (err) {
            message.encrypting = false;
            dispatchMessageAction(message);
            console.error(err);
            throw err;
        }
    };

    /**
     * Package for a PGP/MIME user.
     * @param { Array } publickeys
     * @param { Boolean } sign
     * @param { Boolean } encrypt
     * @param { Object } topPackage
     * @returns {Promise.<*>}
     */
    const sendPGPMime = async ({ publickeys, sign, encrypt }) => {
        if (encrypt) {
            return {
                Type: SEND_TYPES.SEND_PGP_MIME,
                PublicKey: publickeys.length ? publickeys[0] : undefined
            };
        }

        // PGP/MIME signature only
        return {
            Type: SEND_TYPES.SEND_MIME,
            Signature: +sign
        };
    };

    /**
     * Package for a PGP/Inline user.
     * @param { Array } publickeys
     * @param { Boolean } sign
     * @param { Boolean } encrypt
     * @param { Object } topPackage
     * @param { Object } message
     * @returns {Promise.<*>}
     */
    const sendPGPInline = async ({ publickeys, sign, encrypt }, message) => {
        if (encrypt) {
            return {
                Type: SEND_TYPES.SEND_PGP_INLINE,
                PublicKey: publickeys.length ? publickeys[0] : undefined,
                Signature: +message.Attachments.every(({ Signature }) => Signature)
            };
        }

        // PGP/Inline signature only
        return {
            Type: SEND_TYPES.SEND_CLEAR,
            Signature: +sign
        };
    };

    /**
     * Package for an unencrypted user
     */
    const sendClear = () => Promise.resolve({ Type: SEND_TYPES.SEND_CLEAR, Signature: 0 });

    /**
     * Attach the subpackages for encryptMessage to the given top level packages. The packages need to be encrypted before
     * they can be send to the api. See encryptPackages for that.
     * @param packages
     * @param message
     * @param emails
     * @param sendPref
     * @returns {Promise.<TResult>}
     */
    const attachSubPackages = (packages, message, emails, sendPref) => {
        const bindPackageSet = (promise, email, type) => {
            return promise.then((pkg) => {
                packages[type].Addresses[email] = pkg;
                packages[type].Type |= pkg.Type;
            });
        };

        const promises = _.map(emails, (email) => {
            const info = sendPref[email];

            const mimeType = info.mimetype === null ? message.MIMEType : info.mimetype;
            const packageType = mimeType === 'text/html' ? 'html' : 'plaintext';

            switch (info.scheme) {
                case SEND_TYPES.SEND_PM:
                    return bindPackageSet(sendPM(info, message), email, packageType);
                case SEND_TYPES.SEND_PGP_MIME:
                    if (!info.sign && !info.encrypt) {
                        return bindPackageSet(sendClear(), email, 'html');
                    }
                    return bindPackageSet(sendPGPMime(info), email, 'mime');
                case SEND_TYPES.SEND_PGP_INLINE:
                    return bindPackageSet(sendPGPInline(info, message), email, 'plaintext');
                case SEND_TYPES.SEND_EO:
                case SEND_TYPES.SEND_CLEAR:
                    // Encrypted for outside (EO)
                    if (message.isEO()) {
                        return bindPackageSet(sendPMEncryptedOutside(message), email, packageType);
                    }

                    return bindPackageSet(sendClear(), email, packageType);
            }
        });

        return Promise.all(promises).then(() => packages);
    };

    return attachSubPackages;
}
export default attachSubPackages;
