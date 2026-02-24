import { clsx } from 'clsx';
import { c } from 'ttag';

import { LumoLink } from '../../components/Links/LumoLink';
import type { Conversation, ConversationId } from '../../types';
import ChatDropdownMenu from './ChatDropdownMenu';

interface ChatsListProps {
    conversations: Conversation[];
    selectedConversationId?: ConversationId;
    disabled?: boolean; //used to disabled links for guest users TODO: check if this is still true
    onItemClick?: () => void;
}

const RecentChatsList = ({ conversations, selectedConversationId, onItemClick }: ChatsListProps) => {
    return (
        <ul className="flex flex-column flex-nowrap gap-0.5 shrink-0 pl-1 my-0">
            {conversations.map((conversation) => {
                const isSelected = selectedConversationId === conversation.id;
                const title = conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`;
                return (
                    <li
                        key={conversation.id}
                        className={clsx(
                            'relative group-hover-hide-container group-hover-opacity-container flex items-center shrink-0',
                            'flex navigation-link w-full items-center flex-nowrap justify-space-between',
                            'py-0 w-full pl-2 text-sm',
                            'max-w-full',
                            isSelected && 'is-active'
                        )}
                        style={{ '--w-custom': '95%' }}
                    >
                        <LumoLink
                            to={`/c/${conversation.id}`}
                            className={clsx(
                                'absolute inset-0 pl-2',
                                'flex items-center',
                                'text-ellipsis hover:text-primary',
                                isSelected && 'text-semibold'
                            )}
                            onClick={onItemClick}
                        >
                            <span className="text-ellipsis pr-8" title={title}>
                                {title}
                            </span>
                        </LumoLink>
                        <div className="relative pl-1 z-1 ml-auto">
                            <ChatDropdownMenu conversation={conversation} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default RecentChatsList;
