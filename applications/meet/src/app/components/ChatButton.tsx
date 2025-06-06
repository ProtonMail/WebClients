import { c } from 'ttag';

import { IcMeetChat } from '@proton/icons';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../contexts/MeetContext';
import { MeetingSideBars } from '../types';
import { ChatPreview } from './ChatPreview';

export const ChatButton = () => {
    const { toggleSideBarState, sideBarState, chatMessages } = useMeetContext();

    const unreadMessages = chatMessages.filter((message) => !message.seen).length;

    return (
        <div className="relative">
            <ChatPreview />
            <CircleButton
                IconComponent={IcMeetChat}
                variant={sideBarState[MeetingSideBars.Chat] ? 'active' : 'default'}
                onClick={() => {
                    toggleSideBarState(MeetingSideBars.Chat);
                }}
                indicatorContent={unreadMessages > 0 ? unreadMessages.toString() : undefined}
                indicatorStatus="success"
                ariaLabel={c('l10n_nightly Alt').t`Toggle chat`}
            />
        </div>
    );
};
