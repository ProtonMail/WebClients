import { useEffect, useState } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import type { ParticipantEventRecord } from '../types';

type ToastMessage = ParticipantEventRecord & { expiresAt: number; exitingStatus?: 'exiting' | 'exited' };

const PARTICIPANT_EVENT_TIMEOUT_MS = 6000;

const getEventKey = (evt: ParticipantEventRecord) => `${evt.identity}-${evt.timestamp}`;

const getExitingStatus = (item: ToastMessage, now: number) => {
    if (item.expiresAt < now && item.exitingStatus !== 'exiting') {
        return 'exiting';
    }

    if (item.expiresAt < now && item.exitingStatus === 'exiting') {
        return 'exited';
    }

    return item.exitingStatus;
};

export const useToastMessages = () => {
    const { participantEvents } = useMeetContext();

    const [participantEventsToastMessages, setParticipantEventsToastMessages] = useState<ToastMessage[]>([]);

    useEffect(() => {
        setParticipantEventsToastMessages((prev) => {
            const now = Date.now();
            const filtered = prev.filter((m) => m.expiresAt > now);

            participantEvents
                .filter((event) => event.timestamp > now - PARTICIPANT_EVENT_TIMEOUT_MS)
                .sort((a, b) => b.timestamp - a.timestamp)
                .forEach((evt) => {
                    const key = getEventKey(evt);
                    if (!filtered.find((m) => getEventKey(m) === key)) {
                        filtered.push({ ...evt, expiresAt: evt.timestamp + PARTICIPANT_EVENT_TIMEOUT_MS });
                    }
                });

            return filtered.slice(0, 6);
        });
    }, [participantEvents]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setParticipantEventsToastMessages((prev) =>
                prev
                    .map((item) => ({ ...item, exitingStatus: getExitingStatus(item, now) }))
                    .filter((m) => m.exitingStatus !== 'exited')
            );
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Return only the message/event data (not the expiresAt)
    return {
        participantEventsToastMessages: participantEventsToastMessages.map(({ expiresAt, ...rest }) => rest),
    };
};
