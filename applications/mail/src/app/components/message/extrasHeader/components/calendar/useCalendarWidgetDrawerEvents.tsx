import { useEffect } from 'react';

import { APPS } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { getMessageEventType } from '@proton/shared/lib/helpers/messageEvent';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

interface Props {
    messageID: string;
    calendarEvent?: CalendarEvent;
    refresh: () => void;
}
const useCalendarWidgetDrawerEvents = ({ messageID, calendarEvent, refresh }: Props) => {
    useEffect(() => {
        if (!calendarEvent) {
            return;
        }
        const { UID } = calendarEvent;

        // Tell potential calendar drawer app that the events in the widget are in view
        postMessageToIframe(
            {
                type: DRAWER_EVENTS.SET_WIDGET_EVENT,
                payload: { messageID: messageID, UID },
            },
            APPS.PROTONCALENDAR
        );

        const handleSideCalendarEvents = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            // Defensive code to prevent the "Permission denied to access property 'type'" error
            const eventType = getMessageEventType(event);
            if (!eventType) {
                return;
            }

            if (event.data.type === DRAWER_EVENTS.REQUEST_OPEN_EVENTS) {
                // The calendar app is requesting if there are open events in the widget
                postMessageToIframe(
                    {
                        type: DRAWER_EVENTS.SET_WIDGET_EVENT,
                        payload: { messageID, UID },
                    },
                    APPS.PROTONCALENDAR
                );
            }

            if (event.data.type === DRAWER_EVENTS.REFRESH_WIDGET) {
                const { UID, ModifyTime } = event.data.payload;

                const hasMatchingUID = calendarEvent ? calendarEvent.UID === UID : false;
                const shouldRefresh = calendarEvent ? calendarEvent.ModifyTime < ModifyTime : false;
                if (hasMatchingUID && shouldRefresh) {
                    refresh();
                }
            }
        };

        window.addEventListener('message', handleSideCalendarEvents);

        return () => {
            window.removeEventListener('message', handleSideCalendarEvents);

            // On unmount, tell potential calendar drawer app that the events in the widget are no longer in view
            postMessageToIframe(
                {
                    type: DRAWER_EVENTS.UNSET_WIDGET_EVENT,
                    payload: { messageID, UID },
                },
                APPS.PROTONCALENDAR
            );
        };
    }, [messageID, calendarEvent]);
};

export default useCalendarWidgetDrawerEvents;
