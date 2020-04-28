import { useEffect, useState } from 'react';

import { MessageExtended, MessageAction } from '../models/message';
import { useMessageCache } from '../containers/MessageProvider';

interface UseMessage {
    (localID: string): { message: MessageExtended; addAction: <T>(action: MessageAction<T>) => Promise<T> };
}

export const useMessage: UseMessage = (localID: string) => {
    const cache = useMessageCache();

    // Main subject of the hook
    // Will be updated based on an effect listening on the event manager
    const [message, setMessage] = useState<MessageExtended>(cache.get(localID) || { localID });

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        if (cache.has(localID)) {
            setMessage(cache.get(localID) as MessageExtended);
        } else {
            const newMessage = { localID };
            cache.set(localID, newMessage);
            setMessage(newMessage);
        }

        return cache.subscribe((changedMessageID) => {
            // Prevent updates on message deletion from the cache to prevent undefined message in state.
            if (changedMessageID === localID && cache.has(localID)) {
                setMessage(cache.get(localID) as MessageExtended);
            }
        });
    }, [localID, cache]); // The hook can be re-used for a different message

    const addAction = <T>(action: MessageAction<T>) => {
        return new Promise<T>((resolve, reject) => {
            const wrapper = async () => {
                try {
                    resolve(await action());
                } catch (error) {
                    reject(error);
                }
            };

            const messageFromCache = cache.get(localID) as MessageExtended;
            const actionQueue = [...(messageFromCache?.actionQueue || []), wrapper];
            cache.set(localID, { ...messageFromCache, actionQueue });
        });
    };

    return { message, addAction };
};
