import { useEffect } from 'react';

import { APPS } from '@proton/shared/lib/constants';
import { CalendarEventWithMetadata } from '@proton/shared/lib/interfaces/calendar';
import { isAuthorizedSideAppUrl, postMessageToIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

interface Props {
    messageID: string;
    calendarEvent?: CalendarEventWithMetadata;
    refresh: () => void;
}
const useCalendarWidgetSideAppEvents = ({ messageID, calendarEvent, refresh }: Props) => {
    useEffect(() => {
        if (!calendarEvent) {
            return;
        }
        const { UID } = calendarEvent;

        // Tell potential calendar side app that the events in the widget are in view
        postMessageToIframe(
            {
                type: SIDE_APP_EVENTS.SIDE_APP_SET_WIDGET_EVENT,
                payload: { messageID: messageID, UID },
            },
            APPS.PROTONCALENDAR
        );

        const handleSideCalendarEvents = (event: MessageEvent<SIDE_APP_ACTION>) => {
            if (!isAuthorizedSideAppUrl(event.origin)) {
                return;
            }

            if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_REQUEST_OPEN_EVENTS) {
                // The calendar app is requesting if there are open events in the widget
                postMessageToIframe(
                    {
                        type: SIDE_APP_EVENTS.SIDE_APP_SET_WIDGET_EVENT,
                        payload: { messageID, UID },
                    },
                    APPS.PROTONCALENDAR
                );
            }

            if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_REFRESH_WIDGET) {
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
            window.addEventListener('message', handleSideCalendarEvents);

            // On unmount, tell potential calendar side app that the events in the widget are no longer in view
            postMessageToIframe(
                {
                    type: SIDE_APP_EVENTS.SIDE_APP_UNSET_WIDGET_EVENT,
                    payload: { messageID, UID },
                },
                APPS.PROTONCALENDAR
            );
        };
    }, [messageID, calendarEvent]);
};

export default useCalendarWidgetSideAppEvents;
