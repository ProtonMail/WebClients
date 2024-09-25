import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAddresses, useCalendars, useSubscription, useUser, useWelcomeFlags } from '@proton/components';
import { useDrawerParent } from '@proton/components/hooks';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { FeatureCode, useFeatures } from '@proton/features';
import { useInstance } from '@proton/hooks';
import { getVisualCalendars, groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { getIsCalendarAppInDrawer } from '../../helpers/views';
import useCalendarFavicon from '../../hooks/useCalendarFavicon';
import CalendarOnboardingContainer from '../setup/CalendarOnboardingContainer';
import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import UnlockCalendarsContainer from '../setup/UnlockCalendarsContainer';
import MainContainerSetup from './MainContainerSetup';
import { fromUrlParams } from './getUrlHelper';

const MainContainer = () => {
    useCalendarFavicon();

    const hasReactivatedCalendarsRef = useRef<boolean>(false);

    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { pathname } = useLocation();

    const drawerView = useInstance(() => {
        const { view } = fromUrlParams(pathname);
        if (!getIsCalendarAppInDrawer(view)) {
            return;
        }
        document.body.classList.add('is-drawer-app');

        return view;
    });

    const { getFeature } = useFeatures([FeatureCode.AutoAddHolidaysCalendars]);
    const autoAddHolidaysCalendarsEnabled = getFeature(FeatureCode.AutoAddHolidaysCalendars).feature?.Value === true;

    const memoedCalendars = useMemo(() => sortCalendars(getVisualCalendars(calendars || [])), [calendars]);
    const { ownedPersonalCalendars, holidaysCalendars } = useMemo(() => {
        return groupCalendarsByTaxonomy(memoedCalendars);
    }, [memoedCalendars]);
    const memoedAddresses = useMemo(() => addresses || [], [addresses]);

    const [{ isWelcomeFlow, isDone }, setWelcomeFlagsDone] = useWelcomeFlags();

    const [hasCalendarToGenerate, setHasCalendarToGenerate] = useState(() => {
        return ownedPersonalCalendars.length === 0;
    });
    const [hasHolidaysCalendarToGenerate, setHasHolidayCalendarToGenerate] = useState(() => {
        return (
            isWelcomeFlow &&
            autoAddHolidaysCalendarsEnabled &&
            !holidaysCalendars.length &&
            !ownedPersonalCalendars.length
        );
    });

    const [calendarsToUnlock, setCalendarsToUnlock] = useState(() => {
        return memoedCalendars.filter(({ Flags }) => {
            return (
                hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED) ||
                hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE) ||
                hasBit(Flags, CALENDAR_FLAGS.LOST_ACCESS)
            );
        });
    });

    const [calendarsToSetup, setCalendarsToSetup] = useState(() => {
        return memoedCalendars.filter(({ Flags }) => {
            return hasBit(Flags, CALENDAR_FLAGS.INCOMPLETE_SETUP);
        });
    });

    if (hasCalendarToGenerate || hasHolidaysCalendarToGenerate) {
        return (
            <CalendarSetupContainer
                hasCalendarToGenerate={hasCalendarToGenerate}
                hasHolidaysCalendarToGenerate={hasHolidaysCalendarToGenerate}
                onDone={() => {
                    setHasCalendarToGenerate(false);
                    setHasHolidayCalendarToGenerate(false);
                }}
            />
        );
    }

    if (calendarsToSetup.length) {
        return <CalendarSetupContainer calendars={calendarsToSetup} onDone={() => setCalendarsToSetup([])} />;
    }

    if (!isDone && !isElectronMail) {
        return <CalendarOnboardingContainer onDone={() => setWelcomeFlagsDone()} />;
    }

    if (calendarsToUnlock.length) {
        return (
            <UnlockCalendarsContainer
                calendars={memoedCalendars}
                calendarsToUnlock={calendarsToUnlock}
                onDone={() => {
                    setCalendarsToUnlock([]);
                }}
                drawerView={drawerView}
                hasReactivatedCalendarsRef={hasReactivatedCalendarsRef}
            />
        );
    }

    return (
        <MainContainerSetup
            user={user}
            subscription={subscription}
            addresses={memoedAddresses}
            calendars={memoedCalendars}
            drawerView={drawerView}
            hasReactivatedCalendarsRef={hasReactivatedCalendarsRef}
        />
    );
};

const WrappedMainContainer = () => {
    useDrawerParent();
    return (
        <QuickSettingsRemindersProvider>
            <MainContainer />
        </QuickSettingsRemindersProvider>
    );
};

export default WrappedMainContainer;
