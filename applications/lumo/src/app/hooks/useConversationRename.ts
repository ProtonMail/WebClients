import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { useLumoDispatch } from '../redux/hooks';
import { changeConversationTitle, pushConversationRequest } from '../redux/slices/core/conversations';
import type { Conversation } from '../types';
import { sendConversationEditTitleEvent } from '../util/telemetry';

export const useConversationRename = (conversation: Conversation) => {
    const dispatch = useLumoDispatch();
    const [isRenaming, setIsRenaming] = useState(false);
    const [draftTitle, setDraftTitle] = useState(conversation.title);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const startRenaming = useCallback(() => {
        setDraftTitle(conversation.title);
        setIsRenaming(true);
        requestAnimationFrame(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        });
    }, [conversation.title]);

    const cancelRenaming = useCallback(() => {
        setDraftTitle(conversation.title);
        setIsRenaming(false);
    }, [conversation.title]);

    const commitRename = useCallback(() => {
        const nextTitle = draftTitle.trim() || c('collider_2025:Button').t`Untitled chat`;

        if (nextTitle !== conversation.title) {
            dispatch(
                changeConversationTitle({
                    id: conversation.id,
                    title: nextTitle,
                    spaceId: conversation.spaceId,
                    persist: true,
                })
            );
            dispatch(pushConversationRequest({ id: conversation.id }));
            sendConversationEditTitleEvent('sidebar');
        }

        setDraftTitle(nextTitle);
        setIsRenaming(false);
    }, [conversation.id, conversation.spaceId, conversation.title, dispatch, draftTitle]);

    const handleRenameKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                commitRename();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                cancelRenaming();
            }
        },
        [cancelRenaming, commitRename]
    );

    return {
        isRenaming,
        draftTitle,
        setDraftTitle,
        renameInputRef,
        startRenaming,
        cancelRenaming,
        commitRename,
        handleRenameKeyDown,
    };
};
