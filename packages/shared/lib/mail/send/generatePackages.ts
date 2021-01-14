import { OpenPGPKey } from 'pmcrypto';
import { AttachmentDirect, PackageDirect, SendPreferences } from '../../interfaces/mail/crypto';
import { Attachment, Message } from '../../interfaces/mail/Message';
import { RequireOnly, SimpleMap } from '../../interfaces/utils';
import { encryptPackages } from './sendEncrypt';
import { attachSubPackages } from './sendSubPackages';
import { generateTopPackages } from './sendTopPackages';

const generatePackages = async ({
    message,
    emails,
    sendPreferencesMap,
    attachments,
    attachmentData,
    publicKeys,
    privateKeys,
}: {
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
    emails: string[];
    sendPreferencesMap: SimpleMap<SendPreferences>;
    attachments: Attachment[];
    attachmentData: { attachment: AttachmentDirect; data: string };
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
}): Promise<SimpleMap<PackageDirect>> => {
    // There are two packages to be generated for the payload.
    // The Packages in the request body, called here top-level packages
    // The Packages inside Packages.addresses, called subpackages here
    let packages = generateTopPackages({
        message,
        sendPreferencesMap,
        attachmentData,
    });
    packages = await attachSubPackages({
        packages,
        attachments,
        emails,
        sendPreferencesMap,
    });
    return encryptPackages({
        packages,
        attachments,
        publicKeys,
        privateKeys,
        message,
    });
};

export default generatePackages;
