import { useEffect, useRef } from 'react';
import { Route, useHistory, useLocation } from 'react-router-dom';

import ProtonApp from '@proton/components/containers/app/ProtonApp';
import { isMac } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isWasmSupported } from '@proton/shared/lib/helpers/isWasmSupported';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { ComingSoon } from './components/ComingSoon/ComingSoon';
import { WasmUnsupportedError } from './components/WasmUnsupportedError';
import config from './config';
import { DashboardContainer } from './containers/DashboardContainer/DashboardContainer';
import { GuestDashboardContainer } from './containers/DashboardContainer/GuestDashboardContainer';
import { GuestContainer } from './containers/GuestContainer';
import { WrappedProtonMeetContainer } from './containers/ProtonMeetContainer/WrappedProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';
import { ScheduleContainer } from './containers/ScheduleContainer';
import { getPublicToken } from './hooks/srp/usePublicToken';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

const routes = ['join', 'schedule/create', 'dashboard', 'incognito'];

const landingPageRoute = '/start-free-meeting';

const ComingSoonWrapper = ({ children }: { children: React.ReactNode }) => {
    const isJoin = window.location.pathname.includes('join'); // The /join path is both for instant meeting and joining a meeting

    const token = getPublicToken();

    const isEarlyAccess = useFlag('MeetEarlyAccess');
    const isEarlyAccessPublic = useFlag('MeetEarlyAccessPublic');

    const isOnJoinMeetingPageAndHasAccess = isJoin && token && isEarlyAccessPublic; // We have the meeting link id token if we are joining a meeting

    const shouldDisplayComingSoonPage = !isEarlyAccess && !isOnJoinMeetingPageAndHasAccess;

    if (shouldDisplayComingSoonPage) {
        return <ComingSoon />;
    }

    return children;
};

const RedirectWrapper = ({ children }: { children: React.ReactNode }) => {
    const isGuest = window.location.pathname.includes('guest');
    const hasInitialized = useRef(false);

    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.length < 2 && hasInitialized.current) {
            history.push('/dashboard');
        }
    }, [location.pathname]);

    useEffect(() => {
        if (location.pathname.includes(landingPageRoute)) {
            if (isGuest) {
                history.push('/join?instantJoin=true');
            } else {
                history.push('/dashboard');
            }
        }

        if (!isGuest && location.pathname.includes('incognito')) {
            history.push('/dashboard');
        }

        const userPattern = /\/u\/\d+/;

        if (isGuest && location.pathname.match(userPattern)) {
            const cleanPath = location.pathname.replace(userPattern, '');
            history.replace(cleanPath + location.hash);
        }

        if (window.location.pathname.includes('dashboard') && isGuest) {
            history.push('/join');
        }

        if (
            !routes.some((route) => window.location.pathname.includes(route)) ||
            window.location.pathname.includes('login')
        ) {
            history.push(isGuest ? '/join' : '/dashboard');
        }

        hasInitialized.current = true;
    }, []);

    return children;
};

const isGuest = window.location.pathname.includes('guest');

export const App = () => {
    if (!isWasmSupported()) {
        return <WasmUnsupportedError />;
    }

    return (
        <ProtonApp config={config}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>
            <div className={clsx('w-full h-full', isElectronApp ? 'pt-4' : '')}>
                {isElectronApp && isMac() ? (
                    <div
                        className="draggable-mac-electron-header absolute top-0 left-0 w-full h-custom"
                        style={{ '--h-custom': '2rem' }}
                    />
                ) : null}
                {isGuest ? (
                    <GuestContainer>
                        <RedirectWrapper>
                            <ComingSoonWrapper>
                                <Route path="/join" render={() => <WrappedProtonMeetContainer guestMode={true} />} />
                                <Route path="/incognito" component={GuestDashboardContainer} />
                            </ComingSoonWrapper>
                        </RedirectWrapper>
                    </GuestContainer>
                ) : (
                    <ProviderContainer>
                        <RedirectWrapper>
                            <ComingSoonWrapper>
                                <Route path="/join" render={() => <WrappedProtonMeetContainer />} />
                                <Route path="/schedule" component={ScheduleContainer} />
                                <Route path="/dashboard" component={DashboardContainer} />
                            </ComingSoonWrapper>
                        </RedirectWrapper>
                    </ProviderContainer>
                )}
            </div>
        </ProtonApp>
    );
};
