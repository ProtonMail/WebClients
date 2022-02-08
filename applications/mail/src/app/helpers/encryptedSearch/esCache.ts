import { Recipient } from '@proton/shared/lib/interfaces';
import { AttachmentInfo } from '@proton/shared/lib/interfaces/mail/Message';
import { ESMessage } from '../../models/encryptedSearch';

/**
 * Estimate the size of a ESMessage object
 */
export const sizeOfCachedMessage = (cachedMessage: ESMessage) => {
    const sizeOfRecipient = (recipient: Recipient) => {
        let innerBytes = 0;
        let innerKey: keyof typeof recipient;
        for (innerKey in recipient) {
            if (Object.prototype.hasOwnProperty.call(recipient, innerKey)) {
                const innerValue = recipient[innerKey];
                if (!innerValue) {
                    continue;
                }
                innerBytes += (innerKey.length + innerValue.length) * 2;
            }
        }
        return innerBytes;
    };

    const sizeOfAttachmentInfo = (attachmentInfo: AttachmentInfo) => {
        let innerBytes = 0;
        let innerKey: keyof typeof attachmentInfo;
        for (innerKey in attachmentInfo) {
            if (Object.prototype.hasOwnProperty.call(attachmentInfo, innerKey)) {
                const innerValue = attachmentInfo[innerKey];
                if (!innerValue) {
                    continue;
                }
                innerBytes += (innerKey.length + 8) * 2;
            }
        }
        return innerBytes;
    };

    const isAttachmentInfo = (value: any): value is AttachmentInfo => !!value.attachments;
    const isRecipient = (value: any): value is Recipient => !!value.Name && !!value.Address;

    let bytes = 0;
    let key: keyof typeof cachedMessage;

    for (key in cachedMessage) {
        if (Object.prototype.hasOwnProperty.call(cachedMessage, key)) {
            const value = cachedMessage[key];
            if (!value) {
                continue;
            }

            bytes += key.length * 2;

            if (typeof value === 'boolean') {
                bytes += 4;
            } else if (typeof value === 'string') {
                bytes += value.length * 2;
            } else if (typeof value === 'number') {
                bytes += 8;
            } else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const innerValue = value[i];
                    if (typeof innerValue === 'string') {
                        bytes += innerValue.length * 2;
                    } else {
                        bytes += sizeOfRecipient(innerValue);
                    }
                }
            } else if (isAttachmentInfo(value)) {
                bytes += sizeOfAttachmentInfo(value);
            } else if (isRecipient(value)) {
                bytes += sizeOfRecipient(value);
            }
        }
    }

    return bytes;
};
