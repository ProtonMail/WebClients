import { arrayToBinaryString, encodeBase64, encryptMessage, generateSessionKey } from 'pmcrypto';
import { MIME_TYPES, PACKAGE_TYPE, PACKAGE_SIGNATURES_MODE, AES256 } from '@proton/shared/lib/constants';
import { Package, Packages, SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getAttachments, isEO } from '@proton/shared/lib/mail/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { MessageStateWithData } from '../../logic/messages/messagesTypes';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;
const { SEND_PM, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME, SEND_EO, SEND_CLEAR_MIME } = PACKAGE_TYPE;
const { SIGNATURES_NONE, SIGNATURES_ATTACHMENTS } = PACKAGE_SIGNATURES_MODE;

const getSignatureFlag = ({ sign }: Pick<SendPreferences, 'sign'>, message: Message) =>
    sign && getAttachments(message).every(({ Signature }) => Signature) ? SIGNATURES_ATTACHMENTS : SIGNATURES_NONE;

/**
 * Package for a ProtonMail user.
 */
const sendPM = async (sendPrefs: SendPreferences, message: Message) => ({
    Type: SEND_PM,
    PublicKey: (sendPrefs.publicKeys?.length && sendPrefs.publicKeys[0]) || undefined,
    Signature: getSignatureFlag(sendPrefs, message),
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
    } catch (err: any) {
        // TODO: mark encryption failed
        console.error(err);
        throw err;
    }
};

/**
 * Package for a PGP/MIME user.
 */
const sendPGPMime = async ({ encrypt, sign, publicKeys }: SendPreferences) => {
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
const sendPGPInline = async (sendPrefs: SendPreferences, message: Message) => {
    if (sendPrefs.encrypt) {
        return {
            Type: SEND_PGP_INLINE,
            PublicKey: (sendPrefs.publicKeys?.length && sendPrefs.publicKeys[0]) || undefined,
            Signature: getSignatureFlag(sendPrefs, message),
        };
    }

    // PGP/Inline signature only
    return {
        Type: SEND_CLEAR,
        Signature: getSignatureFlag(sendPrefs, message),
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
    message: MessageStateWithData,
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
        const { encrypt, sign, pgpScheme, mimeType } = sendPrefs;
        const packageType = mimeType === 'text/html' ? DEFAULT : PLAINTEXT;

        switch (pgpScheme) {
            case SEND_PM:
                return bindPackageSet(sendPM(sendPrefs, message.data), email, packageType);
            case SEND_PGP_MIME:
                if (!sign && !encrypt) {
                    return bindPackageSet(sendClear(), email, DEFAULT);
                }
                return bindPackageSet(sendPGPMime(sendPrefs), email, MIME);
            case SEND_PGP_INLINE:
                return bindPackageSet(sendPGPInline(sendPrefs, message.data), email, PLAINTEXT);
            case SEND_EO:
            case SEND_CLEAR:
            default:
                // Encrypted for outside (EO)
                if (isEO(message.data)) {
                    return bindPackageSet(sendPMEncryptedOutside(message.data, api), email, packageType);
                }
                return bindPackageSet(sendClear(), email, packageType);
        }
    });

    await Promise.all(promises);
    return packages;
};
