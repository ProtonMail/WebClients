import { useEffect } from 'react';
import { Route, useHistory, useLocation } from 'react-router-dom';

import ProtonApp from '@proton/components/containers/app/ProtonApp';
import { isWasmSupported } from '@proton/shared/lib/helpers/isWasmSupported';
import { isWebRtcSupported } from '@proton/shared/lib/helpers/isWebRtcSupported';
import useFlag from '@proton/unleash/useFlag';

import { ComingSoon } from './components/ComingSoon/ComingSoon';
import { WasmUnsupportedError } from './components/WasmUnsupportedError';
import { WebRtcUnsupportedError } from './components/WebRtcUnsupportedError';
import config from './config';
import { AdminContainer } from './containers/AdminContainer';
import { DashboardContainer } from './containers/DashboardContainer';
import { GuestContainer } from './containers/GuestContainer';
import { WrappedProtonMeetContainer } from './containers/ProtonMeetContainer/WrappedProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';
import { getPublicToken } from './hooks/srp/usePublicToken';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

const routes = ['join', 'admin/create', 'dashboard'];

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

    const history = useHistory();
    const location = useLocation();

    useEffect(() => {
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
    }, []);

    return children;
};

export const App = () => {
    const isGuest = window.location.pathname.includes('guest');

    if (!isWasmSupported()) {
        return <WasmUnsupportedError />;
    }

    if (!isWebRtcSupported()) {
        return <WebRtcUnsupportedError />;
    }

    return (
        <ProtonApp config={config}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>

            {isGuest ? (
                <GuestContainer>
                    <RedirectWrapper>
                        <ComingSoonWrapper>
                            <Route path="/join" render={() => <WrappedProtonMeetContainer guestMode={true} />} />
                        </ComingSoonWrapper>
                    </RedirectWrapper>
                </GuestContainer>
            ) : (
                <ProviderContainer>
                    <RedirectWrapper>
                        <ComingSoonWrapper>
                            <Route path="/join" render={() => <WrappedProtonMeetContainer />} />
                            <Route path="/admin" component={AdminContainer} />
                            <Route path="/dashboard" component={DashboardContainer} />
                        </ComingSoonWrapper>
                    </RedirectWrapper>
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
