import { MIME_TYPES, PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { MapSendPreferences, SendPreferences } from '../../models/crypto';

import { Package, Packages } from './sendTopPackages';
import { MessageExtended, Message } from '../../models/message';
import { isEO, getAttachments } from '../message/messages';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;
const { SEND_PM, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME, SEND_EO } = PACKAGE_TYPE;

export const SEND_MIME = 32; // TODO update proton-shared constant

/**
 * Package for a ProtonMail user.
 */
const sendPM = async ({ publicKeys }: Pick<SendPreferences, 'publicKeys'>, message: Message = {}) => ({
    Type: SEND_PM,
    PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
    Signature: getAttachments(message).every(({ Signature }) => Signature)
});

/**
 * Package for a outside user using ProtonMail encryption
 */
const sendPMEncryptedOutside = async (message: Message = {}) => {
    console.warn('Unsuported yet', message);

    // TODO

    return {};

    // try {
    //     const Token = await message.generateReplyToken();

    //     const [{ data: EncToken }, { Auth }] = await Promise.all([
    //         encryptMessage({ data: Token, publicKeys: [], passwords: [message.Password] }),
    //         srp.getVerify({ Password: message.Password })
    //     ]);

    //     return {
    //         Auth,
    //         Type: SEND_TYPES.SEND_EO,
    //         PasswordHint: message.PasswordHint,
    //         Token,
    //         EncToken,
    //         Signature: +message.Attachments.every(({ Signature }) => Signature)
    //     };
    // } catch (err) {
    //     message.encrypting = false;
    //     dispatchMessageAction(message);
    //     console.error(err);
    //     throw err;
    // }
};

/**
 * Package for a PGP/MIME user.
 */
const sendPGPMime = async ({ encrypt, sign, publicKeys }: Pick<SendPreferences, 'encrypt' | 'sign' | 'publicKeys'>) => {
    if (encrypt) {
        return {
            Type: SEND_PGP_MIME,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined
        };
    }

    // PGP/MIME signature only
    return {
        Type: SEND_MIME,
        Signature: +sign
    };
};

/**
 * Package for a PGP/Inline user.
 */
const sendPGPInline = async (
    { encrypt, sign, publicKeys }: Pick<SendPreferences, 'encrypt' | 'sign' | 'publicKeys'>,
    message: Message = {}
) => {
    if (encrypt) {
        return {
            Type: SEND_PGP_INLINE,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
            Signature: getAttachments(message).every(({ Signature }) => Signature)
        };
    }

    // PGP/Inline signature only
    return {
        Type: SEND_CLEAR,
        Signature: +sign
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
    message: MessageExtended,
    emails: string[],
    mapSendPrefs: MapSendPreferences
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
        const { encrypt, sign, pgpScheme, mimetype, publicKeys } = mapSendPrefs[email];

        const mimeType = mimetype === null ? message.data?.MIMEType : mimetype;
        const packageType = mimeType === 'text/html' ? DEFAULT : PLAINTEXT;

        switch (pgpScheme) {
            case SEND_PM:
                return bindPackageSet(sendPM({ publicKeys }, message.data), email, packageType);
            case SEND_PGP_MIME:
                if (!sign && !encrypt) {
                    return bindPackageSet(sendClear(), email, DEFAULT);
                }
                return bindPackageSet(sendPGPMime({ encrypt, sign, publicKeys }), email, MIME);
            case SEND_PGP_INLINE:
                return bindPackageSet(sendPGPInline({ encrypt, sign, publicKeys }, message.data), email, PLAINTEXT);
            case SEND_EO:
            case SEND_CLEAR:
                // Encrypted for outside (EO)
                if (isEO(message.data)) {
                    return bindPackageSet(sendPMEncryptedOutside(message.data), email, packageType);
                }

                return bindPackageSet(sendClear(), email, packageType);
        }
    });

    await Promise.all(promises);
    return packages;
};
