import { BrowserRouter } from 'react-router-dom';

import {
    CompatibilityCheck,
    Icons,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { NavigationProvider } from '@proton/pass/components/Core/NavigationProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { API_PROXY_KEY, withAuthHash } from '@proton/pass/lib/api/proxy';
import { generateTOTPCode } from '@proton/pass/lib/otp/generate';
import type { Maybe, OtpRequest } from '@proton/pass/types';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { PASS_CONFIG, authStore } from '../lib/core';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import { Routes } from './Routing/Routes';
import { ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';

import './app.scss';

const generateOTP = ({ totpUri }: OtpRequest) => generateTOTPCode(totpUri);
const onLink = (url: string) => window.open(url, '_blank');

/** Ideally we should not have to use the hashed authentication data
 * in the URL. When we migrate the API factory to leverage cookie based
 * authentication we will be able to include the cookie credentials service
 * worker side (see `@proton/pass/lib/api/proxy`) */
const getDomainImageURL = (domain?: string): Maybe<string> =>
    domain
        ? withAuthHash(
              `${API_PROXY_KEY}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`,
              authStore.getUID()!,
              authStore.getAccessToken()!
          )
        : undefined;

export const App = () => {
    return (
        <PassCoreProvider
            config={PASS_CONFIG}
            generateOTP={generateOTP}
            getDomainImageURL={getDomainImageURL}
            onLink={onLink}
        >
            <CompatibilityCheck>
                <Icons />
                <ThemeProvider />
                <NotificationsProvider>
                    <ModalsProvider>
                        <ServiceWorkerProvider>
                            <ClientProvider>
                                <ClientContext.Consumer>
                                    {(client) => (
                                        <BrowserRouter basename={getBasename(client.state.localID)}>
                                            <NavigationProvider>
                                                <AuthServiceProvider>
                                                    <StoreProvider>
                                                        <Routes />
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
            </CompatibilityCheck>
        </PassCoreProvider>
    );
};
