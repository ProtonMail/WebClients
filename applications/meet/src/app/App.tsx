import { Route } from 'react-router-dom';

import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import * as config from './config';
import { AdminContainer } from './containers/AdminContainer';
import { GuestContainer } from './containers/GuestContainer';
import { ProtonMeetContainer } from './containers/ProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

export const App = () => {
    const isGuest = window.location.pathname.includes('guest');

    return (
        <ProtonApp config={config as ProtonConfig}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>

            {isGuest ? (
                <GuestContainer>
                    <ProtonMeetContainer guestMode={true} />
                </GuestContainer>
            ) : (
                <ProviderContainer>
                    <Route path="/join" component={ProtonMeetContainer} />
                    <Route path="/admin" component={AdminContainer} />
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
