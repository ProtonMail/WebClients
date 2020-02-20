import { useCallback } from 'react';
import { unique } from 'proton-shared/lib/helpers/array';
import { sendMessage, updateDraft } from 'proton-shared/lib/api/messages';
import {
    useMailSettings,
    useAddresses,
    useGetPublicKeys,
    useGetAddressKeys,
    useApi,
    useEventManager
} from 'react-components';

import { MessageExtended } from '../models/message';
import { getRecipientsAddresses } from '../helpers/message/messages';

import { getSendPreferences } from '../helpers/send/sendPreferences';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { prepareExport, encryptBody } from '../helpers/message/messageExport';
import { useAttachmentCache } from '../containers/AttachmentProvider';

// Reference: Angular/src/app/composer/services/sendMessage.js

export const useSendMessage = () => {
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const cache = new Map(); // TODO
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();
    const api = useApi();
    const attachmentCache = useAttachmentCache();
    const { call } = useEventManager();

    return useCallback(
        async (inputMessage: MessageExtended) => {
            // Prepare and save draft
            const document = prepareExport(inputMessage);
            const Body = await encryptBody(
                document?.innerHTML || '',
                inputMessage.publicKeys,
                inputMessage.privateKeys
            );

            const { Message } = await api(updateDraft(inputMessage.data?.ID, { ...inputMessage.data, Body }));

            // Processed message representing what we send
            const message: MessageExtended = {
                ...inputMessage,
                document: document,
                data: Message
            };

            const emails = getRecipientsAddresses(message.data);
            // TODO: handleAttachmentSigs

            const uniqueEmails = unique(emails);
            const sendPrefs = await getSendPreferences(
                uniqueEmails,
                message.data || {},
                mailSettings,
                addresses,
                cache,
                getPublicKeys
            );
            // todo regression testing: https://github.com/ProtonMail/Angular/issues/5088

            // console.log('sendPrefs', inputMessage, message, sendPrefs);

            let packages = await generateTopPackages(message, sendPrefs, attachmentCache, api);
            packages = await attachSubPackages(packages, message, emails, sendPrefs);
            packages = await encryptPackages(message, packages, getAddressKeys);

            // console.log('packages', packages);

            // TODO: Implement retry system
            // const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
            // try {
            const { Sent } = await api(sendMessage(message.data?.ID, { Packages: packages } as any));
            await call();

            // console.log('Sent', Sent);
            return { data: Sent };
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
        [mailSettings, addresses, cache, getPublicKeys]
    );
};
