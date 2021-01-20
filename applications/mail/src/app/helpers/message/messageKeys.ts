import { binaryStringToArray, getKeys, arrayToBinaryString } from 'pmcrypto';
import { decodeBase64 } from 'proton-shared/lib/helpers/base64';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { LARGE_KEY_SIZE } from '../../constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageKeys } from '../../models/message';
import { get } from '../attachment/attachmentLoader';

/**
 * Look through a message attachments if there are keys
 */
export const extractKeysFromAttachments = async (
    attachments: Attachment[],
    messageKeys: MessageKeys,
    attachmentsCache: AttachmentsCache,
    api: Api
) => {
    const keyAttachments =
        attachments.filter(({ Name, Size }) => splitExtension(Name)[1] === 'asc' && (Size || 0) < LARGE_KEY_SIZE) || [];

    return (
        await Promise.all(
            keyAttachments.map(async (attachment) => {
                try {
                    const { data } = await get(attachment, undefined, messageKeys, attachmentsCache, api);
                    const [key] = await getKeys(arrayToBinaryString(data));
                    return key;
                } catch (e) {
                    // Nothing
                    return null;
                }
            })
        )
    ).filter(isTruthy);
};

/**
 * Look in a message headers if there is a key in an autocrypt header
 * Autocrypt is an old norm almost deprecated
 * There is no plan to have a full support of autocrypt, just take advantage of the header opportunistically if present
 */
export const extractKeysFromAutocrypt = async (parsedHeaders: { [key: string]: string | string[] | undefined }) => {
    if (!parsedHeaders.Autocrypt) {
        return [];
    }

    const autocrypt = Array.isArray(parsedHeaders.Autocrypt) ? parsedHeaders.Autocrypt : [parsedHeaders.Autocrypt];

    return (
        await Promise.all(
            autocrypt.map(async (header) => {
                const match = header.match(
                    /^(\s*(_[^;\s]*|addr|prefer-encrypt)\s*=\s*[^;\s]*\s*;)*\s*keydata\s*=([^;]*)$/
                );
                if (!match) {
                    return null;
                }
                const preferEncryptMutual = header.match(
                    /^(\s*(_[^;\s]*|addr)\s*=\s*[^;\s]*\s*;)*\s*prefer-encrypt\s*=\s*mutual\s*;/
                );
                if (!preferEncryptMutual) {
                    return null;
                }
                const keydata = header.match(/^(?:\s*(?:[^;\s]*)\s*=\s*[^;\s]*\s*;)*\s*keydata\s*=([^;]*)$/);
                try {
                    if (keydata === null) {
                        return null;
                    }
                    const [key] = await getKeys(binaryStringToArray(decodeBase64(keydata[1])));
                    return key;
                } catch (e) {
                    // not encoded correctly
                    return null;
                }
            })
        )
    ).filter(isTruthy);
};
