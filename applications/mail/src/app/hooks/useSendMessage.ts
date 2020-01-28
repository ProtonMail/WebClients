import { useCallback } from 'react';
import { unique } from 'proton-shared/lib/helpers/array';
import { sendMessage } from 'proton-shared/lib/api/messages';
import { useMailSettings, useAddresses, useGetPublicKeys, useGetAddressKeys, useApi } from 'react-components';

import { MessageExtended } from '../models/message';
import { getRecipientsAddresses } from '../helpers/message/messages';

import { getSendPreferences } from '../helpers/send/sendPreferences';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { useAttachmentsCache } from './useAttachments';

// Reference: Angular/src/app/composer/services/sendMessage.js

export const useSendMessage = () => {
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const cache = new Map(); // TODO
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();
    const api = useApi();
    const { data } = useAttachmentsCache();

    return useCallback(
        async (message: MessageExtended) => {
            // TODO: Prepare embedded
            const emails = getRecipientsAddresses(message.data);
            // TODO: handleAttachmentSigs

            const uniqueEmails = unique(emails);
            // eslint-disable-next-line
            const sendPrefs = await getSendPreferences(
                uniqueEmails,
                message.data || {},
                mailSettings,
                addresses,
                cache,
                getPublicKeys
            );
            // todo regression testing: https://github.com/ProtonMail/Angular/issues/5088

            console.log('sendPrefs', sendPrefs);

            let packages = await generateTopPackages(message, sendPrefs, data, api);
            packages = await attachSubPackages(packages, message, emails, sendPrefs);
            packages = await encryptPackages(message, packages, getAddressKeys);

            console.log('packages', packages);

            // return;

            // Old code save the draft here
            // New one should have saved it just before
            // TODO: Do I miss something?
            //
            // /*
            //  * we do not re-encrypt the draft body if the packages contain the draft body: the generatePackages call will have
            //  * generated the body correctly (otherwise it breaks deduplication)
            //  */
            // const encrypt = !packages.map(({ MIMEType }) => MIMEType).includes(message.MIMEType);
            // // save the draft with the re-encrypted body
            // await postMessage(message, { loader: false, encrypt });

            // TODO: Restore that with attachments management
            // // wait on the signature promise after the encrypt, so it can be done in parallel with the encryption
            // // which is better for performance.
            // await attachmentUpdates;
            // message.encrypting = false;
            // dispatchMessageAction(message);

            // TODO: Define if this risk exist in the new architecture
            // // Avoid to have SAVE and SEND request in the same time
            // // Make sure to keep that just before the send message API request
            // await composerRequestModel.chain(message);

            // TODO: Implement retry system
            // const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
            // try {
            const { Sent } = await api(sendMessage(message.data?.ID, { Packages: packages } as any));
            console.log('Sent', Sent);
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
