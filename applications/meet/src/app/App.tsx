import { useEffect, useState } from 'react';
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

const routes = ['join', 'admin/create', 'admin/details'];

export const App = () => {
    const isGuest = window.location.pathname.includes('guest');

    const [initialised, setInitialised] = useState(false);

    useEffect(() => {
        if (!routes.some((route) => window.location.pathname.includes(route))) {
            const middleCharacter = window.location.href.at(-1) === '/' ? '' : '/';
            window.location.href = window.location.href + middleCharacter + 'join';
        }

        setInitialised(true);
    }, []);

    if (!initialised) {
        return null;
    }

    const href = window.location.href;
    const joinPattern = /\/join\/[^\/#]+#[^\/#]+$/;

    const joinMeeting = joinPattern.test(href);

    return (
        <ProtonApp config={config as ProtonConfig}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>

            {isGuest ? (
                <GuestContainer>
                    <Route
                        path="/join"
                        render={() => <ProtonMeetContainer guestMode={true} instantMeeting={!joinMeeting} />}
                    />
                </GuestContainer>
            ) : (
                <ProviderContainer>
                    <Route path="/join" render={() => <ProtonMeetContainer instantMeeting={!joinMeeting} />} />
                    <Route path="/admin" component={AdminContainer} />
                </ProviderContainer>
            )}
        </ProtonApp>
    );
};
