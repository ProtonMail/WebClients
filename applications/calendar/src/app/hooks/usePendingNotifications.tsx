import { useCallback, useEffect, useRef } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/index';
import { useNotifications } from '@proton/components/hooks';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import { eventsSelector } from '../store/events/eventsSelectors';
import type { CalendarViewEventStore } from '../store/events/eventsSlice';
import { useCalendarSelector } from '../store/hooks';

// Count the number of events sharing the same UID that are pending
const countPendingEvents = (events: CalendarViewEventStore[], UID: string, key: 'isSaving' | 'isDeleting') => {
    return events.reduce((acc, event) => {
        const eventUID = (event.data?.eventData as CalendarEvent)?.UID;

        if (UID === eventUID && event[key]) {
            return acc + 1;
        }

        return acc;
    }, 0);
};

const usePendingNotifications = () => {
    const events = useCalendarSelector(eventsSelector);
    const { createNotification, removeNotification } = useNotifications();
    const savingIds = useRef<Map<string, number>>(new Map());
    const deletingIds = useRef<Map<string, number>>(new Map());
    const hasReduxStore = useFlag('CalendarRedux');

    const handleNotification = useCallback(
        (
            UID: string,
            isPending: boolean,
            notificationIds: React.MutableRefObject<Map<string, number>>,
            key: 'isSaving' | 'isDeleting'
        ) => {
            const notificationId = notificationIds.current.get(UID);

            if (isPending && !notificationId) {
                const pendingEventsCount = countPendingEvents(events, UID, key);

                if (pendingEventsCount === 0) {
                    return;
                }

                const message =
                    key === 'isSaving'
                        ? c('Info').ngettext(msgid`Saving event...`, `Saving events...`, pendingEventsCount)
                        : c('Info').ngettext(msgid`Deleting event...`, `Deleting events...`, pendingEventsCount);
                const id = createNotification({
                    text: (
                        <>
                            {message} <CircleLoader />
                        </>
                    ),
                    type: 'info',
                    expiration: -1,
                    showCloseButton: false,
                });
                notificationIds.current.set(UID, id);
            } else if (!isPending && typeof notificationId === 'number') {
                removeNotification(notificationId);
                notificationIds.current.delete(UID);
            }
        },
        [events, createNotification, removeNotification]
    );

    useEffect(() => {
        if (!hasReduxStore) {
            return;
        }
        events.forEach((event) => {
            const UID = (event.data?.eventData as CalendarEvent)?.UID;
            handleNotification(UID, !!event.isSaving, savingIds, 'isSaving');
            handleNotification(UID, !!event.isDeleting, deletingIds, 'isDeleting');
        });
    }, [events, handleNotification, hasReduxStore]);
};

export default usePendingNotifications;
