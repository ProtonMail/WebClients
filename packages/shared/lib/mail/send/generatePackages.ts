import type { AddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';

import type { Attachment, Message } from '../../interfaces/mail/Message';
import type { AttachmentDirect, PackageDirect, SendPreferences } from '../../interfaces/mail/crypto';
import type { RequireOnly, SimpleMap } from '../../interfaces/utils';
import { encryptPackages } from './sendEncrypt';
import { attachSubPackages } from './sendSubPackages';
import { generateTopPackages } from './sendTopPackages';

const generatePackages = async ({
    message,
    emails,
    sendPreferencesMap,
    attachments,
    attachmentData,
    addressKeysByUsage,
}: {
    message: RequireOnly<Message, 'Body' | 'MIMEType'>;
    emails: string[];
    sendPreferencesMap: SimpleMap<SendPreferences>;
    attachments: Attachment[];
    attachmentData: { attachment: AttachmentDirect; data: string };
    addressKeysByUsage: AddressKeysByUsage;
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
        addressKeysByUsage,
        message,
    });
};

export default generatePackages;
