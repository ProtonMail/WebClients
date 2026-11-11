import { c } from 'ttag';

import { NewChatButton } from '../../components/Buttons/NewChatButton';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

/** Icon button for the All chats top bar on small screens. */
export const AllChatsHeaderNewChatButton = () => {
    return (
        <NewChatButton
            buttonProps={{
                icon: true,
                shape: 'ghost',
                size: 'medium',
                className: 'shrink-0',
                title: c('collider_2025:Action').t`New chat`,
            }}
        >
            <LumoIcon name="SquarePen" size={20} />
            <span className="sr-only">{c('collider_2025:Action').t`New chat`}</span>
        </NewChatButton>
    );
};
