import { MutableRefObject, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { LoaderPage, useNotifications } from '@proton/components';
import { ACTION_VIEWS, VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDateOrDateTimeProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarEvent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { useOpenEvent } from '../../hooks/useOpenEvent';
import { getCalendarEventStoreRecord } from './eventStore/cache/upsertCalendarEventStoreRecord';
import { VIEW_URL_PARAMS_VIEWS_CONVERSION } from './getUrlHelper';
import { EventTargetAction } from './interface';

const { VIEW } = ACTION_VIEWS;

interface Props {
    addresses: Address[];
    calendars: VisualCalendar[];
    sideAppView?: VIEWS;
    tzid: string;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
}
const EventActionContainer = ({ tzid, sideAppView, addresses, calendars, eventTargetActionRef }: Props) => {
    const { createNotification } = useNotifications();
    const history = useHistory();
    const openEvent = useOpenEvent();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('Action');
            const possiblySideAppView = sideAppView ? `/${VIEW_URL_PARAMS_VIEWS_CONVERSION[sideAppView]}` : '';

            if (action === VIEW) {
                const handleLinkError = () => {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Invalid link to the event`,
                    });
                    history.replace(`${possiblySideAppView}/`);
                };

                const handleOtherError = () => {
                    history.replace(`${possiblySideAppView}/`);
                };

                const handleGotoRange = (date: Date) => {
                    const viewString = sideAppView ? possiblySideAppView : '/week';
                    history.replace(
                        `${viewString}/${[date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].join('/')}`
                    );
                };

                const handleGotoOccurrence = (
                    eventData: CalendarEvent,
                    eventComponent: VcalVeventComponent,
                    occurrence: { localStart: Date; occurrenceNumber: number }
                ) => {
                    const { isAllDay, isAllPartDay } = getCalendarEventStoreRecord(eventComponent, eventData);

                    const withOccurrenceDtstart = getDateOrDateTimeProperty(
                        eventComponent.dtstart,
                        occurrence.localStart
                    );
                    const utcDate = propertyToUTCDate(withOccurrenceDtstart);
                    const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));
                    eventTargetActionRef.current = {
                        id: `${eventData.ID}-${occurrence.occurrenceNumber}`,
                        isAllDay,
                        isAllPartDay,
                        startInTzid,
                        preventPopover: !!sideAppView, // If the app is a side app, we want to prevent the popover opening
                    };
                    return handleGotoRange(startInTzid);
                };

                const handleGotoEvent = (eventData: CalendarEvent, eventComponent: VcalVeventComponent) => {
                    const { isAllDay, isAllPartDay } = getCalendarEventStoreRecord(eventComponent, eventData);

                    const utcDate = propertyToUTCDate(eventComponent.dtstart);
                    const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));
                    eventTargetActionRef.current = {
                        id: eventData.ID,
                        isAllDay,
                        isAllPartDay,
                        startInTzid,
                        preventPopover: !!sideAppView, // If the app is a side app, we want to prevent the popover opening
                    };
                    return handleGotoRange(startInTzid);
                };

                const calendarID = params.get('CalendarID');
                const eventID = params.get('EventID');
                const recurrenceId = params.get('RecurrenceID');

                const openedEvent = await openEvent({
                    calendars,
                    addresses,
                    calendarID,
                    eventID,
                    recurrenceId,
                    onGoToEvent: handleGotoEvent,
                    onGoToOccurrence: handleGotoOccurrence,
                    onLinkError: handleLinkError,
                    onOtherError: handleOtherError,
                });

                return openedEvent;
            }

            history.replace('');
        };

        void run();
    }, []);

    return <LoaderPage />;
};

export default EventActionContainer;
