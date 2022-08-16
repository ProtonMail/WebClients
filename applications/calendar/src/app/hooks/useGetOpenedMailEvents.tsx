import { useCallback, useEffect, useRef } from 'react';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

const getIsMatch = (existingEvent: OpenedMailEvent, newEvent: OpenedMailEvent) => {
    const { messageID: existingMessageID, UID: existingUID } = existingEvent;
    const { messageID: newMessageID, UID: newUID } = newEvent;

    return newMessageID === existingMessageID && newUID === existingUID;
};

export interface OpenedMailEvent {
    messageID: string;
    UID: string;
}

export const useGetOpenedMailEvents = (drawerView?: VIEWS): (() => OpenedMailEvent[]) => {
    const isMailView = drawerView === VIEWS.MAIL;
    const ref = useRef<OpenedMailEvent[]>([]);

    useEffect(() => {
        if (isMailView) {
            // Ask Mail if calendar events are opened already
            postMessageFromIframe({ type: DRAWER_EVENTS.REQUEST_OPEN_EVENTS }, APPS.PROTONMAIL);
        }
    }, [isMailView]);

    useEffect(() => {
        const handleMessageEvents = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type === DRAWER_EVENTS.SET_WIDGET_EVENT) {
                const newOpenedMailEvent = event.data.payload;
                if (!ref.current.some((event) => getIsMatch(event, newOpenedMailEvent))) {
                    ref.current.push({ ...newOpenedMailEvent });
                }
            }

            if (event.data.type === DRAWER_EVENTS.UNSET_WIDGET_EVENT) {
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
