import { AppLink, Button, FeatureCode, useAuthentication, useFeature, useSideApp } from '@proton/components';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openCalendarEventInSideApp } from '@proton/shared/lib/sideApp/calendar';

import './OpenInCalendarButton.scss';

interface Props {
    linkString: string;
    calendarID: string;
    eventID: string;
    recurrenceID?: number;
}

const OpenInCalendarButton = ({ linkString, calendarID, eventID, recurrenceID }: Props) => {
    const { feature: calendarViewInMailFeature, loading } = useFeature(FeatureCode.CalendarViewInMail);
    const { sideAppUrl, setSideAppUrl, showSideApp, setShowSideApp } = useSideApp();
    const authentication = useAuthentication();
    const localID = authentication.getLocalID();

    const linkTo = getLinkToCalendarEvent({ calendarID, eventID, recurrenceID });

    const appLink = (
        <AppLink to={linkTo} toApp={APPS.PROTONCALENDAR}>
            {linkString}
        </AppLink>
    );

    if (loading) {
        return null;
    }

    const handleSideAppOpening = () => {
        openCalendarEventInSideApp({
            sideAppUrl,
            setSideAppUrl,
            showSideApp,
            setShowSideApp,
            localID,
            calendarID,
            eventID,
            recurrenceID,
        });
    };

    if (!calendarViewInMailFeature?.Value) {
        return appLink;
    }

    return (
        // TODO: Need to have both buttons, and we display/hide them depending on the screen size in CSS
        // TODO: It will need to be done with breakpoints when $breakpoint-large will be part of it
        <>
            <span className="open-calendar--small-screens" data-testid="open-calendar-small-screens">
                {appLink}
            </span>
            <Button
                className="open-calendar--large-screens text-left"
                color="norm"
                shape="underline"
                onClick={handleSideAppOpening}
                data-testid="open-calendar-large-screens"
            >
                {linkString}
            </Button>
        </>
    );
};

export default OpenInCalendarButton;
