import { getKeys, arrayToBinaryString } from 'pmcrypto';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { getParsedAutocryptHeader } from 'proton-shared/lib/mail/autocrypt';
import { LARGE_KEY_SIZE } from '../../constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageKeys } from '../../models/message';
import { get } from '../attachment/attachmentLoader';

/**
 * Look through a message attachments if there are keys
 */
export const extractKeysFromAttachments = async (
    attachments: Attachment[] | undefined = [],
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
export const extractKeysFromAutocrypt = async (
    parsedHeaders: { [key: string]: string | string[] | undefined } | undefined,
    senderAddress: string
) => {
    if (!parsedHeaders?.Autocrypt) {
        return [];
    }

    const autocrypt = Array.isArray(parsedHeaders.Autocrypt) ? parsedHeaders.Autocrypt : [parsedHeaders.Autocrypt];

    return (
        await Promise.all(
            autocrypt.map(async (header) => {
                try {
                    const result = getParsedAutocryptHeader(header, senderAddress);
                    if (!result) {
                        return;
                    }
                    const [key] = await getKeys(result.keydata);
                    return key;
                } catch (e) {
                    // not encoded correctly
                    return null;
                }
            })
        )
    ).filter(isTruthy);
};
