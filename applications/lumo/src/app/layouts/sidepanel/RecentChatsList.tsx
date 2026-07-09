import { memo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoLink } from '../../components/Links/LumoLink';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import type { Conversation, ConversationId } from '../../types';
import ConversationActionsDropdown from './ConversationActionsDropdown';
import { ConversationExpirationIndicator } from './ConversationExpirationIndicator';

export interface ConversationListItemProps {
    conversation: Conversation;
    isSelected: boolean;
    showDropdown: boolean;
    onItemClick?: () => void;
}

export const ConversationListItem = memo(
    ({ conversation, isSelected, showDropdown, onItemClick }: ConversationListItemProps) => {
        const [isDropdownOpen, setIsDropdownOpen] = useState(false);
        const [isActionsMounted, setIsActionsMounted] = useState(false);
        const [isActionsOpen, setIsActionsOpen] = useState(false);
        const ellipsisRef = useRef<HTMLButtonElement>(null);

        const label = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;

        return (
            <li
                className={clsx(
                    'relative group-hover-hide-container group-hover-opacity-container',
                    'flex items-center min-w-0 overflow-hidden navigation-link w-full',
                    'hover:bg-weak rounded-md transition-colors text-sm',
                    isSelected && 'is-active'
                )}
            >
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
                {showDropdown && (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                    <div
                        className={clsx(
                            'relative z-1 ml-auto pl-1 shrink-0',
                            !isDropdownOpen && 'group-hover:opacity-100 opacity-0'
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            ref={ellipsisRef}
                            icon
                            shape="ghost"
                            size="small"
                            className="rounded-sm"
                            aria-label={c('collider_2025:Action').t`More options`}
                            onMouseEnter={() => setIsActionsMounted(true)}
                            onClick={() => {
                                setIsActionsOpen(true);
                                setIsDropdownOpen(true);
                            }}
                        >
                            <LumoIcon name="Ellipsis" size={16} />
                        </Button>
                    </div>
                )}
                {isActionsMounted && (
                    <ConversationActionsDropdown
                        conversation={conversation}
                        anchorRef={ellipsisRef}
                        isOpen={isActionsOpen}
                        onClose={() => {
                            setIsActionsOpen(false);
                            setIsDropdownOpen(false);
                        }}
                    />
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
