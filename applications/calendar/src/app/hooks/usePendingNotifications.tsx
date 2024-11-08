import { useCallback, useEffect, useRef } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/index';
import { useNotifications } from '@proton/components';
import { TMP_UID } from '@proton/shared/lib/calendar/constants';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import { eventsSelector, isTmpEventSavingSelector } from '../store/events/eventsSelectors';
import type { CalendarViewEventStore } from '../store/events/eventsSlice';
import { useCalendarSelector } from '../store/hooks';

const usePendingNotifications = () => {
    const events = useCalendarSelector(eventsSelector);
    const isTmpEventSaving = useCalendarSelector(isTmpEventSavingSelector);
    const { createNotification, removeNotification } = useNotifications();
    const savingIds = useRef(new Map());
    const deletingIds = useRef(new Map());
    const hasReduxStore = useFlag('CalendarRedux');

    const updateTmpEventSavingNotification = useCallback(
        (tmpEventSaving: boolean, savingIds: React.MutableRefObject<Map<string, number>>) => {
            if (tmpEventSaving) {
                const id = createNotification({
                    text: (
                        <>
                            {c('Info').t`Saving event...`} <CircleLoader />
                        </>
                    ),
                    type: 'info',
                    expiration: -1, // Keeps the notification visible until manually removed
                    showCloseButton: false,
                });
                savingIds.current.set(TMP_UID, id);
            } else {
                const id = savingIds.current.get(TMP_UID);
                if (id) {
                    removeNotification(id);
                    savingIds.current.delete(TMP_UID);
                }
            }
        },
        [createNotification, removeNotification]
    );

    /**
     * Updates the notifications for saving or deleting events based on the current counts of pending events.
     * @param events - List of calendar events from the Redux store.
     * @param key - The key to track, either 'isSaving' or 'isDeleting'.
     * @param notificationIds - Ref to the Map holding notification IDs by UID.
     */
    const updateNotifications = useCallback(
        (
            events: CalendarViewEventStore[],
            key: 'isSaving' | 'isDeleting',
            notificationIds: React.MutableRefObject<Map<string, number>>
        ) => {
            const map = new Map<string, number>();

            // Count the events for each UID that are in the specified key state (saving or deleting).
            events.forEach(({ data, isSaving, isDeleting }) => {
                const UID = (data?.eventData as CalendarEvent)?.UID;

                if (!UID) {
                    return; // Skip if UID is missing or invalid
                }

                const shouldIncrement = (key === 'isSaving' && isSaving) || (key === 'isDeleting' && isDeleting);

                if (shouldIncrement) {
                    // Increment count for events with matching UID
                    map.set(UID, (map.get(UID) || 0) + 1);
                } else if (!map.has(UID)) {
                    // Set default count to 0 to remove the notification if it exists
                    map.set(UID, 0);
                }
            });

            // Manage notifications based on the count for each UID
            map.forEach((count, UID) => {
                const notificationId = notificationIds.current.get(UID);

                if (count && !notificationId) {
                    // Create a new notification if the count is positive and there's no active notification for this UID
                    const message =
                        key === 'isSaving'
                            ? c('Info').ngettext(msgid`Saving event...`, `Saving events...`, count)
                            : c('Info').ngettext(msgid`Deleting event...`, `Deleting events...`, count);
                    const id = createNotification({
                        text: (
                            <>
                                {message} <CircleLoader />
                            </>
                        ),
                        type: 'info',
                        expiration: -1, // Keeps the notification visible until manually removed
                        showCloseButton: false,
                    });
                    notificationIds.current.set(UID, id);
                } else if (!count && notificationId) {
                    // Remove the notification if there are no more pending events for this UID
                    removeNotification(notificationId);
                    notificationIds.current.delete(UID);
                }
            });
        },
        [createNotification, removeNotification]
    );

    // Remove notifications from events that are no longer part of redux state
    const handleClearNotifications = (
        events: CalendarViewEventStore[],
        notificationIds: React.MutableRefObject<Map<string, number>>
    ) => {
        notificationIds.current.forEach((notificationId, eventUID) => {
            if (eventUID === TMP_UID) {
                return;
            }

            const eventExists = events.some((event) => {
                const UID = (event.data?.eventData as CalendarEvent)?.UID;
                return eventUID === UID;
            });

            if (!eventExists) {
                removeNotification(notificationId);
            }
        });
    };

    useEffect(() => {
        if (!hasReduxStore) {
            return; // Exit if Redux store is not enabled
        }

        // Update notifications for events being saved or deleted
        updateTmpEventSavingNotification(isTmpEventSaving, savingIds);
        updateNotifications(events, 'isSaving', savingIds);
        updateNotifications(events, 'isDeleting', deletingIds);

        // Removes notifications from events that are no longer in state
        // E.g. when the user is switching page
        handleClearNotifications(events, savingIds);
        handleClearNotifications(events, deletingIds);
    }, [events, updateNotifications, hasReduxStore, isTmpEventSaving]);
};

export default usePendingNotifications;
