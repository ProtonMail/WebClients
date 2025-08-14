import { useCallback, useState } from 'react';

import type { MessageMap } from '../redux/slices/core/messages';
import type { Message, MessageId } from '../types';
import { sortByDate } from '../util/date';

export type SiblingInfo = {
    idx: number;
    count: number;
    onPrev: () => void;
    onNext: () => void;
};

const usePreferredSiblings = (messageMap: MessageMap) => {
    const [preferredSiblings, setPreferredSiblings] = useState<MessageId[]>([]);

    const preferSibling = useCallback(
        (message: Message | undefined) => {
            if (message === undefined) {
                return;
            }
            setPreferredSiblings((prefs) => {
                // Remove the siblings of `message` from the preference list
                const filtered = prefs.filter((prefId) => {
                    const m = messageMap[prefId];
                    return m !== undefined && m.parentId !== message.parentId;
                });
                console.assert(!filtered.includes(message.id));
                // Add message itself at the front of the preference list
                return [message.id, ...filtered];
            });
        },
        [messageMap, setPreferredSiblings]
    );

    const getSiblingInfo = useCallback(
        (message: Message): SiblingInfo => {
            const siblings = Object.values(messageMap)
                .filter((m) => m.parentId === message.parentId)
                .sort(sortByDate('asc'));
            const count = siblings.length;
            const idx = siblings.findIndex((s) => s.id === message.id);
            console.assert(idx >= 0);

            const onPrev = () => {
                const prevMessage = siblings[idx - 1];
                preferSibling(prevMessage);
            };
            const onNext = () => {
                const nextMessage = siblings[idx + 1];
                preferSibling(nextMessage);
            };
            return {
                idx,
                count,
                onPrev,
                onNext,
            };
        },
        [messageMap, preferSibling]
    );

    return { preferredSiblings, preferSibling, getSiblingInfo };
};

export default usePreferredSiblings;
