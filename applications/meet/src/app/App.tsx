import { useEffect, useState } from 'react';
import { Route } from 'react-router-dom';

import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { ComingSoon } from './components/ComingSoon/ComingSoon';
import * as config from './config';
import { AdminContainer } from './containers/AdminContainer';
import { DashboardContainer } from './containers/DashboardContainer';
import { GuestContainer } from './containers/GuestContainer';
import { ProtonMeetContainer } from './containers/ProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';
import usePublicToken from './hooks/srp/usePublicToken';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

const routes = ['join', 'admin/create', 'dashboard'];

const ComingSoonWrapper = ({ children }: { children: React.ReactNode }) => {
    const isJoin = window.location.pathname.includes('join'); // The /join path is both for instant meeting and joining a meeting

    const { token } = usePublicToken();

    const isEarlyAccess = useFlag('MeetEarlyAccess');
    const isEarlyAccessPublic = useFlag('MeetEarlyAccessPublic');

    const isOnJoinMeetingPageAndHasAccess = isJoin && token && isEarlyAccessPublic; // We have the meeting link id token if we are joining a meeting

    const shouldDisplayComingSoonPage = !isEarlyAccess && !isOnJoinMeetingPageAndHasAccess;

    if (shouldDisplayComingSoonPage) {
        return <ComingSoon />;
    }

    return children;
};

export const App = () => {
    const isGuest = window.location.pathname.includes('guest');

    const [initialised, setInitialised] = useState(false);

    useEffect(() => {
        if (!routes.some((route) => window.location.pathname.includes(route))) {
            const middleCharacter = window.location.href.at(-1) === '/' ? '' : '/';
            window.location.href = isGuest
                ? window.location.href + middleCharacter + 'join'
                : window.location.href + middleCharacter + 'dashboard';
        }

        setInitialised(true);
    }, []);

    if (!initialised) {
        return null;
    }

    return (
        <ProtonApp config={config as ProtonConfig}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>

            {isGuest ? (
                <GuestContainer>
                    <ComingSoonWrapper>
                        <Route path="/join" render={() => <ProtonMeetContainer guestMode={true} />} />
                    </ComingSoonWrapper>
                </GuestContainer>
            ) : (
                <ProviderContainer>
                    <ComingSoonWrapper>
                        <Route path="/join" render={() => <ProtonMeetContainer />} />
                        <Route path="/admin" component={AdminContainer} />
                        <Route path="/dashboard" component={DashboardContainer} />
                    </ComingSoonWrapper>
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
