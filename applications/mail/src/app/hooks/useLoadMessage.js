import { useCallback } from 'react';
import { useApi } from 'react-components';
import { getMessage } from 'proton-shared/lib/api/messages';

export const useLoadMessage = () => {
    const api = useApi();

    return useCallback(async ({ data: message }) => {
        // If the Body is already there, no need to send a request
        if (!message.Body) {
            const { Message } = await api(getMessage(message.ID));
            return { data: Message };
        }
    });
};
