/**
 * Currently this is basically a copy of sendSubPackages from the mail repo. TO BE IMPROVED
 */
import { MIME_TYPES, PACKAGE_TYPE } from '../../constants';
import { SendPreferences, PackageDirect } from '../../interfaces/mail/crypto';
import { Attachment } from '../../interfaces/mail/Message';
import { SimpleMap } from '../../interfaces/utils';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;
const { SEND_PM, SEND_CLEAR, SEND_PGP_INLINE, SEND_PGP_MIME, SEND_CLEAR_MIME } = PACKAGE_TYPE;

/**
 * Package for a ProtonMail user.
 */
const sendPM = async ({ publicKeys }: Pick<SendPreferences, 'publicKeys'>, attachments: Attachment[] = []) => ({
    Type: SEND_PM,
    PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
    Signature: +attachments.every(({ Signature }) => Signature),
});

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
    attachments: Attachment[] = []
) => {
    if (encrypt) {
        return {
            Type: SEND_PGP_INLINE,
            PublicKey: (publicKeys?.length && publicKeys[0]) || undefined,
            Signature: +attachments.every(({ Signature }) => Signature),
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
export const attachSubPackages = async ({
    packages,
    attachments = [],
    emails,
    mapSendPrefs,
}: {
    packages: SimpleMap<PackageDirect>;
    attachments: Attachment[];
    emails: string[];
    mapSendPrefs: SimpleMap<SendPreferences>;
}): Promise<SimpleMap<PackageDirect>> => {
    const bindPackageSet = async (promise: Promise<PackageDirect>, email: string, type: MIME_TYPES) => {
        const pack = await promise;
        const packageToUpdate = packages[type] as PackageDirect;

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
                return bindPackageSet(sendPM({ publicKeys }, attachments), email, packageType);
            case SEND_PGP_MIME:
                if (!sign && !encrypt) {
                    return bindPackageSet(sendClear(), email, DEFAULT);
                }
                return bindPackageSet(sendPGPMime({ encrypt, sign, publicKeys }), email, MIME);
            case SEND_PGP_INLINE:
                return bindPackageSet(sendPGPInline({ encrypt, sign, publicKeys }, attachments), email, PLAINTEXT);
            case SEND_CLEAR:
                // Sent encrypted for outside (EO) not supported here
                return bindPackageSet(sendClear(), email, packageType);
            default:
                throw new Error('Invalid PGP scheme');
        }
    });

    await Promise.all(promises);
    return packages;
};
