import type { Dispatch, SetStateAction } from 'react';

import { getAppHref } from '../apps/helper';
import { getLinkToCalendarEvent } from '../calendar/helper';
import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { addParentAppToUrl, postMessageToIframe } from './helpers';
import type { DrawerApp, IframeSrcMap } from './interfaces';
import { DRAWER_EVENTS } from './interfaces';

const { PROTONCALENDAR: calendarApp } = APPS;

interface OpenCalendarEventProps {
    currentApp: APP_NAMES;
    setAppInView: Dispatch<SetStateAction<DrawerApp | undefined>>;
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
