import { c } from 'ttag';

import type { Conversation, ConversationId } from '../../types';
import type { SidebarNavItem } from '../sidebar/components/SidebarNavList';
import { SidebarNavList } from '../sidebar/components/SidebarNavList';
import ChatDropdownMenu from './ChatDropdownMenu';

interface ChatsListProps {
    conversations: Conversation[];
    selectedConversationId?: ConversationId;
    disabled?: boolean; // used to disabled links for guest users TODO: check if this is still true
    onItemClick?: () => void;
}

const RecentChatsList = ({ conversations, selectedConversationId, disabled, onItemClick }: ChatsListProps) => {
    const items: SidebarNavItem[] = conversations.map((conversation) => ({
        id: conversation.id,
        to: `/c/${conversation.id}`,
        label: conversation.title.trim() || c('collider_2025:Button').t`Untitled chat`,
        isSelected: selectedConversationId === conversation.id,
        trailingContent: disabled ? undefined : <ChatDropdownMenu conversation={conversation} />,
    }));

    return <SidebarNavList items={items} onItemClick={onItemClick} />;
};

export default RecentChatsList;
