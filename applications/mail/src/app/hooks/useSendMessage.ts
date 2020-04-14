import { useCallback } from 'react';
import { unique } from 'proton-shared/lib/helpers/array';
import { sendMessage, updateDraft } from 'proton-shared/lib/api/messages';
import {
    useGetAddressKeys,
    useApi,
    useEventManager,
    useGetEncryptionPreferences,
    useAuthentication
} from 'react-components';
import { SendPreferences } from '../helpers/message/sendPreferences';

import { MessageExtended } from '../models/message';
import { getRecipientsAddresses, isAttachPublicKey } from '../helpers/message/messages';

import getSendPreferences from '../helpers/message/getSendPreferences';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { prepareAndEncryptBody } from '../helpers/message/messageExport';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { attachPublicKey } from '../helpers/message/messageAttachPublicKey';
import { Attachment } from '../models/attachment';

// Reference: Angular/src/app/composer/services/sendMessage.js

export const useSendMessage = () => {
    const cache = new Map(); // TODO
    const api = useApi();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getAddressKeys = useGetAddressKeys();
    const attachmentCache = useAttachmentCache();
    const { call } = useEventManager();
    const messageCache = useMessageCache();
    const auth = useAuthentication();

    return useCallback(
        async (inputMessage: MessageExtended) => {
            // Prepare and save draft
            const { document, encrypted: Body } = await prepareAndEncryptBody(inputMessage);
            const { Message } = await api(updateDraft(inputMessage.data?.ID, { ...inputMessage.data, Body }));

            const Attachments: Attachment[] = isAttachPublicKey(Message)
                ? await attachPublicKey({ ...inputMessage, data: Message }, auth.UID)
                : Message.Attachments;

            // Processed message representing what we send
            const message: MessageExtended = {
                ...inputMessage,
                document,
                data: { ...Message, Attachments }
            };

            const emails = getRecipientsAddresses(message.data);
            // TODO: handleAttachmentSigs ?

            const uniqueEmails = unique(emails);
            const mapSendPrefs: { [email: string]: SendPreferences } = {};
            for (const emailAddress of uniqueEmails) {
                const encryptionPreferences = await getEncryptionPreferences(emailAddress);
                mapSendPrefs[emailAddress] = getSendPreferences(encryptionPreferences, message.data);
            }
            // TODO
            // if (sendPreferences !== oldSendPreferences) {
            //     // check what is going on. Show modal if encryption downgrade
            // }

            let packages = await generateTopPackages(message, mapSendPrefs, attachmentCache, api);
            packages = await attachSubPackages(packages, message, emails, mapSendPrefs);
            packages = await encryptPackages(message, packages, getAddressKeys);

            // TODO: Implement retry system
            // const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
            // try {
            const { Sent } = await api(
                sendMessage(message.data?.ID, {
                    Packages: packages,
                    ExpiresIn: message.expiresIn === 0 ? undefined : message.expiresIn
                } as any)
            );
            await call();

            updateMessageCache(messageCache, inputMessage.localID, { data: Sent });

            // } catch (e) {
            //     if (retry && e.data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED) {
            //         sendPreferences.clearCache();
            //         keyCache.clearCache();
            //         // retry if we used the wrong keys
            //         return send(message, parameters, false);
            //     }
            //     throw e;
            // }
        },
        [cache]
    );
};
