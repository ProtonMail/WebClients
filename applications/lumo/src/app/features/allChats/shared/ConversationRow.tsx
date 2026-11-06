import { memo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Input } from '@proton/atoms/Input/Input';
import Checkbox from '@proton/components/components/input/Checkbox';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import FavoritesUpsellPrompt from '../../../components/Guest/FavoritesUpsellPrompt';
import { LumoLink } from '../../../components/Links/LumoLink';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { ConversationExportModal } from '../../../components/Modals/ConversationExportModal/ConversationExportModal';
import { ProjectIcon } from '../../../components/ProjectIcon/ProjectIcon';
import { MoveToProjectModal } from '../../projects/modals/MoveToProjectModal';
import { useConversationRename } from '../../../hooks/useConversationRename';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useConversationStar } from '../../../hooks/useConversationStar';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { ConversationDeleteFlow } from '../../../layouts/sidepanel/ConversationDeleteFlow';
import { ConversationExpirationIndicator } from '../../../layouts/sidepanel/ConversationExpirationIndicator';
import { ConversationSidebarActions } from '../../../layouts/sidepanel/ConversationSidebarActions';
import type { ChatHistoryDateField } from '../../../redux/slices/lumoUserSettings';
import type { Conversation, ConversationId } from '../../../types';
import { formatChatRelativeDate } from '../formatChatRelativeDate';
import type { AllChatsRowData } from '../selectAllChatsRowData';

export const CONVERSATION_ROW_HEIGHT = 68;

interface ConversationRowProps {
    conversation: Conversation;
    rowData: AllChatsRowData;
    isActive: boolean;
    isBulkSelected: boolean;
    isSelectionMode: boolean;
    onToggleBulkSelect: (conversationId: ConversationId) => void;
    sortField: ChatHistoryDateField;
    showProjectLink: boolean;
    allowMovingProjectChats: boolean;
}

export const ConversationRow = memo(
    ({
        conversation,
        rowData,
        isActive,
        isBulkSelected,
        isSelectionMode,
        onToggleBulkSelect,
        sortField,
        showProjectLink,
        allowMovingProjectChats,
    }: ConversationRowProps) => {
        const [deleteRequested, setDeleteRequested] = useState(false);
        const conversationExportModal = useModalStateObject();
        const moveToProjectModal = useModalStateObject();
        const isGuest = useIsGuest();
        const { moveToProject } = useLumoFlags();
        const {
            isRenaming,
            draftTitle,
            setDraftTitle,
            renameInputRef,
            startRenaming,
            commitRename,
            handleRenameKeyDown,
        } = useConversationRename(conversation);

        const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } =
            useConversationStar({
                conversation,
                location: 'sidebar',
            });

        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
        const timestamp = formatChatRelativeDate(conversation[sortField]);
        const { isProject, projectIcon, projectName } = rowData;
        const canMoveToProject = moveToProject && !isGuest && (allowMovingProjectChats || !isProject) && !conversation.ghost && !conversation.scheduleRun;
        const projectLabel = projectName?.trim() || c('collider_2025:Label').t`Untitled project`;

        const renderProjectLink = (placementClassName: string) => {
            if (!isProject || !showProjectLink) {
                return null;
            }

            return (
                <ButtonLike
                    as={LumoLink}
                    to={`/projects/${conversation.spaceId}`}
                    shape="ghost"
                    color="weak"
                    size="small"
                    className={clsx('all-chats-row-project-link all-chats-row-interactive min-w-0', placementClassName)}
                    aria-label={c('collider_2025:Action').t`Go to project`}
                    title={projectLabel}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                        event.stopPropagation();
                    }}
                >
                    <ProjectIcon iconId={projectIcon} size={12} className="shrink-0" />
                    <span className="all-chats-row-project-link-name">{projectLabel}</span>
                </ButtonLike>
            );
        };

        return (
            <div
                className={clsx(
                    'all-chats-row group relative flex items-center gap-3 px-3 min-w-0 overflow-hidden',
                    (deleteRequested || conversationExportModal.render || moveToProjectModal.render) && 'all-chats-row-actions-pinned',
                    isBulkSelected && 'all-chats-row-bulk-selected'
                )}
                style={{ height: `${CONVERSATION_ROW_HEIGHT}px` }}
            >
                {!isRenaming && isSelectionMode ? (
                    <button
                        type="button"
                        className="all-chats-row-link absolute inset-0 button button-ghost-weak"
                        aria-label={c('collider_2025:Action').t`Toggle selection`}
                        onClick={() => {
                            onToggleBulkSelect(conversation.id);
                        }}
                    />
                ) : null}
                {!isRenaming && !isSelectionMode ? (
                    <LumoLink
                        to={`/c/${conversation.id}`}
                        className="all-chats-row-link absolute inset-0 button button-ghost-weak"
                        aria-current={isActive ? 'page' : undefined}
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
                        className="all-chats-row-select all-chats-row-interactive relative z-1 shrink-0"
                        aria-label={c('collider_2025:Action').t`Select conversation`}
                    />
                ) : null}

                <div className="all-chats-row-body relative z-1 flex-1 min-w-0 pointer-events-none">
                    {isRenaming ? (
                        <Input
                            ref={renameInputRef}
                            className="all-chats-row-rename-input all-chats-row-interactive"
                            value={draftTitle}
                            onValue={setDraftTitle}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={commitRename}
                            aria-label={c('collider_2025:Action').t`Rename chat`}
                        />
                    ) : (
                        <div className="all-chats-row-title flex items-center gap-3 min-w-0">
                            <div className="all-chats-row-title-content min-w-0">
                                <div className="all-chats-row-title-main flex flex-nowrap items-center gap-2 min-w-0">
                                    <span className="all-chats-row-title-text text-ellipsis overflow-hidden whitespace-nowrap min-w-0">
                                        {label}
                                    </span>
                                    {renderProjectLink('all-chats-row-project-link-desktop')}
                                    <ConversationExpirationIndicator
                                        conversation={conversation}
                                        className="all-chats-row-interactive shrink-0"
                                    />
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        className={clsx(
                                            'all-chats-row-star all-chats-row-interactive shrink-0',
                                            isStarred && 'is-favorited'
                                        )}
                                        aria-label={
                                            isStarred
                                                ? c('collider_2025:Action').t`Remove from favorites`
                                                : c('collider_2025:Action').t`Add to favorites`
                                        }
                                        aria-pressed={!!isStarred}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            handleStarToggle();
                                        }}
                                    >
                                        <LumoIcon
                                            name="Star"
                                            size={16}
                                            fill={isStarred ? 'currentColor' : 'none'}
                                            strokeWidth={isStarred ? 1.3 : 2}
                                        />
                                    </Button>
                                </div>
                                <div className="all-chats-row-date-mobile">
                                    <span className="all-chats-row-date-mobile-time shrink-0">{timestamp}</span>
                                    {renderProjectLink('all-chats-row-project-link-mobile')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!isRenaming && !isSelectionMode ? (
                    <div className="all-chats-row-meta relative z-2 shrink-0 flex items-center justify-end self-stretch">
                        <span className="all-chats-row-date">{timestamp}</span>
                        <div className="all-chats-row-actions">
                            <div className="all-chats-row-actions-desktop shrink-0">
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="shrink-0"
                                    aria-label={c('collider_2025:Action').t`Rename chat`}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        startRenaming();
                                    }}
                                >
                                    <LumoIcon name="Pencil" size={15} />
                                </Button>
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="shrink-0"
                                    aria-label={c('collider_2025:Action').t`Export chat`}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        conversationExportModal.openModal(true);
                                    }}
                                >
                                    <LumoIcon name="SquareArrowRightExit" size={15} />
                                </Button>
                                {canMoveToProject ? (
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        className="shrink-0"
                                        aria-label={c('collider_2025:Action').t`Move to project`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            moveToProjectModal.openModal(true);
                                        }}
                                    >
                                        <LumoIcon name="FolderInput" size={15} />
                                    </Button>
                                ) : null}
                                <Button
                                    icon
                                    className="shrink-0"
                                    shape="ghost"
                                    size="small"
                                    aria-label={c('collider_2025:Action').t`Delete chat`}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setDeleteRequested(true);
                                    }}
                                >
                                    <LumoIcon name="Trash" size={15} />
                                </Button>
                            </div>
                            <div className="all-chats-row-actions-mobile shrink-0">
                                <ConversationSidebarActions
                                    conversation={conversation}
                                    onRename={startRenaming}
                                    includeStarOption={false}
                                    includeMoveToProject={allowMovingProjectChats || !isProject}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {deleteRequested ? (
                    <ConversationDeleteFlow
                        conversation={conversation}
                        navigateAfterDelete={false}
                        onClose={() => {
                            setDeleteRequested(false);
                        }}
                    />
                ) : null}

                {conversationExportModal.render ? (
                    <ConversationExportModal {...conversationExportModal.modalProps} conversation={conversation} />
                ) : null}

                {moveToProjectModal.render ? (
                    <MoveToProjectModal {...moveToProjectModal.modalProps} conversation={conversation} />
                ) : null}

                {showFavoritesUpsellModal ? <FavoritesUpsellPrompt {...favoritesUpsellModalProps} /> : null}
            </div>
        );
    }
);

ConversationRow.displayName = 'ConversationRow';
