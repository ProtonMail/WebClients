import React, { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo } from '@proton/components';
import { IcMonitor } from '@proton/icons';

import { useConversationStar } from '../../../hooks/useConversationStar';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import { useLumoDispatch } from '../../../redux/hooks';
import { changeConversationTitle, pushConversationRequest } from '../../../redux/slices/core/conversations';
import { type Conversation, type Message } from '../../../types';
import { sendConversationEditTitleEvent } from '../../../util/telemetry';
import FavoritesUpsellPrompt from '../../components/FavoritesUpsellPrompt';
import LumoButton from '../../components/LumoButton';
import { HeaderWrapper } from '../../header/HeaderWrapper';
import { NewChatButtonHeader } from '../../sidebar/NewChatButton';

import './ConversationHeader.scss';

interface Props {
    conversation: Conversation;
    messageChain: Message[];
    onOpenFiles: (message?: Message) => void;
}

const ConversationHeaderComponent = ({ conversation, messageChain, onOpenFiles }: Props) => {
    const { id, title, spaceId } = conversation;
    const dispatch = useLumoDispatch();
    const [conversationTitle, setConversationTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    

    const { isGhostChatMode } = useGhostChat();
    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'header',
    });
    const { isSmallScreen } = useSidebar();

    // Count total files in conversation
    const totalFiles = messageChain.reduce((count, message) => {
        return count + (message.attachments?.length || 0);
    }, 0);

    // Handler for opening the full knowledge base (no filter)
    const handleOpenFilesClick = useCallback(() => {
        onOpenFiles(); // Call with no arguments to show full knowledge base
    }, [onOpenFiles]);

    useEffect(() => {
        // Only update local state if user is not currently editing
        // This prevents cursor jumping when Redux state updates during editing
        if (!isEditing) {
            setConversationTitle(title);
        }
    }, [title, isEditing]);

    const startEditing = useCallback(() => setIsEditing(true), []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            // Don't update React state during editing to prevent re-renders
            // The input value is managed by the DOM directly
        },
        []
    );

    const saveTitleChange = useCallback(() => {
        const currentValue = inputRef.current?.value || title;
        
        if (title !== currentValue) {
            dispatch(
                changeConversationTitle({
                    title: currentValue,
                    id: id,
                    persist: true,
                    spaceId,
                })
            );
            dispatch(pushConversationRequest({ id }));
        }

        setConversationTitle(currentValue);
        sendConversationEditTitleEvent('header');
        setIsEditing(false);
    }, [title, spaceId, id, dispatch]);

    const cancelTitleChange = useCallback(() => {
        setConversationTitle(title); // Reset to original title
        setIsEditing(false);
    }, [title]);

    const handleKeyEvent = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                saveTitleChange();
            } else if (e.key === 'Escape') {
                cancelTitleChange();
            }
        },
        [saveTitleChange, cancelTitleChange]
    );

    const handleFocusEvent = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            if (e.type === 'blur') {
                saveTitleChange();
            }
        },
        [saveTitleChange]
    );

    const handleStarClick = () => {
        handleStarToggle();
    };

    if (isSmallScreen) {
        return (
            <>
                <HeaderWrapper>
                    <div className="flex flex-row items-center gap-1">
                        {!isGhostChatMode && (
                            <LumoButton
                                iconSize={5}
                                iconName={isStarred ? 'star-filled' : 'star'}
                                title={
                                    isStarred
                                        ? c('collider_2025:Button').t`Unfavorite`
                                        : c('collider_2025:Button').t`Favorite`
                                }
                                alt={c('collider_2025:Button').t`Favorite`}
                                onClick={handleStarClick}
                                tooltipPlacement="top"
                                isActive={isStarred}
                                className="no-print"
                                size="medium"
                            />
                        )}

                        <div className="relative">
                            {totalFiles > 1 && (
                                <span className="absolute bg-primary text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 file-count">
                                    {totalFiles > 9 ? '9+' : totalFiles}
                                </span>
                            )}
                            <Button
                                size="medium"
                                shape="ghost"
                                icon
                                title={c('collider_2025:Button').t`Manage chat knowledge files(${totalFiles})`}
                                onClick={handleOpenFilesClick}
                                className="no-print"
                            >
                                <IcMonitor size={5} />
                            </Button>
                        </div>
                        <NewChatButtonHeader />
                    </div>
                </HeaderWrapper>
                {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
            </>
        );
    }

    const RenderTitle = ({ isEditing }: { isEditing: boolean }) => {
        if (isEditing) {
            return (
                <InputFieldTwo
                    key={`title-edit-${id}`}
                    type="text"
                    dense
                    defaultValue={conversationTitle}
                    onChange={handleTitleChange}
                    onBlur={handleFocusEvent} // Save on blur
                    onKeyDown={handleKeyEvent} // Save on Enter key, discard on Escape
                    inputClassName="py-1 border-none"
                    aria-label={c('collider_2025:Label').t`Edit conversation title`}
                    inputContainerClassName="conversation-title"
                    autoFocus
                    ref={inputRef}
                />
            );
        }
        return (
            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
            <span role="heading" aria-level={2} className="min-w-0 conversation-header-title-view">
                <span className="sr-only">{c('collider_2025:Info').t`Current chat:`}</span>
                <Button shape="ghost" onClick={startEditing} className="py-1 px-2 text-ellipsis w-full">
                    {conversationTitle}
                </Button>
            </span>
        );
    };

    return (
        <div className="conversation-header flex flex-column flex-nowrap">
            <div className="flex flex-row justify-space-between items-center pt-3 pb-2 px-3">
                <div className="inline-flex flex-row flex-nowrap items-center justify-start">
                    <RenderTitle isEditing={isEditing} />
                </div>

                <div className="flex flex-row items-center gap-1">
                    {!isGhostChatMode && (
                        <LumoButton
                            iconName={isStarred ? 'star-filled' : 'star'}
                            title={
                                isStarred
                                    ? c('collider_2025:Button').t`Unfavorite`
                                    : c('collider_2025:Button').t`Favorite`
                            }
                            alt={c('collider_2025:Button').t`Favorite`}
                            onClick={handleStarClick}
                            tooltipPlacement="top"
                            isActive={isStarred}
                            className="no-print"
                            size="medium"
                        />
                    )}

                    <div className="relative">
                        {totalFiles > 1 && (
                            <span className="absolute bg-primary text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 file-count">
                                {totalFiles > 9 ? '9+' : totalFiles}
                            </span>
                        )}
                        <Button
                            size="medium"
                            shape="ghost"
                            icon
                            title={c('collider_2025:Button').t`Manage chat knowledge files (${totalFiles})`}
                            onClick={handleOpenFilesClick}
                            className="no-print"
                        >
                            <IcMonitor size={4} />
                        </Button>
                    </div>
                </div>
            </div>
            {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
        </div>
    );
};

export const ConversationHeader = React.memo(ConversationHeaderComponent, (prevProps, nextProps) => {

    const conversationChanged = 
        prevProps.conversation.id !== nextProps.conversation.id ||
        prevProps.conversation.title !== nextProps.conversation.title ||
        prevProps.conversation.spaceId !== nextProps.conversation.spaceId ||
        prevProps.conversation.starred !== nextProps.conversation.starred;
    
    // Check if total file count has changed (this is what the component uses from messageChain)
    const prevTotalFiles = prevProps.messageChain.reduce((count, message) => {
        return count + (message.attachments?.length || 0);
    }, 0);
    const nextTotalFiles = nextProps.messageChain.reduce((count, message) => {
        return count + (message.attachments?.length || 0);
    }, 0);
    
    const totalFilesChanged = prevTotalFiles !== nextTotalFiles;
    
    // Only re-render if conversation changed, total files changed, or onOpenFiles changed
    return !conversationChanged && !totalFilesChanged && prevProps.onOpenFiles === nextProps.onOpenFiles;
});
