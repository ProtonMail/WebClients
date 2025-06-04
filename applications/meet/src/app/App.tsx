import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import * as config from './config';
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
                    <ProtonMeetContainer />
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
