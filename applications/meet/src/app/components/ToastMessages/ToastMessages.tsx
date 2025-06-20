import { c } from 'ttag';

import { Toast } from '../../atoms/Toast/Toast';
import { useMeetContext } from '../../contexts/MeetContext';
import { useToastMessages } from '../../hooks/useToastMessages';
import { MeetingSideBars, ParticipantEvent, type ParticipantEventRecord } from '../../types';

export const ToastMessages = () => {
    const { participantEventsToastMessages } = useToastMessages();

    const { roomName, sideBarState } = useMeetContext();

    if (sideBarState[MeetingSideBars.Chat]) {
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
                            <div>{message.name}</div>
                            <div>
                                {(message as ParticipantEventRecord).eventType === ParticipantEvent.Join
                                    ? c('l10n_nightly Info').t`Joined`
                                    : c('l10n_nightly Info').t`Left`}{' '}
                                <span className="ml-1" style={{ color: 'var(--interaction-norm)' }}>
                                    {roomName}
                                </span>
                            </div>
                        </div>
                    }
                </Toast>
            ))}
        </div>
    );
};
