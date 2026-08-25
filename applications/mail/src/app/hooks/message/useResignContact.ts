import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import useGetEncryptionPreferences from '@proton/components/hooks/useGetEncryptionPreferences';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { loadMessage } from '../../helpers/message/messageRead';
import { useMailDispatch } from '../../store/hooks';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-079492
    }, [localID]);
};
