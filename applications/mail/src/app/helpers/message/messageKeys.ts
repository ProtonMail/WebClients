import { CryptoProxy, KeyCompatibilityLevel } from '@proton/crypto';
import { arrayToBinaryString } from '@proton/crypto/lib/utils';
import type { MessageKeys } from '@proton/mail/store/messages/messagesTypes';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getParsedAutocryptHeader } from '@proton/shared/lib/mail/autocrypt';
import isTruthy from '@proton/utils/isTruthy';

import { LARGE_KEY_SIZE } from '../../constants';
import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';
import { getAndVerifyAttachment } from '../attachment/attachmentLoader';

/**
 * Look through a message attachments if there are keys
 */
export const extractKeysFromAttachments = async (
    attachments: Attachment[] | undefined = [],
    messageKeys: MessageKeys,
    getAttachment: (ID: string) => DecryptedAttachment | undefined,
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void,
    api: Api,
    supportV6Keys: boolean,
    messageFlags?: number
) => {
    const keyAttachments =
        attachments.filter(({ Name, Size }) => splitExtension(Name)[1] === 'asc' && (Size || 0) < LARGE_KEY_SIZE) || [];

    return (
        await Promise.all(
            keyAttachments.map(async (attachment) => {
                try {
                    const { data } = await getAndVerifyAttachment(
                        attachment,
                        undefined,
                        messageKeys,
                        api,
                        getAttachment,
                        onUpdateAttachment,
                        messageFlags
                    );
                    const key = await CryptoProxy.importPublicKey({
                        armoredKey: arrayToBinaryString(data),
                        checkCompatibility: supportV6Keys
                            ? KeyCompatibilityLevel.V6_COMPATIBLE
                            : KeyCompatibilityLevel.BACKWARDS_COMPATIBLE,
                    });
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
    senderAddress: string,
    supportV6Keys: boolean
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
                    const key = await CryptoProxy.importPublicKey({
                        binaryKey: result.keydata,
                        checkCompatibility: supportV6Keys
                            ? KeyCompatibilityLevel.V6_COMPATIBLE
                            : KeyCompatibilityLevel.BACKWARDS_COMPATIBLE,
                    });
                    return key;
                } catch (e: any) {
                    // not encoded correctly
                    return null;
                }
            })
        )
    ).filter(isTruthy);
};
