import { CryptoProxy } from '@proton/crypto';
import { arrayToBinaryString, encodeBase64 } from '@proton/crypto/lib/utils';
import { AES256, MIME_TYPES, PACKAGE_SIGNATURES_MODE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { Package, Packages, SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import { getAttachments, isEO } from '@proton/shared/lib/mail/messages';
import { srpGetVerify } from '@proton/shared/lib/srp';

const getSignatureFlag = ({ sign }: Pick<SendPreferences, 'sign'>, message: Message) =>
    sign && getAttachments(message).every(({ Signature }) => Signature)
        ? PACKAGE_SIGNATURES_MODE.SIGNATURES_ATTACHMENTS
        : PACKAGE_SIGNATURES_MODE.SIGNATURES_NONE;

/**
 * Package for a Proton Mail user.
 */
const sendPM = async (sendPrefs: SendPreferences, message: Message) => ({
    Type: PACKAGE_TYPE.SEND_PM,
    PublicKey: (sendPrefs.publicKeys?.length && sendPrefs.publicKeys[0]) || undefined,
    Signature: getSignatureFlag(sendPrefs, message),
});

/**
 * Package for a outside user using Proton Mail encryption
 */
const sendPMEncryptedOutside = async (message: Message, api: Api) => {
    try {
        const sessionKey = await CryptoProxy.generateSessionKeyForAlgorithm(AES256);
        const Token = encodeBase64(arrayToBinaryString(sessionKey));

        const [{ message: EncToken }, { Auth }] = await Promise.all([
            CryptoProxy.encryptMessage({
                textData: Token,
                stripTrailingSpaces: true,
                passwords: [message.Password || ''], // TODO can password actually be undefined?
            }),
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
            Type: PACKAGE_TYPE.SEND_PGP_MIME,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
        };
    }

    // PGP/MIME signature only
    return {
        Type: PACKAGE_TYPE.SEND_CLEAR_MIME,
        Signature: +sign,
    };
};

/**
 * Package for a PGP/Inline user.
 */
const sendPGPInline = async (sendPrefs: SendPreferences, message: Message) => {
    if (sendPrefs.encrypt) {
        return {
            Type: PACKAGE_TYPE.SEND_PGP_INLINE,
            PublicKey: (sendPrefs.publicKeys?.length && sendPrefs.publicKeys[0]) || undefined,
            Signature: getSignatureFlag(sendPrefs, message),
        };
    }

    // PGP/Inline signature only
    return {
        Type: PACKAGE_TYPE.SEND_CLEAR,
        Signature: getSignatureFlag(sendPrefs, message),
    };
};

/**
 * Package for an unencrypted user
 */
const sendClear = async () => ({ Type: PACKAGE_TYPE.SEND_CLEAR, Signature: 0 });

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
        const { encrypt, sign, pgpScheme, mimeType } = sendPrefs;
        const packageType = mimeType === 'text/html' ? MIME_TYPES.DEFAULT : MIME_TYPES.PLAINTEXT;

        switch (pgpScheme) {
            case PACKAGE_TYPE.SEND_PM:
                return bindPackageSet(sendPM(sendPrefs, message), email, packageType);
            case PACKAGE_TYPE.SEND_PGP_MIME:
                if (!sign && !encrypt) {
                    return bindPackageSet(sendClear(), email, MIME_TYPES.DEFAULT);
                }
                return bindPackageSet(sendPGPMime(sendPrefs), email, MIME_TYPES.MIME);
            case PACKAGE_TYPE.SEND_PGP_INLINE:
                return bindPackageSet(sendPGPInline(sendPrefs, message), email, MIME_TYPES.PLAINTEXT);
            case PACKAGE_TYPE.SEND_EO:
            case PACKAGE_TYPE.SEND_CLEAR:
            default:
                // Encrypted for outside (EO)
                if (isEO(message)) {
                    return bindPackageSet(sendPMEncryptedOutside(message, api), email, packageType);
                }
                return bindPackageSet(sendClear(), email, packageType);
        }
    });

    await Promise.all(promises);
    return packages;
};
