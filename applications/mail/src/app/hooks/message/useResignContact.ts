import { useCallback } from 'react';
import { useApi, useGetEncryptionPreferences } from '@proton/components';
import { useDispatch } from 'react-redux';
import { loadMessage } from '../../helpers/message/messageRead';
import { useGetMessage } from './useMessage';
import { MessageState } from '../../logic/messages/messagesTypes';
import { resign } from '../../logic/messages/read/messagesReadActions';

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessage = useGetMessage();
    const dispatch = useDispatch();
    const api = useApi();

    return useCallback(async () => {
        const messageFromState = getMessage(localID) as MessageState;
        const message = await loadMessage(messageFromState, api);
        const address = message.data.Sender?.Address;
        if (!address || !messageFromState.verification) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences(address);
        dispatch(resign({ ID: localID, isContactSignatureVerified }));
    }, [localID]);
};
