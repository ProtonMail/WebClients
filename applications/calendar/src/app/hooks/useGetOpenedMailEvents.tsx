import { useCallback, useEffect, useRef } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getIsSideAppPostMessage, postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

const getIsMatch = (existingEvent: OpenedMailEvent, newEvent: OpenedMailEvent) => {
    const { messageID: existingMessageID, UID: existingUID } = existingEvent;
    const { messageID: newMessageID, UID: newUID } = newEvent;

    return newMessageID === existingMessageID && newUID === existingUID;
};

export interface OpenedMailEvent {
    messageID: string;
    UID: string;
}

export const useGetOpenedMailEvents = (sideAppView?: VIEWS): (() => OpenedMailEvent[]) => {
    const isMailView = sideAppView === VIEWS.MAIL;
    const ref = useRef<OpenedMailEvent[]>([]);

    useEffect(() => {
        if (isMailView) {
            // Ask Mail if calendar events are opened already
            postMessageFromIframe({ type: SIDE_APP_EVENTS.SIDE_APP_REQUEST_OPEN_EVENTS }, APPS.PROTONMAIL);
        }
    }, [isMailView]);

    useEffect(() => {
        const handleMessageEvents = (event: MessageEvent) => {
            if (!getIsSideAppPostMessage(event)) {
                return;
            }

            if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_SET_WIDGET_EVENT) {
                const newOpenedMailEvent = event.data.payload;
                if (!ref.current.some((event) => getIsMatch(event, newOpenedMailEvent))) {
                    ref.current.push({ ...newOpenedMailEvent });
                }
            }

            if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_UNSET_WIDGET_EVENT) {
                const newOpenedMailEvent = event.data.payload;
                const index = ref.current.findIndex((event) => getIsMatch(event, newOpenedMailEvent));
                if (index !== -1) {
                    ref.current.splice(index, 1);
                }
            }
        };

        window.addEventListener('message', handleMessageEvents);

        return () => {
            window.removeEventListener('message', handleMessageEvents);
        };
    }, []);

    return useCallback(() => {
        return ref.current;
    }, []);
};
