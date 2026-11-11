import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import type { DropdownOptions } from '../../components/DropdownMenu';
import DropdownMenu from '../../components/DropdownMenu';
import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { ConversationExportModal } from '../../components/Modals/ConversationExportModal/ConversationExportModal';
import { MoveToProjectModal } from '../../features/projects/modals/MoveToProjectModal';
import { useConversationStar } from '../../hooks/useConversationStar';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import type { Conversation } from '../../types';
import { ConversationDeleteFlow } from './ConversationDeleteFlow';

import './ConversationSidebarActions.scss';

interface Props {
    conversation: Conversation;
    onRename?: () => void;
    onOpenChange?: (isOpen: boolean) => void;
    onOverlayActiveChange?: (active: boolean) => void;
    visibleOnHover?: boolean;
    includeStarOption?: boolean;
    includeMoveToProject?: boolean;
    /** Go home after deleting the open chat; off in lists that stay on screen, like All chats. */
    navigateAfterDelete?: boolean;
}

export const ConversationSidebarActions = ({
    conversation,
    onRename,
    onOpenChange,
    onOverlayActiveChange,
    visibleOnHover,
    includeStarOption = true,
    includeMoveToProject = true,
    navigateAfterDelete,
}: Props) => {
    const isGuest = useIsGuest();
    const { moveToProject } = useLumoFlags();
    const [showDeleteFlow, setShowDeleteFlow] = useState(false);
    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });
    const conversationExportModalState = useModalStateObject({
        onClose: () => onOverlayActiveChange?.(false),
    });
    const moveToProjectModalState = useModalStateObject({
        onClose: () => onOverlayActiveChange?.(false),
    });
    const canMoveToProject =
        moveToProject && includeMoveToProject && !isGuest && !conversation.ghost && !conversation.scheduleRun;

    const options: DropdownOptions[] = useMemo(
        () => [
            ...(includeStarOption
                ? [
                      {
                          label: !isStarred ? c('Option').t`Add to favorites` : c('Option').t`Remove from favorites`,

                          className: 'chat-menu-item',
                          icon: <LumoIcon name="Star" size={16} />,
                          onClick: () => {
                              if (isGuest) {
                                  onOverlayActiveChange?.(true);
                              }
                              handleStarToggle();
                          },
                      },
                  ]
                : []),
            ...(canMoveToProject
                ? [
                      {
                          label: c('Option').t`Move to project`,

                          className: 'chat-menu-item',
                          icon: <LumoIcon name="Folder" size={16} />,
                          onClick: () => {
                              onOverlayActiveChange?.(true);
                              moveToProjectModalState.openModal(true);
                          },
                      },
                  ]
                : []),
            ...(onRename
                ? [
                      {
                          label: c('Option').t`Rename`,

                          className: 'chat-menu-item',
                          icon: <LumoIcon name="Pencil" size={16} />,
                          onClick: () => {
                              onRename();
                          },
                      },
                  ]
                : []),
            {
                // translator: Label for a dropdown option that opens a modal to export a conversation.
                label: c('Option').t`Export`,

                className: 'chat-menu-item',
                icon: <LumoIcon name="SquareArrowRightExit" size={16} />,
                onClick: () => {
                    onOverlayActiveChange?.(true);
                    conversationExportModalState.openModal(true);
                },
            },
            {
                label: c('Option').t`Delete`,
                icon: <LumoIcon name="Trash" size={16} />,
                className: 'chat-menu-item chat-menu-item--danger',
                onClick: () => {
                    onOverlayActiveChange?.(true);
                    setShowDeleteFlow(true);
                },
            },
        ],
        [
            canMoveToProject,
            conversationExportModalState.openModal,
            moveToProjectModalState.openModal,
            handleStarToggle,
            includeStarOption,
            isGuest,
            isStarred,
            onOverlayActiveChange,
            onRename,
        ]
    );

    return (
        <>
            {/* Menu clicks bubble through the portal to the row behind (which opens the chat), so stop
                them here. Stopping them in each option instead would also keep the menu from closing. */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="flex shrink-0"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <DropdownMenu options={options} onToggle={onOpenChange} visibleOnHover={visibleOnHover} />
            </div>
            {showDeleteFlow && (
                <ConversationDeleteFlow
                    conversation={conversation}
                    navigateAfterDelete={navigateAfterDelete}
                    onClose={() => {
                        setShowDeleteFlow(false);
                        onOverlayActiveChange?.(false);
                    }}
                />
            )}
            {conversationExportModalState.render && (
                <ConversationExportModal {...conversationExportModalState.modalProps} conversation={conversation} />
            )}
            {moveToProjectModalState.render && (
                <MoveToProjectModal {...moveToProjectModalState.modalProps} conversation={conversation} />
            )}
            {showFavoritesUpsellModal && (
                <FavoritesUpsellPrompt
                    {...favoritesUpsellModalProps}
                    onClose={() => {
                        favoritesUpsellModalProps.onClose?.();
                        onOverlayActiveChange?.(false);
                    }}
                />
            )}
        </>
    );
};
