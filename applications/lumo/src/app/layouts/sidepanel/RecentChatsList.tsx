import { memo, useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Input } from '@proton/atoms/Input/Input';

import { LumoLink } from '../../components/Links/LumoLink';
import { useConversationRename } from '../../hooks/useConversationRename';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import type { Conversation, ConversationId } from '../../types';
import { ConversationExpirationIndicator } from './ConversationExpirationIndicator';
import { ConversationSidebarActions } from './ConversationSidebarActions';

export interface ConversationListItemProps {
    conversation: Conversation;
    isSelected: boolean;
    showDropdown: boolean;
    onItemClick?: () => void;
}

export const ConversationListItem = memo(
    ({ conversation, isSelected, showDropdown, onItemClick }: ConversationListItemProps) => {
        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
        const { isSmallScreen } = useIsLumoSmallScreen();
        const isTouchDevice = useIsTouchDevice();
        const [isHovered, setIsHovered] = useState(false);
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const [hasActiveOverlay, setHasActiveOverlay] = useState(false);
        const {
            isRenaming,
            draftTitle,
            setDraftTitle,
            renameInputRef,
            startRenaming,
            commitRename,
            handleRenameKeyDown,
        } = useConversationRename(conversation);
        const alwaysShowActions = isSmallScreen || isTouchDevice;
        // Keep actions mounted while the dropdown or a follow-up modal is open so portaled
        // UI does not unmount when the cursor leaves the list item to reach it.
        const shouldMountActions =
            showDropdown && !isRenaming && (alwaysShowActions || isHovered || isDropdownOpen || hasActiveOverlay);

        useEffect(() => {
            if (!shouldMountActions) {
                setIsDropdownOpen(false);
                setHasActiveOverlay(false);
            }
        }, [shouldMountActions]);

        return (
            <li
                className={clsx(
                    'relative group-hover-hide-container group-hover-opacity-container',
                    'flex items-center min-w-0 overflow-hidden navigation-link w-full',
                    'hover:bg-weak rounded-md transition-colors text-sm',
                    isSelected && 'is-active',
                    isRenaming && 'is-renaming'
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isRenaming ? (
                    <Input
                        ref={renameInputRef}
                        className="sidebar-conversation-rename-input relative z-1"
                        value={draftTitle}
                        onValue={setDraftTitle}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={commitRename}
                        aria-label={c('collider_2025:Action').t`Rename chat`}
                    />
                ) : (
                    <LumoLink
                        to={`/c/${conversation.id}`}
                        className={clsx(
                            'absolute inset-0 flex items-center gap-1.5 min-w-0 overflow-hidden pl-1.5 hover:text-primary',
                            showDropdown ? 'pr-8' : 'pr-2'
                        )}
                        onClick={onItemClick}
                    >
                        <ConversationExpirationIndicator conversation={conversation} />
                        <span className="sidebar-nav-list--label text-ellipsis min-w-0 flex-1" title={label}>
                            {label}
                        </span>
                    </LumoLink>
                )}
                {shouldMountActions && (
                    <div className="relative z-1 ml-auto pl-1 shrink-0">
                        <ConversationSidebarActions
                            conversation={conversation}
                            onRename={startRenaming}
                            onOpenChange={setIsDropdownOpen}
                            onOverlayActiveChange={setHasActiveOverlay}
                        />
                    </div>
                )}
            </li>
        );
    }
);

ConversationListItem.displayName = 'ConversationListItem';

interface ChatsListProps {
    conversations: Conversation[];
    selectedConversationId?: ConversationId;
    disabled?: boolean;
    onItemClick?: () => void;
}

const RecentChatsList = memo(({ conversations, selectedConversationId, disabled, onItemClick }: ChatsListProps) => {
    return (
        <ul className="unstyled flex flex-column flex-nowrap gap-0.5 min-w-0 w-full my-0">
            {conversations.map((conversation) => (
                <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    showDropdown={!disabled}
                    onItemClick={onItemClick}
                />
            ))}
        </ul>
    );
});

RecentChatsList.displayName = 'RecentChatsList';

export default RecentChatsList;
