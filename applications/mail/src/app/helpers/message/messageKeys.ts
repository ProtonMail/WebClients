import { CryptoProxy, WorkerDecryptionResult } from '@proton/crypto';
import { arrayToBinaryString } from '@proton/crypto/lib/utils';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getParsedAutocryptHeader } from '@proton/shared/lib/mail/autocrypt';
import isTruthy from '@proton/utils/isTruthy';

import { LARGE_KEY_SIZE } from '../../constants';
import { MessageKeys } from '../../logic/messages/messagesTypes';
import { get } from '../attachment/attachmentLoader';

/**
 * Look through a message attachments if there are keys
 */
export const extractKeysFromAttachments = async (
    attachments: Attachment[] | undefined = [],
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    onUpdateAttachment: (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => void,
    api: Api
) => {
    const keyAttachments =
        attachments.filter(({ Name, Size }) => splitExtension(Name)[1] === 'asc' && (Size || 0) < LARGE_KEY_SIZE) || [];

    return (
        await Promise.all(
            keyAttachments.map(async (attachment) => {
                try {
                    const { data } = await get(
                        attachment,
                        undefined,
                        messageKeys,
                        api,
                        getAttachment,
                        onUpdateAttachment
                    );
                    const key = await CryptoProxy.importPublicKey({ armoredKey: arrayToBinaryString(data) });
                    return key;
                } catch (e: any) {
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
                    const key = await CryptoProxy.importPublicKey({ binaryKey: result.keydata });
                    return key;
                } catch (e: any) {
                    // not encoded correctly
                    return null;
                }
            })
        )
    ).filter(isTruthy);
};
