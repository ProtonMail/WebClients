import { useCallback } from 'react';

import { MessageWithOptionalBody } from '../../logic/messages/messagesTypes';
import { load, reload } from '../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../logic/store';
import { useInitializeMessage } from './useInitializeMessage';

export const useLoadMessage = (inputMessage: MessageWithOptionalBody) => {
    const dispatch = useAppDispatch();

    return useCallback(async () => {
        dispatch(load({ ID: inputMessage.ID }));
    }, [inputMessage]);
};

export const useReloadMessage = (localID: string) => {
    const dispatch = useAppDispatch();
    const initializeMessage = useInitializeMessage();

    return useCallback(async () => {
        dispatch(reload({ ID: localID }));
        await initializeMessage(localID);
    }, [localID]);
};
