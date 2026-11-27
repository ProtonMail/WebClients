import type { Dispatch, SetStateAction } from 'react';

import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { addParentAppToUrl, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import type { DrawerApp, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

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
    if (!iframeSrcMap[APPS.PROTONCALENDAR]) {
        const linkTo = getLinkToCalendarEvent({ calendarID, eventID, recurrenceID });
        const appHref = getAppHref(linkTo, APPS.PROTONCALENDAR, localID);

        setAppInView(APPS.PROTONCALENDAR);
        setIframeSrcMap((map) => ({
            ...map,
            [APPS.PROTONCALENDAR]: addParentAppToUrl(appHref, currentApp, false),
        }));
    } else {
        postMessageToIframe(
            {
                type: DRAWER_EVENTS.CALENDAR_OPEN_EVENT,
                payload: { calendarID, eventID, recurrenceID },
            },
            APPS.PROTONCALENDAR
        );
    }

    setAppInView(APPS.PROTONCALENDAR);
};
