import { Dispatch, SetStateAction } from 'react';

import { getAppHref } from '../apps/helper';
import { getLinkToCalendarEvent } from '../calendar/helper';
import { APPS, APP_NAMES } from '../constants';
import { addParentAppToUrl, postMessageToIframe } from './helpers';
import { DRAWER_APPS, DRAWER_EVENTS, IframeSrcMap } from './interfaces';

const { PROTONCALENDAR: calendarApp } = APPS;

interface OpenCalendarEventProps {
    currentApp: APP_NAMES;
    setAppInView: Dispatch<SetStateAction<DRAWER_APPS | undefined>>;
    iframeSrcMap: IframeSrcMap;
    setIframeSrcMap: Dispatch<SetStateAction<IframeSrcMap>>;
    localID?: number;
    calendarID: string;
    eventID: string;
    recurrenceID?: number;
}

export const openCalendarEventInDrawer = ({
    currentApp,
    setAppInView,
    iframeSrcMap,
    setIframeSrcMap,
    localID,
    calendarID,
    eventID,
    recurrenceID,
}: OpenCalendarEventProps) => {
    if (!iframeSrcMap[calendarApp]) {
        const linkTo = getLinkToCalendarEvent({ calendarID, eventID, recurrenceID });
        const appHref = getAppHref(linkTo, calendarApp, localID);

        setAppInView(calendarApp);
        setIframeSrcMap((map) => ({
            ...map,
            [calendarApp]: addParentAppToUrl(appHref, currentApp, false),
        }));
    } else {
        postMessageToIframe(
            {
                type: DRAWER_EVENTS.CALENDAR_OPEN_EVENT,
                payload: { calendarID, eventID, recurrenceID },
            },
            calendarApp
        );
    }

    setAppInView(calendarApp);
};
