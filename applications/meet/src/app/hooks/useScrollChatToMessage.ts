import type { MutableRefObject, RefObject } from 'react';
import { useLayoutEffect } from 'react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { clearChatFocusedMessage, selectChatFocusedMessageId } from '@proton/meet/store/slices/uiStateSlice';

interface Options {
    wasAtBottomRef?: MutableRefObject<boolean>;
    /** Re-run scroll attempts when chat list content changes. */
    contentKey?: unknown;
}

export const useScrollChatToMessage = (
    containerRef: RefObject<HTMLElement | null>,
    { wasAtBottomRef, contentKey }: Options = {}
) => {
    const dispatch = useMeetDispatch();
    const focusedMessageId = useMeetSelector(selectChatFocusedMessageId);

    useLayoutEffect(() => {
        if (!focusedMessageId) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        const row = container.querySelector<HTMLElement>(`[data-chat-message-id="${CSS.escape(focusedMessageId)}"]`);

        if (!row) {
            return;
        }

        row.scrollIntoView({ block: 'center' });
        row.focus({ preventScroll: true });

        if (wasAtBottomRef) {
            wasAtBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
        }

        dispatch(clearChatFocusedMessage());
    }, [focusedMessageId, containerRef, dispatch, wasAtBottomRef, contentKey]);
};
