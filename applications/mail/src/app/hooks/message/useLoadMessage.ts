import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useApi } from '@proton/components';
import { useInitializeMessage } from './useInitializeMessage';
import { initialize, load } from '../../logic/messages/read/messagesReadActions';

export const useLoadMessage = (inputMessage: Message) => {
    const dispatch = useDispatch();
    const api = useApi();

    return useCallback(async () => {
        dispatch(load({ ID: inputMessage.ID, api }));
    }, [inputMessage]);
};

export const useReloadMessage = (localID: string) => {
    const dispatch = useDispatch();
    const initializeMessage = useInitializeMessage(localID);

    return useCallback(async () => {
        dispatch(initialize({ localID }));
        await initializeMessage();
    }, [localID]);
};
