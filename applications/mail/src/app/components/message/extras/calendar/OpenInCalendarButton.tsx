import { Button } from '@proton/atoms';
import {
    AppLink,
    FeatureCode,
    useActiveBreakpoint,
    useAuthentication,
    useConfig,
    useDrawer,
    useFeature,
} from '@proton/components';
import { getLinkToCalendarEvent } from '@proton/shared/lib/calendar/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openCalendarEventInDrawer } from '@proton/shared/lib/drawer/calendar';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';

interface Props {
    linkString: string;
    calendarID: string;
    eventID: string;
    recurrenceID?: number;
}

const OpenInCalendarButton = ({ linkString, calendarID, eventID, recurrenceID }: Props) => {
    const { APP_NAME: currentApp } = useConfig();
    const { feature: drawerFeature, loading } = useFeature<DrawerFeatureFlag>(FeatureCode.Drawer);
    const { setAppInView, iframeSrcMap, setIframeSrcMap, showDrawerSidebar } = useDrawer();
    const { isNarrow } = useActiveBreakpoint();
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

    // We use the default link to the Calendar app when the feature flag is off OR mobile view OR the user is hiding the Drawer
    if (!drawerFeature?.Value.CalendarInMail || isNarrow || !showDrawerSidebar) {
        return appLink;
    }

    return (
        <Button className="text-left" color="norm" shape="underline" onClick={handleDrawerAppOpening}>
            {linkString}
        </Button>
    );
};

export default OpenInCalendarButton;
