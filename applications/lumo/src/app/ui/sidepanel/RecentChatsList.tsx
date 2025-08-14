import clsx from 'clsx';
import { c } from 'ttag';

import LumoLink from '../../components/LumoLink';
import type { Conversation, ConversationId } from '../../types';
import ChatDropdownMenu from './ChatDropdownMenu';

interface ChatsListProps {
    conversations: Conversation[];
    selectedConversationId?: ConversationId;
    disabled?: boolean; //used to disabled links for guest users
    onItemClick?: () => void;
}

const RecentChatsList = ({ conversations, selectedConversationId, disabled = false, onItemClick }: ChatsListProps) => {
    return (
        <ul className="flex flex-column flex-nowrap gap-0.5 shrink-0 px-3 my-0">
            {conversations.map((conversation) => {
                const isSelected = selectedConversationId === conversation.id;
                const title = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
                return (
                    <li
                        key={conversation.id}
                        className={clsx(
                            'relative group-hover-hide-container group-hover-opacity-container flex items-center shrink-0',
                            'flex navigation-link w-full items-center flex-nowrap justify-space-between',
                            'py-2 w-full px-2',
                            isSelected && 'is-active'
                        )}
                    >
                        <LumoLink
                            to={`/c/${conversation.id}`}
                            className={clsx(
                                'flex flex-1 items-center',
                                'text-ellipsis hover:text-primary',
                                isSelected && 'text-semibold'
                            )}
                            onClick={onItemClick}
                        >
                            <span className="text-ellipsis" title={title}>
                                {title}
                            </span>
                        </LumoLink>
                        <ChatDropdownMenu conversation={conversation} />
                    </li>
                );
            })}
        </ul>
    );
};

export default RecentChatsList;
