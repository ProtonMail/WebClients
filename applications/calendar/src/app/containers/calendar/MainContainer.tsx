import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import unary from '@proton/utils/unary';
import {
    ErrorBoundary,
    StandardErrorPage,
    useAddresses,
    useCalendars,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import { useInstance } from '@proton/hooks/index';

import CalendarOnboardingContainer from '../setup/CalendarOnboardingContainer';
import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import ResetContainer from '../setup/ResetContainer';
import MainContainerSetup from './MainContainerSetup';

import Favicon from '../../components/Favicon';
import { fromUrlParams } from './getUrlHelper';
import { getIsSideApp } from '../../helpers/views';

const MainContainer = () => {
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();
    const { pathname } = useLocation();

    const sideAppView = useInstance(() => {
        const { view } = fromUrlParams(pathname);
        if (!getIsSideApp(view)) {
            return;
        }
        return view;
    });

    const memoedCalendars = useMemo(() => getVisualCalendars(calendars || [], addresses || []), [calendars, addresses]);
    const memoedAddresses = useMemo(() => addresses || [], [addresses]);

    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();

    const [hasCalendarToGenerate, setHasCalendarToGenerate] = useState(() => {
        return memoedCalendars.filter(unary(getIsPersonalCalendar)).length === 0;
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

    if (welcomeFlags.isWelcomeFlow) {
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
            sideAppView={sideAppView}
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
