import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { unary } from '@proton/shared/lib/helpers/function';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
    ErrorBoundary,
    StandardErrorPage,
    useAddresses,
    useCalendars,
    useUser,
    useWelcomeFlags,
} from '@proton/components';

import CalendarOnboardingContainer from '../setup/CalendarOnboardingContainer';
import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import ResetContainer from '../setup/ResetContainer';
import MainContainerSetup from './MainContainerSetup';

import favicons from '../../../assets/favicons';

const MainContainer = () => {
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();

    const memoedCalendars = useMemo(() => calendars || [], [calendars]);
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

    return <MainContainerSetup user={user} addresses={memoedAddresses} calendars={memoedCalendars} />;
};

const WrappedMainContainer = () => {
    const date = new Date().getDate();

    return (
        <ErrorBoundary component={<StandardErrorPage />}>
            <Helmet>
                <link rel="icon" type="image/svg+xml" href={favicons[date][0]} />
                <link rel="alternate icon" href={favicons[date][1]} />
            </Helmet>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
