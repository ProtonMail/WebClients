import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useCalendarModelEventManager } from '@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getIsDrawerPostMessage } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import type { Address } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { EventTargetAction } from '../containers/calendar/interface';
import { useOpenCalendarEvents } from './useOpenCalendarEvents';
import { useOpenEvent } from './useOpenEvent';

interface Props {
    calendars: VisualCalendar[];
    addresses: Address[];
    onChangeDate: (newDate: Date) => void;
    tzid: string;
    setEventTargetAction: Dispatch<SetStateAction<EventTargetAction | undefined>>;
}

export const useOpenEventsFromMail = ({ calendars, addresses, onChangeDate, tzid, setEventTargetAction }: Props) => {
    const { call } = useCalendarModelEventManager();
    const { createNotification } = useNotifications();
    const openEvent = useOpenEvent();
    const { goToEvent, goToOccurrence } = useOpenCalendarEvents({
        onChangeDate,
        tzid,
        setEventTargetAction,
        preventPopover: true,
    });

    const handleLinkError = () => {
        createNotification({
            type: 'error',
            // translator: event here is for calendar event
            text: c('Error').t`Event not found`,
        });
    };

    const handleEvents = useCallback(
        (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.CALENDAR_OPEN_EVENT:
                    {
                        const { calendarID, eventID, recurrenceID } = event.data.payload;

                        void openEvent({
                            calendars,
                            addresses,
                            calendarID,
                            eventID,
                            recurrenceId: recurrenceID ? recurrenceID.toString() : null,
                            onGoToEvent: goToEvent,
                            onGoToOccurrence: goToOccurrence,
                            onEventNotFoundError: handleLinkError,
                        });
                    }
                    break;
                case DRAWER_EVENTS.CALL_CALENDAR_EVENT_MANAGER:
                    {
                        void call([event.data.payload.calendarID]);
                    }
                    break;
                case DRAWER_EVENTS.SHOW:
                    {
                        // When showing again the cached calendar app, we need to call the event manager for all calendars to get all updates
                        const allCalendarIDs = calendars.map(({ ID }) => ID);
                        void call(allCalendarIDs);
                    }
                    break;
                default:
                    break;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-F64852
        [calendars, addresses, goToEvent, goToOccurrence]
    );

    useEffect(() => {
        window.addEventListener('message', handleEvents);

        return () => {
            window.removeEventListener('message', handleEvents);
        };
    }, [handleEvents]);
};
