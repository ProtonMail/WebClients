import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { useDispatch } from 'react-redux';
import { loadMessage } from '../../helpers/message/messageRead';
import { useGetMessage } from './useMessage';
import { MessageState } from '../../logic/messages/messagesTypes';
import { resign } from '../../logic/messages/messagesActions';

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    // const messageCache = useMessageCache();
    const getMessage = useGetMessage();
    const dispatch = useDispatch();
    const api = useApi();

    return useCallback(async () => {
        // const messageFromCache = messageCache.get(localID) as MessageExtended;
        const messageFromState = getMessage(localID) as MessageState;
        const message = await loadMessage(messageFromState, api);
        const address = message.data.Sender?.Address;
        if (!address || !messageFromState.verification) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences(address);
        // updateMessageCache(messageCache, localID, {
        //     verification: {
        //         ...messageFromCache.verification,
        //         senderVerified: isContactSignatureVerified,
        //     },
        // });
        dispatch(resign({ ID: localID, isContactSignatureVerified }));
    }, [localID]);
};
