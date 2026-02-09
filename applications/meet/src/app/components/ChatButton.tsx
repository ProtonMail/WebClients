import { c } from 'ttag';

import { IcMeetChat } from '@proton/icons/icons/IcMeetChat';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessages } from '@proton/meet/store/slices/meetingState';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';

import { CircleButton } from '../atoms/CircleButton/CircleButton';
import { ChatPreview } from './ChatPreview';

export const ChatButton = () => {
    const dispatch = useMeetDispatch();
    const chatMessages = useMeetSelector(selectChatMessages);

    const sideBarState = useMeetSelector(selectSideBarState);

    const unreadMessages = chatMessages.filter((message) => !message.seen).length;

    return (
        <div className="relative">
            <ChatPreview />
            <CircleButton
                IconComponent={IcMeetChat}
                variant={sideBarState[MeetingSideBars.Chat] ? 'active' : 'default'}
                onClick={() => {
                    dispatch(toggleSideBarState(MeetingSideBars.Chat));
                }}
                indicatorContent={unreadMessages > 0 ? unreadMessages.toString() : undefined}
                indicatorStatus="success"
                ariaLabel={c('Alt').t`Toggle chat`}
                tooltipTitle={c('Info').t`Chat with everyone`}
            />
        </div>
    );
};
