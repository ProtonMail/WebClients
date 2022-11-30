import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
    ErrorBoundary,
    FeatureCode,
    StandardErrorPage,
    useAddresses,
    useCalendars,
    useFeatures,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import useTelemetryScreenSize from '@proton/components/hooks/useTelemetryScreenSize';
import { useInstance } from '@proton/hooks/index';
import { getOwnedPersonalCalendars, getVisualCalendars, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';

import Favicon from '../../components/Favicon';
import { getIsCalendarAppInDrawer } from '../../helpers/views';
import CalendarOnboardingContainer from '../setup/CalendarOnboardingContainer';
import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import ResetContainer from '../setup/ResetContainer';
import MainContainerSetup from './MainContainerSetup';
import { fromUrlParams } from './getUrlHelper';

const MainContainer = () => {
    useTelemetryScreenSize();

    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();
    const { pathname } = useLocation();

    const drawerView = useInstance(() => {
        const { view } = fromUrlParams(pathname);
        if (!getIsCalendarAppInDrawer(view)) {
            return;
        }
        document.body.classList.add('is-drawer-app');

        return view;
    });

    useFeatures([
        FeatureCode.SpotlightSubscribedCalendars,
        FeatureCode.SubscribedCalendarReminder,
        FeatureCode.CalendarSharingEnabled,
    ]);

    const memoedCalendars = useMemo(() => sortCalendars(getVisualCalendars(calendars || [])), [calendars]);
    const ownedPersonalCalendars = useMemo(() => getOwnedPersonalCalendars(memoedCalendars), [memoedCalendars]);
    const memoedAddresses = useMemo(() => addresses || [], [addresses]);

    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();

    const [hasCalendarToGenerate, setHasCalendarToGenerate] = useState(() => {
        return ownedPersonalCalendars.length === 0;
    });

    const [calendarsToReset, setCalendarsToReset] = useState(() => {
        return memoedCalendars.filter(({ Flags }) => {
            return (Flags & (CALENDAR_FLAGS.RESET_NEEDED | CALENDAR_FLAGS.UPDATE_PASSPHRASE)) > 0;
        });
    });

    const [calendarsToSetup, setCalendarsToSetup] = useState(() => {
        return memoedCalendars.filter(({ Flags }) => {
            return (Flags & CALENDAR_FLAGS.INCOMPLETE_SETUP) > 0;
        });
    });

    if (hasCalendarToGenerate) {
        return <CalendarSetupContainer onDone={() => setHasCalendarToGenerate(false)} />;
    }

    if (calendarsToSetup.length) {
        return <CalendarSetupContainer calendars={calendarsToSetup} onDone={() => setCalendarsToSetup([])} />;
    }

    if (!welcomeFlags.isDone) {
        return <CalendarOnboardingContainer onDone={() => setWelcomeFlagsDone()} />;
    }

    if (calendarsToReset.length) {
        return <ResetContainer calendars={calendarsToReset} onDone={() => setCalendarsToReset([])} />;
    }

    return (
        <MainContainerSetup
            user={user}
            addresses={memoedAddresses}
            calendars={memoedCalendars}
            drawerView={drawerView}
        />
    );
};

const WrappedMainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage />}>
            <Favicon />
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
