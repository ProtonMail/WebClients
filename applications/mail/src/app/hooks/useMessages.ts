import { useCallback } from 'react';
import { useApi } from 'react-components';
import { getMessage, queryMessageMetadata } from 'proton-shared/lib/api/messages';
import { MessageExtended, Message } from '../models/message';

export const useMessages = () => {
    const api = useApi();

    const ensureBody = useCallback(
        async ({ data: message = {} }: MessageExtended) => {
            // If the Body is already there, no need to send a request
            if (!message.Body) {
                const { Message } = await api(getMessage(message.ID));
                return { data: Message };
            }
        },
        [api]
    );

    const getMessages = useCallback(
        async (LabelID: string): Promise<{ Messages: Message[] }> => {
            return api(queryMessageMetadata({ LabelID } as any));
        },
        [api]
    );

    return { ensureBody, getMessages };
};
