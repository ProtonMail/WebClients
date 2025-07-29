import { useEffect, useState } from 'react';
import { Route } from 'react-router-dom';

import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import * as config from './config';
import { AdminContainer } from './containers/AdminContainer';
import { DashboardContainer } from './containers/DashboardContainer';
import { GuestContainer } from './containers/GuestContainer';
import { ProtonMeetContainerWrapper } from './containers/ProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

const routes = ['join', 'admin/create', 'dashboard'];

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
                    <Route path="/join" render={() => <ProtonMeetContainerWrapper guestMode={true} />} />
                </GuestContainer>
            ) : (
                <ProviderContainer>
                    <Route path="/join" render={() => <ProtonMeetContainerWrapper />} />
                    <Route path="/admin" component={AdminContainer} />
                    <Route path="/dashboard" component={DashboardContainer} />
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
