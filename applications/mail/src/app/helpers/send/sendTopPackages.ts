import { WorkerDecryptionResult } from '@proton/crypto';
import { MIME_TYPES, PACKAGE_TYPE } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { Package, PackageStatus, Packages, SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { addReceived } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';

import { MessageKeys, MessageState } from '../../logic/messages/messagesTypes';
import { getPlainText } from '../message/messageContent';
import { prepareExport } from '../message/messageExport';
import { constructMime } from './sendMimeBuilder';

// Reference: Angular/src/app/composer/services/encryptMessage.js
// Reference: Angular/src/app/composer/services/generateTopPackages.js

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;

/**
 * Generates the mime top-level packages, which include all attachments in the body.
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const generateMimePackage = async (
    message: MessageState,
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    api: Api
): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: MIME,
    Body: await constructMime(message, messageKeys, getAttachment, onUpdateAttachment, api),
});

const generatePlainTextPackage = async (message: MessageState): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: PLAINTEXT,
    Body: getPlainText(message, true),
});

const generateHTMLPackage = async (message: MessageState): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: DEFAULT,
    // We NEVER upconvert, if the user wants html: plaintext is actually fine as well
    Body: prepareExport(message),
});

/**
 * Generates all top level packages. The top level packages have unencrypted bodies which are encrypted later on
 * once the sub level packages are attached, so we know with which keys we need to encrypt the bodies with.
 * Top level packages that are not needed are not generated.
 */
export const generateTopPackages = async (
    message: MessageState,
    messageKeys: MessageKeys,
    mapSendPrefs: SimpleMap<SendPreferences>,
    getAttachment: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    api: Api
): Promise<Packages> => {
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

    await Promise.all(
        demandedPackages.map(async (type) => {
            switch (type) {
                case MIME:
                    packages[MIME] = await generateMimePackage(
                        message,
                        messageKeys,
                        getAttachment,
                        onUpdateAttachment,
                        api
                    );
                    return;
                case PLAINTEXT:
                    packages[PLAINTEXT] = await generatePlainTextPackage(message);
                    return;
                case DEFAULT:
                    packages[DEFAULT] = await generateHTMLPackage(message);
                    return;
                default:
                    throw new Error(); // Should never happen.
            }
        })
    );

    return packages;
};
