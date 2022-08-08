import { isAppFromURL } from '../helpers/url';
import { APPS } from '../constants';
import { getAppHref } from '../apps/helper';
import { postMessageToIframe } from './helpers';
import { SIDE_APP_EVENTS } from './models';
import { getLinkToCalendarEvent } from '../calendar/helper';

interface OpenCalendarEventProps {
    sideAppUrl?: string;
    setSideAppUrl?: (url: string, replacePath?: boolean) => void;
    showSideApp?: boolean;
    setShowSideApp?: (show: boolean) => void;
    localID?: number;
    calendarID: string;
    eventID: string;
    recurrenceID?: number;
}

export const openCalendarEventInSideApp = ({
    sideAppUrl,
    setSideAppUrl,
    showSideApp,
    setShowSideApp,
    localID,
    calendarID,
    eventID,
    recurrenceID,
}: OpenCalendarEventProps) => {
    const calendarApp = APPS.PROTONCALENDAR;

    if (!sideAppUrl || !isAppFromURL(sideAppUrl, calendarApp)) {
        const linkTo = getLinkToCalendarEvent({ calendarID, eventID, recurrenceID });
        const sideAppLinkTo = getAppHref(linkTo, calendarApp, localID);
        setSideAppUrl?.(sideAppLinkTo, false);
    } else {
        if (!showSideApp) {
            // If the calendar app is opened but hidden, we need to show it
            setShowSideApp?.(true);
        }
        postMessageToIframe(
            {
                type: SIDE_APP_EVENTS.SIDE_APP_CALENDAR_OPEN_EVENT,
                payload: { calendarID, eventID, recurrenceID },
            },
            calendarApp
        );
    }
};
