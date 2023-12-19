import { BrowserRouter, Route, Switch } from 'react-router-dom';

import {
    CompatibilityCheck,
    ErrorBoundary,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    StandardErrorPage,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { NavigationProvider } from '@proton/pass/components/Core/NavigationProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { API_PROXY_KEY, withAuthHash } from '@proton/pass/lib/api/proxy';
import { generateTOTPCode } from '@proton/pass/lib/otp/generate';
import type { Maybe, OtpRequest } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { PASS_CONFIG, authStore } from '../lib/core';
import { onboarding } from '../lib/onboarding';
import { telemetry } from '../lib/telemetry';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import { ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';

import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';
import { PaidLobby } from './Views/PaidLobby';
import './app.scss';

const generateOTP = ({ totpUri }: OtpRequest) => generateTOTPCode(totpUri);
const onLink = (url: string) => window.open(url, '_blank');

/** Ideally we should not have to use the hashed authentication data
 * in the URL. When we migrate the API factory to leverage cookie based
 * authentication we will be able to include the cookie credentials service
 * worker side (see `@proton/pass/lib/api/proxy`) */
const getDomainImageURL = (url: Maybe<ParsedUrl>): Maybe<string> => {
    if (!url || url.isUnknownOrReserved) return;

    return withAuthHash(
        `${API_PROXY_KEY}/core/v4/images/logo?Domain=${url.hostname}&Size=32&Mode=light&MaxScaleUpFactor=4`,
        authStore.getUID()!,
        authStore.getAccessToken()!
    );
};

export const App = () => {
    return (
        <PassCoreProvider
            endpoint="web"
            config={PASS_CONFIG}
            generateOTP={generateOTP}
            getDomainImageURL={getDomainImageURL}
            onLink={onLink}
            onTelemetry={telemetry.push}
            onOnboardingAck={onboarding.acknowledge}
        >
            <CompatibilityCheck>
                <Icons />
                <ThemeProvider />
                <ErrorBoundary component={<StandardErrorPage big />}>
                    <NotificationsProvider>
                        <ModalsProvider>
                            <ServiceWorkerProvider>
                                <ClientProvider>
                                    <ClientContext.Consumer>
                                        {({ state: { loggedIn, localID } }) => (
                                            <BrowserRouter basename={getBasename(localID)}>
                                                <NavigationProvider>
                                                    <AuthServiceProvider>
                                                        <StoreProvider>
                                                        <Switch>
                                                            <Route
                                                                path="/upgrade"
                                                                render={() => ( <PaidLobby />)}
                                                            />
                                                            <Route
                                                                path="*"
                                                                render={() => (loggedIn ? <Main /> : <Lobby />)}
                                                            />
                                                            </Switch>
                                                            <Portal>
                                                                <ModalsChildren />
                                                                <NotificationsChildren />
                                                            </Portal>
                                                        </StoreProvider>
                                                    </AuthServiceProvider>
                                                </NavigationProvider>
                                            </BrowserRouter>
                                        )}
                                    </ClientContext.Consumer>
                                </ClientProvider>
                            </ServiceWorkerProvider>
                        </ModalsProvider>
                    </NotificationsProvider>
                </ErrorBoundary>
            </CompatibilityCheck>
        </PassCoreProvider>
    );
};
