/**
 * Currently this is basically a copy of sendSubPackages from the mail repo. TO BE IMPROVED
 */
import { arrayToBinaryString, encodeBase64, encryptMessage, generateSessionKey } from 'pmcrypto';
import { AES256, MIME_TYPES, PACKAGE_TYPE } from '../../constants';
import { Api } from '../../interfaces';
import { SendPreferences, Package, Packages } from '../../interfaces/mail/crypto';
import { Message } from '../../interfaces/mail/Message';
import { SimpleMap } from '../../interfaces/utils';
import { srpGetVerify } from '../../srp';
import { getAttachments, isEO } from '../messages';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;
const { SEND_PM, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME, SEND_CLEAR_MIME } = PACKAGE_TYPE;

/**
 * Package for a ProtonMail user.
 */
const sendPM = async ({ publicKeys }: Pick<SendPreferences, 'publicKeys'>, message: Message) => ({
    Type: SEND_PM,
    PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
    Signature: getAttachments(message).every(({ Signature }) => Signature),
});

/**
 * Package for a outside user using ProtonMail encryption
 */
const sendPMEncryptedOutside = async (message: Message, api: Api) => {
    try {
        const sessionKey = await generateSessionKey(AES256);
        const Token = encodeBase64(arrayToBinaryString(sessionKey));

        const [{ data: EncToken }, { Auth }] = await Promise.all([
            encryptMessage({ data: Token, publicKeys: [], passwords: [message.Password] }),
            srpGetVerify({ api, credentials: { password: message.Password || '' } }),
        ]);

        return {
            Auth,
            Type: PACKAGE_TYPE.SEND_EO,
            PasswordHint: message.PasswordHint,
            Token,
            EncToken,
            Signature: +message.Attachments.every(({ Signature }) => Signature),
        };
    } catch (err) {
        // TODO: mark encryption failed
        console.error(err);
        throw err;
    }
};

/**
 * Package for a PGP/MIME user.
 */
const sendPGPMime = async ({ encrypt, sign, publicKeys }: Pick<SendPreferences, 'encrypt' | 'sign' | 'publicKeys'>) => {
    if (encrypt) {
        return {
            Type: SEND_PGP_MIME,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
        };
    }

    // PGP/MIME signature only
    return {
        Type: SEND_CLEAR_MIME,
        Signature: +sign,
    };
};

/**
 * Package for a PGP/Inline user.
 */
const sendPGPInline = async (
    { encrypt, sign, publicKeys }: Pick<SendPreferences, 'encrypt' | 'sign' | 'publicKeys'>,
    message: Message
) => {
    if (encrypt) {
        return {
            Type: SEND_PGP_INLINE,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
            Signature: getAttachments(message).every(({ Signature }) => Signature),
        };
    }

    // PGP/Inline signature only
    return {
        Type: SEND_CLEAR,
        Signature: +sign,
    };
};

/**
 * Package for an unencrypted user
 */
const sendClear = async () => ({ Type: SEND_CLEAR, Signature: 0 });

/**
 * Attach the subpackages for encryptMessage to the given top level packages. The packages need to be encrypted before
 * they can be send to the api. See encryptPackages for that.
 */
export const attachSubPackages = async (
    packages: Packages,
    message: Message,
    emails: string[],
    mapSendPrefs: SimpleMap<SendPreferences>,
    api: Api
): Promise<Packages> => {
    const bindPackageSet = async (promise: Promise<Package>, email: string, type: MIME_TYPES) => {
        const pack = await promise;
        const packageToUpdate = packages[type] as Package;

        if (!packageToUpdate.Addresses) {
            packageToUpdate.Addresses = {};
        }
        if (!packageToUpdate.Type) {
            packageToUpdate.Type = 0;
        }

        packageToUpdate.Addresses[email] = pack;
        packageToUpdate.Type |= pack.Type || 0;
    };

    const promises = emails.map((email: string) => {
        const sendPrefs = mapSendPrefs[email];
        if (!sendPrefs) {
            throw new Error('Missing send preferences');
        }
        const { encrypt, sign, pgpScheme, mimeType, publicKeys } = sendPrefs;
        const packageType = mimeType === 'text/html' ? DEFAULT : PLAINTEXT;

        switch (pgpScheme) {
            case SEND_PM:
                return bindPackageSet(sendPM({ publicKeys }, message), email, packageType);
            case SEND_PGP_MIME:
                if (!sign && !encrypt) {
                    return bindPackageSet(sendClear(), email, DEFAULT);
                }
                return bindPackageSet(sendPGPMime({ encrypt, sign, publicKeys }), email, MIME);
            case SEND_PGP_INLINE:
                return bindPackageSet(sendPGPInline({ encrypt, sign, publicKeys }, message), email, PLAINTEXT);
            case SEND_CLEAR:
                // Encrypted for outside (EO)
                if (isEO(message)) {
                    return bindPackageSet(sendPMEncryptedOutside(message, api), email, packageType);
                }
                return bindPackageSet(sendClear(), email, packageType);
            default:
                throw new Error('Invalid PGP scheme');
        }
    });

    await Promise.all(promises);
    return packages;
};
