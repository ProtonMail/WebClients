import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useApi, useGetEncryptionPreferences } from '@proton/components';

import { loadMessage } from '../../helpers/message/messageRead';
import { MessageState } from '../../logic/messages/messagesTypes';
import { resign } from '../../logic/messages/read/messagesReadActions';
import { useGetMessage } from './useMessage';

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
