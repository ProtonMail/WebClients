import { useCallback, useEffect, useState } from 'react';

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

export const ConversationHeader = ({ conversation, messageChain, onOpenFiles }: Props) => {
    const { id, title, spaceId } = conversation;
    const dispatch = useLumoDispatch();
    const [conversationTitle, setConversationTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false); // const isGenerating = status === ConversationStatus.GENERATING;
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
        setConversationTitle(title);
    }, [title]);

    const startEditing = useCallback(() => setIsEditing(true), []);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setConversationTitle(e.target.value),
        []
    );

    const saveTitleChange = useCallback(() => {
        if (title !== conversationTitle) {
            dispatch(
                changeConversationTitle({
                    title: conversationTitle,
                    id: id,
                    persist: true,
                    spaceId,
                })
            );
            dispatch(pushConversationRequest({ id }));
        }

        sendConversationEditTitleEvent('header');
        setIsEditing(false);
    }, [title, conversationTitle, spaceId]);

    const cancelTitleChange = useCallback(() => {
        setIsEditing(false);
    }, [title, conversationTitle]);

    const handleKeyEvent = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                saveTitleChange();
            } else if (e.key === 'Escape') {
                cancelTitleChange();
            }
        },
        [conversationTitle, title]
    );

    const handleFocusEvent = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            if (e.type === 'blur') {
                saveTitleChange();
            }
        },
        [conversationTitle, title]
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
                    type="text"
                    dense
                    value={conversationTitle}
                    onChange={handleTitleChange}
                    onBlur={handleFocusEvent} // Save on blur
                    onKeyDown={handleKeyEvent} // Save on Enter key, discard on Escape
                    inputClassName="py-1 border-none"
                    aria-label={c('collider_2025:Label').t`Edit conversation title`}
                    inputContainerClassName="conversation-title"
                    autoFocus
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
