/**
 * Currently this is basically a copy of sendSubPackages from the mail repo. TO BE IMPROVED
 */
import { MIME_TYPES, PACKAGE_TYPE } from '../../constants';
import isTruthy from '../../helpers/isTruthy';
import { Package, Packages, PackageStatus, SendPreferences } from '../../interfaces/mail/crypto';
import { Attachment, Message } from '../../interfaces/mail/Message';
import { SimpleMap } from '../../interfaces/utils';
import { addReceived } from '../messages';
import { constructMime } from './helpers';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;

/**
 * Generates the mime top-level packages, which include all attachments in the body.
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const generateMimePackage = (
    message: Message,
    body = '',
    attachmentData: { attachment: Attachment; data: string }
): Package => ({
    Flags: addReceived(message?.Flags),
    Addresses: {},
    MIMEType: MIME,
    Body: constructMime(body, attachmentData),
});

const generatePlainTextPackage = (message: Message, body = ''): Package => ({
    Flags: addReceived(message?.Flags),
    Addresses: {},
    MIMEType: PLAINTEXT,
    Body: body,
});

const generateHTMLPackage = (message: Message, body = ''): Package => ({
    Flags: addReceived(message?.Flags),
    Addresses: {},
    MIMEType: DEFAULT,
    // We NEVER upconvert, if the user wants html: plaintext is actually fine as well
    Body: body,
});

/**
 * Generates all top level packages. The top level packages have unencrypted bodies which are encrypted later on
 * once the sub level packages are attached, so we know with which keys we need to encrypt the bodies with.
 * Top level packages that are not needed are not generated.
 */
export const generateTopPackages = (
    message: Message,
    body: string,
    mapSendPrefs: SimpleMap<SendPreferences>,
    attachmentData: { attachment: Attachment; data: string }
): Packages => {
    const packagesStatus: PackageStatus = Object.values(mapSendPrefs)
        .filter(isTruthy)
        .reduce(
            (packages, { encrypt, sign, pgpScheme, mimeType }) => ({
                [PLAINTEXT]: packages[PLAINTEXT] || mimeType === MIME_TYPES.PLAINTEXT,
                [DEFAULT]:
                    packages[DEFAULT] ||
                    mimeType === DEFAULT ||
                    (pgpScheme === PACKAGE_TYPE.SEND_PGP_MIME && !encrypt && !sign),
                [MIME]: packages[MIME] || (pgpScheme === PACKAGE_TYPE.SEND_PGP_MIME && (encrypt || sign)),
            }),
            {
                [PLAINTEXT]: false,
                [DEFAULT]: false,
                [MIME]: false,
            } as PackageStatus
        );

    const demandedPackages = Object.values(MIME_TYPES).filter((k) => packagesStatus[k]);

    const packages: Packages = {};

    demandedPackages.map(async (type) => {
        switch (type) {
            case MIME:
                packages[MIME] = generateMimePackage(message, body, attachmentData);
                return;
            case PLAINTEXT:
                packages[PLAINTEXT] = generatePlainTextPackage(message, body);
                return;
            case DEFAULT:
                packages[DEFAULT] = generateHTMLPackage(message, body);
                return;
            default:
                throw new Error(); // Should never happen.
        }
    });

    return packages;
};
