import { startOfDay } from '@proton/shared/lib/date-fns-utc';
import { Dispatch, RefObject, SetStateAction, useCallback, useEffect } from 'react';
import { useCalendarModelEventManager, useNotifications } from '@proton/components';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';
import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';
import { CalendarEventWithMetadata, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { getDateOrDateTimeProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { Address } from '@proton/shared/lib/interfaces';
import { isAuthorizedSideAppUrl } from '@proton/shared/lib/sideApp/helpers';
import { c } from 'ttag';

import { useOpenEvent } from './useOpenEvent';
import { InteractiveState, TimeGridRef } from '../containers/calendar/interface';
import { TYPE } from '../components/calendar/interactions/constants';

interface Props {
    calendars: VisualCalendar[];
    addresses: Address[];
    onChangeDate: (newDate: Date) => void;
    tzid: string;
    timeGridViewRef: RefObject<TimeGridRef>;
    interactiveData?: InteractiveState;
    setInteractiveData: Dispatch<SetStateAction<InteractiveState | undefined>>;
}

export const useOpenEventsFromMail = ({
    calendars,
    addresses,
    onChangeDate,
    tzid,
    timeGridViewRef,
    interactiveData,
    setInteractiveData,
}: Props) => {
    const { call } = useCalendarModelEventManager();
    const { createNotification } = useNotifications();
    const openEvent = useOpenEvent();

    const handleLinkError = () => {
        createNotification({
            type: 'error',
            text: c('Error').t`Invalid link to the event`,
        });
    };

    const goToEvent = useCallback(
        (utcDate: Date, isAllDay: boolean) => {
            const fakeUTCDate = fromUTCDateToLocalFakeUTCDate(utcDate, isAllDay, tzid);

            onChangeDate(startOfDay(fakeUTCDate));
            timeGridViewRef.current?.scrollToTime(fakeUTCDate);
        },
        [tzid]
    );

    const handleGotoOccurrence = useCallback(
        (
            eventData: CalendarEventWithMetadata,
            eventComponent: VcalVeventComponent,
            occurrence: { localStart: Date; occurrenceNumber: number }
        ) => {
            const withOccurrenceDtstart = getDateOrDateTimeProperty(eventComponent.dtstart, occurrence.localStart);

            const utcDate = propertyToUTCDate(withOccurrenceDtstart);

            setInteractiveData((interactiveData) => ({
                ...interactiveData,
                targetEventData: {
                    id: `${eventData.ID}-${occurrence.occurrenceNumber}`,
                    type: TYPE.TIMEGRID,
                    preventPopover: true,
                },
            }));

            goToEvent(utcDate, !!eventData.FullDay);
        },
        [timeGridViewRef, onChangeDate]
    );

    const handleGoToEvent = useCallback(
        (eventData: CalendarEventWithMetadata, eventComponent: VcalVeventComponent) => {
            const utcDate = propertyToUTCDate(eventComponent.dtstart);

            setInteractiveData({
                ...interactiveData,
                targetEventData: {
                    id: eventData.ID,
                    type: TYPE.TIMEGRID,
                    preventPopover: true,
                },
            });

            goToEvent(utcDate, !!eventData.FullDay);
        },
        [timeGridViewRef, onChangeDate]
    );

    const handleEvents = useCallback(
        (event: MessageEvent<SIDE_APP_ACTION>) => {
            const origin = event.origin;

            if (!isAuthorizedSideAppUrl(origin)) {
                return;
            }

            switch (event.data.type) {
                case SIDE_APP_EVENTS.SIDE_APP_CALENDAR_OPEN_EVENT:
                    {
                        const { calendarID, eventID, recurrenceID } = event.data.payload;

                        void openEvent({
                            calendars,
                            addresses,
                            calendarID,
                            eventID,
                            recurrenceId: recurrenceID ? recurrenceID.toString() : null,
                            onGoToEvent: handleGoToEvent,
                            onGoToOccurrence: handleGotoOccurrence,
                            onLinkError: handleLinkError,
                        });
                    }
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_CALL_CALENDAR_EVENT_MANAGER:
                    {
                        void call([event.data.payload.calendarID]);
                    }
                    break;
                default:
                    break;
            }
        },
        [calendars, addresses, handleGoToEvent, handleGotoOccurrence]
    );

    useEffect(() => {
        window.addEventListener('message', handleEvents);

        return () => {
            window.removeEventListener('message', handleEvents);
        };
    }, [handleEvents]);
};
