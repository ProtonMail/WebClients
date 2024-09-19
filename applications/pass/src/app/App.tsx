import { Router } from 'react-router-dom';

import * as config from 'proton-pass-web/app/config';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { core } from 'proton-pass-web/lib/core';
import { PASS_CONFIG } from 'proton-pass-web/lib/env';
import { i18n } from 'proton-pass-web/lib/i18n';
import { logStore } from 'proton-pass-web/lib/logger';
import { monitor } from 'proton-pass-web/lib/monitor';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { settings } from 'proton-pass-web/lib/settings';
import { telemetry } from 'proton-pass-web/lib/telemetry';

import {
    CompatibilityCheck,
    ErrorBoundary,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
    StandardErrorPage,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import Icons from '@proton/icons/Icons';
import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import type { PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { PassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, history } from '@proton/pass/components/Navigation/routing';
import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { api, exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { getRequestIDHeaders } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { selectExportData } from '@proton/pass/store/selectors/export';
import type { Maybe } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { ping } from '@proton/shared/lib/api/tests';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { AppGuard } from './AppGuard';
import { AuthServiceProvider } from './Auth/AuthServiceProvider';
import { ServiceWorkerContext, ServiceWorkerProvider } from './ServiceWorker/client/ServiceWorkerProvider';
import type { ServiceWorkerClient } from './ServiceWorker/client/client';
import { StoreProvider } from './Store/StoreProvider';
import { store } from './Store/store';
import locales from './locales';

exposeAuthStore(createAuthStore(createSecureSessionStorage()));
exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));
exposePassCrypto(createPassCrypto());
sentry({ config: PASS_CONFIG });

export const getPassCoreProps = (sw: Maybe<ServiceWorkerClient>): PassCoreProviderProps => {
    const cache = new Map<string, Maybe<string>>();

    return {
        config: PASS_CONFIG,
        core,
        endpoint: 'web',
        i18n: i18n(locales),
        monitor,

        exportData: async (options) => {
            const state = store.getState();
            const data = selectExportData({ config: PASS_CONFIG, format: options.format })(state);
            return transferableToFile(await createPassExport(data, options));
        },

        generateOTP: (payload) => (payload.type === 'uri' ? generateTOTPCode(payload.totpUri) : null),

        getApiState: api.getState,

        getOfflineEnabled: async () => (await settings.resolve()).offlineEnabled ?? false,

        /** If service worker support is unavailable, use a fallback caching strategy for
         * domain images. When service worker is enabled, utilize abort message passing to
         * correctly abort intercepted fetch requests. */
        getDomainImage: async (domain, signal) => {
            const url = `core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
            const cachedImage = cache.get(url);
            if (cachedImage) return cachedImage;

            /* Forward the abort signal to the service worker. */
            const [headers, requestId] = sw ? getRequestIDHeaders() : [];
            if (sw) signal.onabort = () => sw?.send({ type: 'abort', requestId: requestId! });

            return api<Response>({ url, output: 'raw', headers, signal, sideEffects: false })
                .then(async (res) => {
                    const dataURL = await imageResponsetoDataURL(res);
                    if (!sw) cache.set(url, dataURL);
                    return dataURL;
                })
                .catch(noop);
        },

        getLogs: logStore.read,
        onboardingAcknowledge: onboarding.acknowledge,
        onboardingCheck: pipe(onboarding.checkMessage, prop('enabled')),
        onLink: (url, options) => window.open(url, options?.replace ? '_self' : '_blank'),

        onTelemetry: pipe(createTelemetryEvent, telemetry.push),
        onB2BEvent: B2BEvents.push,

        openSettings: (page) =>
            history.push({
                pathname: getLocalPath('settings'),
                search: location.search,
                hash: page,
            }),

        prepareImport,
        writeToClipboard: (value) => navigator.clipboard.writeText(value),
    };
};

export const App = () => (
    <ServiceWorkerProvider>
        <ServiceWorkerContext.Consumer>
            {(sw) => (
                <PassCoreProvider {...getPassCoreProps(sw?.client)}>
                    <CompatibilityCheck>
                        <Icons />
                        <ThemeProvider />
                        <ErrorBoundary component={<StandardErrorPage big />}>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <PassExtensionLink>
                                        <ConnectivityProvider
                                            subscribe={api.subscribe}
                                            onPing={() => api({ ...ping(), unauthenticated: true })}
                                        >
                                            <Router history={history}>
                                                <NavigationProvider>
                                                    <AuthServiceProvider>
                                                        <StoreProvider>
                                                            <Localized>
                                                                <AppGuard />
                                                            </Localized>
                                                            <Portal>
                                                                <ModalsChildren />
                                                                <NotificationsChildren />
                                                            </Portal>
                                                        </StoreProvider>
                                                    </AuthServiceProvider>
                                                </NavigationProvider>
                                            </Router>
                                        </ConnectivityProvider>
                                    </PassExtensionLink>
                                </ModalsProvider>
                            </NotificationsProvider>
                        </ErrorBoundary>
                    </CompatibilityCheck>
                </PassCoreProvider>
            )}
        </ServiceWorkerContext.Consumer>
    </ServiceWorkerProvider>
);
