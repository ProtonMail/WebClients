import { memo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';
import Checkbox from '@proton/components/components/input/Checkbox';

import { LumoLink } from '../../../components/Links/LumoLink';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { useConversationRename } from '../../../hooks/useConversationRename';
import { ConversationExpirationIndicator } from '../../../layouts/sidepanel/ConversationExpirationIndicator';
import { ConversationSidebarActions } from '../../../layouts/sidepanel/ConversationSidebarActions';
import type { Conversation, ConversationId } from '../../../types';
import { formatChatRelativeDate } from '../formatChatRelativeDate';
import type { AllChatsRowData } from '../selectAllChatsRowData';

/** One line on wide screens (Web/Chat list row), two on small ones (Web/Chat list row · Compact). */
export const CONVERSATION_ROW_HEIGHT = 44;
export const CONVERSATION_ROW_HEIGHT_COMPACT = 64;

interface Props {
    conversation: Conversation;
    rowData: AllChatsRowData;
    isActive: boolean;
    isBulkSelected: boolean;
    isSelectionMode: boolean;
    onToggleBulkSelect: (conversationId: ConversationId) => void;
    showProjectLink: boolean;
    allowMovingProjectChats: boolean;
    isCompact: boolean;
    /** The last row has no divider. */
    isLast: boolean;
}

interface ProjectTagProps {
    spaceId: string;
    projectName?: string;
    projectIcon?: string;
}

const ProjectTag = ({ spaceId, projectName, projectIcon }: ProjectTagProps) => {
    const label = projectName?.trim() || c('collider_2025:Label').t`Untitled project`;

    return (
        <LumoLink
            to={`/projects/${spaceId}`}
            className="all-chats-row-tag all-chats-row-interactive inline-flex flex-nowrap items-center gap-1 px-2 rounded-full bg-norm text-sm font-medium min-w-0"
            aria-label={c('collider_2025:Action').t`Go to project ${label}`}
            title={label}
            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                event.stopPropagation();
            }}
        >
            {/* LumoLink sets an inline `color: inherit`, so the colour goes on the contents. */}
            <ProjectIcon iconId={projectIcon} size={12} className="shrink-0 color-weak" />
            <span className="text-ellipsis color-weak">{label}</span>
        </LumoLink>
    );
};

export const ConversationRow = memo(
    ({
        conversation,
        rowData,
        isActive,
        isBulkSelected,
        isSelectionMode,
        onToggleBulkSelect,
        showProjectLink,
        allowMovingProjectChats,
        isCompact,
        isLast,
    }: Props) => {
        // Keeps the row lifted while its menu, or a modal opened from it, is open.
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [isOverlayActive, setIsOverlayActive] = useState(false);
        const {
            isRenaming,
            draftTitle,
            setDraftTitle,
            renameInputRef,
            startRenaming,
            commitRename,
            handleRenameKeyDown,
        } = useConversationRename(conversation);

        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
        const timestamp = formatChatRelativeDate(conversation.updatedAt);
        const { isProject, projectIcon, projectName } = rowData;
        const projectTag =
            isProject && showProjectLink ? (
                <ProjectTag spaceId={conversation.spaceId} projectName={projectName} projectIcon={projectIcon} />
            ) : null;
        const showMenu = !isSelectionMode && !isRenaming;

        return (
            <div
                className={clsx(
                    'all-chats-row group relative flex flex-nowrap items-center gap-2 px-3 rounded-lg min-w-0',
                    isCompact && 'all-chats-row--compact pr-1',
                    (isMenuOpen || isOverlayActive) && 'is-lifted',
                    isLast && 'is-last',
                    isBulkSelected && 'is-selected'
                )}
                style={{ height: `${isCompact ? CONVERSATION_ROW_HEIGHT_COMPACT : CONVERSATION_ROW_HEIGHT}px` }}
            >
                {!isRenaming && isSelectionMode ? (
                    <button
                        type="button"
                        className="all-chats-row-link absolute inset-0 rounded-lg"
                        aria-label={c('collider_2025:Action').t`Toggle selection`}
                        onClick={() => {
                            onToggleBulkSelect(conversation.id);
                        }}
                    />
                ) : null}
                {!isRenaming && !isSelectionMode ? (
                    <LumoLink
                        to={`/c/${conversation.id}`}
                        className="all-chats-row-link absolute inset-0 rounded-lg"
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={label}
                    />
                ) : null}

                {isSelectionMode ? (
                    <Checkbox
                        checked={isBulkSelected}
                        onChange={() => {
                            onToggleBulkSelect(conversation.id);
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                        className="all-chats-row-interactive shrink-0"
                        aria-label={c('collider_2025:Action').t`Select conversation`}
                    />
                ) : null}

                <div className="relative z-1 flex flex-column flex-1 gap-0.5 min-w-0 pointer-events-none">
                    {isRenaming ? (
                        <Input
                            ref={renameInputRef}
                            className="all-chats-row-interactive"
                            value={draftTitle}
                            onValue={setDraftTitle}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={commitRename}
                            aria-label={c('collider_2025:Action').t`Rename chat`}
                        />
                    ) : (
                        <div className="flex flex-nowrap items-center gap-2 min-w-0">
                            <span className="text-ellipsis color-norm" data-testid="all-chats-row-title">
                                {label}
                            </span>
                            {conversation.starred ? (
                                // Shows the chat is a favorite; favoriting is in the ⋯ menu.
                                <span className="shrink-0 flex color-weak" data-testid="all-chats-row-favorite">
                                    <LumoIcon
                                        name="Star"
                                        size={14}
                                        fill="currentColor"
                                        strokeWidth={1.4}
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">{c('collider_2025:Label').t`Favorite`}</span>
                                </span>
                            ) : null}
                            <ConversationExpirationIndicator
                                conversation={conversation}
                                className="all-chats-row-interactive shrink-0"
                            />
                        </div>
                    )}
                    {isCompact && !isRenaming ? (
                        <div className="flex flex-nowrap items-center gap-2 min-w-0 text-sm color-weak">
                            <span className="shrink-0">{timestamp}</span>
                            {projectTag}
                        </div>
                    ) : null}
                </div>

                {!isCompact && !isRenaming ? (
                    <div className="relative z-1 shrink-0 flex flex-nowrap items-center gap-2 min-w-0 pointer-events-none">
                        {projectTag}
                        {/* Hidden, not removed, on hover so the ⋯ that takes its place doesn't move anything. */}
                        <span className="all-chats-row-time text-sm color-weak whitespace-nowrap">{timestamp}</span>
                    </div>
                ) : null}

                {showMenu ? (
                    <div
                        className={clsx(
                            'all-chats-row-menu all-chats-row-interactive z-2 shrink-0 flex',
                            !isCompact && 'absolute top-0 bottom-0 right-0 items-center pr-2'
                        )}
                    >
                        <ConversationSidebarActions
                            conversation={conversation}
                            onRename={startRenaming}
                            includeMoveToProject={allowMovingProjectChats || !isProject}
                            navigateAfterDelete={false}
                            onOpenChange={setIsMenuOpen}
                            onOverlayActiveChange={setIsOverlayActive}
                            visibleOnHover
                        />
                    </div>
                ) : null}
            </div>
        );
    }
);

ConversationRow.displayName = 'ConversationRow';
