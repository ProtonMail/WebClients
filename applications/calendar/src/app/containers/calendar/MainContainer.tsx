import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useWelcomeFlags } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { selectCalendarsBootstrap } from '@proton/calendar';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { KeyTransparencyManager, SubscriptionModalProvider, useDrawerParent } from '@proton/components';
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders';
import { FeatureCode, useFeatures } from '@proton/features';
import { useInstance } from '@proton/hooks';
import { getVisualCalendars, groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import useFlag from '@proton/unleash/useFlag';

import { getIsCalendarAppInDrawer } from '../../helpers/views';
import useCalendarFavicon from '../../hooks/useCalendarFavicon';
import { useCalendarSelector } from '../../store/hooks';
import CalendarOnboardingContainer from '../setup/CalendarOnboardingContainer';
import CalendarSetupContainer from '../setup/CalendarSetupContainer';
import UnlockCalendarsContainer from '../setup/UnlockCalendarsContainer';
import { getCalendarsToAct } from '../setup/helper';
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
    const calendarBootstrap = useCalendarSelector(selectCalendarsBootstrap);

    // Make sure we have the data when opening the popover
    useFlag('ZoomIntegration');

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
    const calendarsToAct = useMemo(() => {
        return getCalendarsToAct({ calendars: memoedCalendars, calendarBootstrap });
    }, [memoedCalendars, calendarBootstrap]);
    const [ignoreUnlock, setIgnoreUnlock] = useState(false);
    const [ignoreIncomplete, setIgnoreIncomplete] = useState(false);

    const { ownedPersonalCalendars, holidaysCalendars } = useMemo(() => {
        return groupCalendarsByTaxonomy(memoedCalendars);
    }, [memoedCalendars]);
    const memoedAddresses = useMemo(() => addresses || [], [addresses]);

    const {
        welcomeFlags: { isDone, isWelcomeFlow },
        setDone: setWelcomeFlagsDone,
    } = useWelcomeFlags();

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

    if (!ignoreIncomplete && calendarsToAct.calendarsIncomplete.length) {
        return (
            <CalendarSetupContainer
                calendars={calendarsToAct.calendarsIncomplete}
                onDone={() => setIgnoreIncomplete(true)}
            />
        );
    }

    if (!isDone && !isElectronMail) {
        return <CalendarOnboardingContainer onDone={() => setWelcomeFlagsDone()} drawerView={drawerView} />;
    }

    if (!ignoreUnlock && calendarsToAct.info.unlockAny) {
        return (
            <UnlockCalendarsContainer
                calendarsToAct={calendarsToAct}
                onDone={() => setIgnoreUnlock(true)}
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
        <SubscriptionModalProvider app={APPS.PROTONCALENDAR}>
            <KeyTransparencyManager appName={APPS.PROTONCALENDAR}>
                <QuickSettingsRemindersProvider>
                    <MainContainer />
                </QuickSettingsRemindersProvider>
            </KeyTransparencyManager>
        </SubscriptionModalProvider>
    );
};

export default WrappedMainContainer;
