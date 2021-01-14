/**
 * Currently this is basically a copy of sendSubPackages from the mail repo. TO BE IMPROVED
 */
import { MIME_TYPES, PACKAGE_TYPE } from '../../constants';
import isTruthy from '../../helpers/isTruthy';
import { AttachmentDirect, PackageDirect, PackageStatus, SendPreferences } from '../../interfaces/mail/crypto';
import { Message } from '../../interfaces/mail/Message';
import { RequireOnly, SimpleMap } from '../../interfaces/utils';
import { constructMime } from './helpers';

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;

/**
 * Generates the mime top-level packages, which include all attachments in the body.
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const generateMimePackage = (
    message: RequireOnly<Message, 'Body'>,
    attachmentData: { attachment: AttachmentDirect; data: string }
): PackageDirect => ({
    Addresses: {},
    MIMEType: MIME,
    Body: constructMime(message.Body, attachmentData),
});

const generatePlainTextPackage = (message: RequireOnly<Message, 'Body'>): PackageDirect => ({
    Addresses: {},
    MIMEType: PLAINTEXT,
    Body: message.Body,
});

const generateHTMLPackage = (message: RequireOnly<Message, 'Body'>): PackageDirect => ({
    Addresses: {},
    MIMEType: DEFAULT,
    // We NEVER upconvert, if the user wants html: plaintext is actually fine as well
    Body: message.Body,
});

/**
 * Generates all top level packages. The top level packages have unencrypted bodies which are encrypted later on
 * once the sub level packages are attached, so we know with which keys we need to encrypt the bodies with.
 * Top level packages that are not needed are not generated.
 */
export const generateTopPackages = ({
    message,
    sendPreferencesMap,
    attachmentData,
}: {
    message: RequireOnly<Message, 'Body'>;
    sendPreferencesMap: SimpleMap<SendPreferences>;
    attachmentData: { attachment: AttachmentDirect; data: string };
}): SimpleMap<PackageDirect> => {
    const packagesStatus: PackageStatus = Object.values(sendPreferencesMap)
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

    const packages: SimpleMap<PackageDirect> = {};

    demandedPackages.map(async (type) => {
        switch (type) {
            case MIME:
                packages[MIME] = generateMimePackage(message, attachmentData);
                return;
            case PLAINTEXT:
                packages[PLAINTEXT] = generatePlainTextPackage(message);
                return;
            case DEFAULT:
                packages[DEFAULT] = generateHTMLPackage(message);
                return;
            default:
                throw new Error(); // Should never happen.
        }
    });

    return packages;
};
