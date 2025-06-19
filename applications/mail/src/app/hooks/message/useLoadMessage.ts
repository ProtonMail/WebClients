import { useCallback } from 'react';

import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { load, reload } from '../../store/messages/read/messagesReadActions';
import { useInitializeMessage } from './useInitializeMessage';

export const useLoadMessage = (inputMessage: MessageWithOptionalBody) => {
    const dispatch = useMailDispatch();

    return useCallback(async () => {
        void dispatch(load({ ID: inputMessage.ID }));
    }, [inputMessage]);
};

export const useReloadMessage = (localID: string) => {
    const dispatch = useMailDispatch();
    const initializeMessage = useInitializeMessage();

    return useCallback(async () => {
        dispatch(reload({ ID: localID }));
        await initializeMessage(localID);
    }, [localID]);
};
