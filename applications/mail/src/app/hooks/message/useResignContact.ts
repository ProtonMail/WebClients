import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { loadMessage } from '../../helpers/message/messageRead';

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    // const messageCache = useMessageCache();
    const api = useApi();

    return useCallback(async () => {
        // TODO
        // const messageFromCache = messageCache.get(localID) as MessageExtended;
        const message = await loadMessage(messageFromCache, api);
        const address = message.data.Sender?.Address;
        if (!address || !messageFromCache.verification) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences(address);
        // updateMessageCache(messageCache, localID, {
        //     verification: {
        //         ...messageFromCache.verification,
        //         senderVerified: isContactSignatureVerified,
        //     },
        // });
    }, [localID]);
};
