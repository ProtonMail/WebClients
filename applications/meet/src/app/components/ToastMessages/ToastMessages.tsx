import { useParticipants } from '@livekit/components-react';
import { c } from 'ttag';

import { Toast } from '../../atoms/Toast/Toast';
import { NOTIFICATION_PARTICIPANT_LIMIT } from '../../constants';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useToastMessages } from '../../hooks/useToastMessages';
import type { ParticipantEventRecord } from '../../types';
import { MeetingSideBars, ParticipantEvent } from '../../types';

export const ToastMessages = () => {
    const { participantEventsToastMessages } = useToastMessages();

    const { roomName } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const participants = useParticipants();

    const isLargerThanMd = useIsLargerThanMd();

    if (!isLargerThanMd) {
        return null;
    }

    if (sideBarState[MeetingSideBars.Chat] || participants.length > NOTIFICATION_PARTICIPANT_LIMIT) {
        return null;
    }

    return (
        <div
            className="absolute bottom-custom right-custom flex flex-column gap-2 h-max-custom z-up"
            style={{ '--bottom-custom': '4rem', '--right-custom': '2rem', '--h-max-custom': '45%' }}
        >
            {participantEventsToastMessages.map((message) => (
                <Toast key={`${message.identity}-${message.timestamp}`} fadeOut={message.exitingStatus === 'exiting'}>
                    {
                        <div className="flex flex-column gap-2">
                            <div
                                className="text-ellipsis max-w-custom"
                                style={{ '--max-w-custom': '15rem' }}
                                title={message.name}
                            >
                                {message.name}
                            </div>
                            <div>
                                {(message as ParticipantEventRecord).eventType === ParticipantEvent.Join
                                    ? c('meet_2025 Info').t`Joined`
                                    : c('meet_2025 Info').t`Left`}{' '}
                                <span className="ml-1" style={{ color: 'var(--interaction-norm)' }}>
                                    {roomName || c('meet_2025 Placeholder').t`the room`}
                                </span>
                            </div>
                        </div>
                    }
                </Toast>
            ))}
        </div>
    );
};
