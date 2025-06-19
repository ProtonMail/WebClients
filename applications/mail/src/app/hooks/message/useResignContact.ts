import { useCallback } from 'react';

import { useApi, useGetEncryptionPreferences } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { loadMessage } from '../../helpers/message/messageRead';
import { resign } from '../../store/messages/read/messagesReadActions';
import { useGetMessage } from './useMessage';

export const useResignContact = (localID: string) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessage = useGetMessage();
    const dispatch = useMailDispatch();
    const api = useApi();

    return useCallback(async () => {
        const messageFromState = getMessage(localID) as MessageState;
        const message = await loadMessage(messageFromState, api);
        const address = message.data.Sender?.Address;
        if (!address || !messageFromState.verification) {
            return;
        }
        const { isContactSignatureVerified } = await getEncryptionPreferences({ email: address });
        dispatch(resign({ ID: localID, isContactSignatureVerified }));
    }, [localID]);
};
