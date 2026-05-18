import { memo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LumoLink } from '../../components/Links/LumoLink';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import type { Conversation, ConversationId } from '../../types';
import ChatDropdownMenu from './ChatDropdownMenu';

interface ConversationListItemProps {
    conversation: Conversation;
    isSelected: boolean;
    showDropdown: boolean;
    isTouchDevice: boolean;
    onItemClick?: () => void;
}

const ConversationListItem = memo(
    ({ conversation, isSelected, showDropdown, isTouchDevice, onItemClick }: ConversationListItemProps) => {
        const [isHovered, setIsHovered] = useState(false);
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);

        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
        // Mount the dropdown when hovered, open, or on touch (no hover available).
        // Keeping it mounted while open prevents the portal from closing when the
        // cursor leaves the list item to reach the dropdown panel.
        const mountDropdown = showDropdown && (isTouchDevice || isHovered || isDropdownOpen);

        return (
            <li
                className={clsx(
                    'relative group-hover-hide-container group-hover-opacity-container',
                    'flex items-center shrink-0 navigation-link w-full',
                    'hover:bg-weak rounded-md transition-colors text-sm',
                    isSelected && 'is-active'
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <LumoLink
                    to={`/c/${conversation.id}`}
                    className={clsx(
                        'absolute inset-0 flex items-center gap-2 pl-2 hover:text-primary',
                        showDropdown ? 'pr-8' : 'pr-2'
                    )}
                    onClick={onItemClick}
                >
                    <span className="text-ellipsis flex-1" title={label}>
                        {label}
                    </span>
                </LumoLink>
                {mountDropdown && (
                    <div className="relative z-1 ml-auto pl-1 flex-shrink-0">
                        <ChatDropdownMenu conversation={conversation} onOpenChange={setIsDropdownOpen} />
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
    const isTouchDevice = useIsTouchDevice();

    return (
        <ul className="unstyled flex flex-column flex-nowrap gap-0.5 shrink-0 pl-1 my-0">
            {conversations.map((conversation) => (
                <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    showDropdown={!disabled}
                    isTouchDevice={isTouchDevice}
                    onItemClick={onItemClick}
                />
            ))}
        </ul>
    );
});

RecentChatsList.displayName = 'RecentChatsList';

export default RecentChatsList;
