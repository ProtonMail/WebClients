import AppLink from '@proton/components/components/link/AppLink';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { Button } from '@proton/atoms/Button/Button';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openCalendarEventInDrawer } from '@proton/shared/lib/drawer/calendar';

interface Props {
    linkString: string;
    calendarID: string;
    eventID: string;
    recurrenceID?: number;
}

const OpenInCalendarButton = ({ linkString, calendarID, eventID, recurrenceID }: Props) => {
    const { APP_NAME: currentApp } = useConfig();
    const { setAppInView, iframeSrcMap, setIframeSrcMap, showDrawerSidebar } = useDrawer();
    const { viewportWidth } = useActiveBreakpoint();
    const authentication = useAuthentication();
    const localID = authentication.getLocalID();

    const linkTo = getLinkToCalendarEvent({ calendarID, eventID, recurrenceID });

    const appLink = (
        <AppLink to={linkTo} toApp={APPS.PROTONCALENDAR}>
            {linkString}
        </AppLink>
    );

    const handleDrawerAppOpening = () => {
        openCalendarEventInDrawer({
            currentApp,
            setAppInView,
            iframeSrcMap,
            setIframeSrcMap,
            localID,
            calendarID,
            eventID,
            recurrenceID,
        });
    };

    // We use the default link to the Calendar app when mobile view OR the user is hiding the Drawer
    if (viewportWidth['<=small'] || !showDrawerSidebar) {
        return appLink;
    }

    return (
        <Button className="text-left" color="norm" shape="underline" onClick={handleDrawerAppOpening}>
            {linkString}
        </Button>
    );
};

export default OpenInCalendarButton;
