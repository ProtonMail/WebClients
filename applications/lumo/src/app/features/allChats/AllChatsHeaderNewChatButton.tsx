import { c } from 'ttag';

import { NewChatButton } from '../../components/Buttons/NewChatButton';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

import './AllChatsHeaderActions.scss';

export const AllChatsHeaderNewChatButton = () => {
    return (
        <NewChatButton
            buttonProps={{
                shape: 'solid',
                size: 'medium',
                color: 'norm',
                className:
                    'all-chats-header-action-button all-chats-header-new-chat shrink-0 flex flex-row flex-nowrap items-center gap-1',
            }}
        >
            <LumoIcon name="Plus" size={14} aria-label={c('collider_2025: Link').t`New chat`} />
            <span className="all-chats-header-new-chat-text">{c('collider_2025:Button').t`New chat`}</span>
        </NewChatButton>
    );
};
