import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, InputFieldTwo } from '@proton/components';
import { IcMonitor } from '@proton/icons/icons/IcMonitor';

import { useConversationStar } from '../../../hooks/useConversationStar';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import { useSidebar } from '../../../providers/SidebarProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId, selectSpaceById } from '../../../redux/selectors';
import { changeConversationTitle, pushConversationRequest } from '../../../redux/slices/core/conversations';
import { type Conversation, type Message, getProjectInfo } from '../../../types';
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
    const history = useHistory();
    const [conversationTitle, setConversationTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isGhostChatMode } = useGhostChat();
    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'header',
    });
    const { isSmallScreen } = useSidebar();
    const allAttachments = useLumoSelector(selectAttachments);

    // Get space/project info if this conversation is part of a project
    const space = useLumoSelector(selectSpaceById(spaceId));
    const { project } = getProjectInfo(space);
    const isProjectConversation = project !== undefined;
    const projectName = project?.projectName;

    // Count total files in conversation: message attachments + space-level files (deduplicated)
    // Get space-level assets (persistent project files) and attachments
    const spaceAssets = useLumoSelector(selectAttachmentsBySpaceId(spaceId));
    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));

    // Exclude auto-retrieved files as they're from Drive indexing, not user uploads
    const validSpaceAssets = Object.values(spaceAssets).filter(
        (asset) => !asset.error && !asset.processing && !asset.autoRetrieved
    );
    // Exclude auto-retrieved attachments as they're conversation-specific, not space-level
    const validSpaceAttachments = Object.values(spaceAttachments).filter((att) => !att.error && !att.autoRetrieved);

    // Count unique files by FILENAME (not ID) since the same file can exist as:
    // - space asset, space attachment, or message attachment with different IDs
    const uniqueFilenames = new Set<string>();

    // Add space assets
    validSpaceAssets.forEach((asset) => {
        if (asset.filename) uniqueFilenames.add(asset.filename);
    });

    // Add space attachments
    validSpaceAttachments.forEach((att) => {
        if (att.filename) uniqueFilenames.add(att.filename);
    });

    // Add message attachments (excluding auto-retrieved)
    messageChain.forEach((message) => {
        (message.attachments || []).forEach((att) => {
            const fullAtt = allAttachments[att.id];
            // Skip auto-retrieved files - they're shown in Linked Drive Folder section
            // Skip assistant-generated attachments (e.g., images)
            if (fullAtt && fullAtt.filename && fullAtt.role !== 'assistant') {
                uniqueFilenames.add(fullAtt.filename);
            }
        });
    });

    // Total = unique filenames across all sources
    const totalFiles = uniqueFilenames.size;

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

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Don't update React state during editing to prevent re-renders
        // The input value is managed by the DOM directly
    }, []);

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

    const handleNavigateToProject = useCallback(() => {
        if (spaceId) {
            history.push(`/projects/${spaceId}`);
        }
    }, [spaceId, history]);

    if (isSmallScreen) {
        return (
            <>
                <HeaderWrapper>
                    <div className="flex flex-row items-center gap-1">
                        {!isGhostChatMode && (
                            <div className="relative">
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
                            </div>
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
                {isProjectConversation && projectName && (
                    <div className="conversation-breadcrumb-mobile flex items-center gap-2 px-4 py-2 border-b">
                        <Button
                            icon
                            shape="ghost"
                            onClick={handleNavigateToProject}
                            className="flex text-md color-weak"
                            title={c('collider_2025:Action').t`Back to project`}
                        >
                            <Icon name="folder" className="mr-1" />
                            <span className="text-md color-weak">{projectName}</span>
                        </Button>
                    </div>
                )}
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
            <div className="flex flex-row items-center gap-1 min-w-0 conversation-header-title-view">
                {isProjectConversation && projectName && (
                    <>
                        <Button
                            shape="ghost"
                            onClick={handleNavigateToProject}
                            className="py-1 px-2 flex flex-row items-center gap-1 shrink-0 project-breadcrumb"
                            title={c('collider_2025:Action').t`Go to project`}
                        >
                            <Icon name="folder" size={4} />
                            <span className="text-sm color-weak">{projectName}</span>
                        </Button>
                        <Icon name="chevron-right" size={3} className="color-weak shrink-0 hide-on-small-screens" />
                    </>
                )}
                {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                <span role="heading" aria-level={2} className="min-w-0 flex-1">
                    <span className="sr-only">{c('collider_2025:Info').t`Current chat:`}</span>
                    <Button
                        shape="ghost"
                        onClick={startEditing}
                        className="py-1 px-2 text-ellipsis w-full hide-on-small-screens"
                    >
                        {conversationTitle}
                    </Button>
                </span>
            </div>
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
                        <div className="relative">
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
                        </div>
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

    // Check if attachment references have changed (we can't filter by role here without Redux access)
    // So we compare the full attachment arrays and let the component re-render to recalculate
    const prevAttachmentIds = prevProps.messageChain.flatMap((m) => m.attachments?.map((a) => a.id) || []).join(',');
    const nextAttachmentIds = nextProps.messageChain.flatMap((m) => m.attachments?.map((a) => a.id) || []).join(',');

    const attachmentsChanged = prevAttachmentIds !== nextAttachmentIds;
    return !conversationChanged && !attachmentsChanged && prevProps.onOpenFiles === nextProps.onOpenFiles;
});
