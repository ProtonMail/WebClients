import { Router } from 'react-router-dom';

import { PASS_CONFIG } from 'proton-pass-web/lib/core';
import { i18n } from 'proton-pass-web/lib/i18n';
import { logStore } from 'proton-pass-web/lib/logger';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { telemetry } from 'proton-pass-web/lib/telemetry';

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
import { Localized } from '@proton/pass/components/Core/Localized';
import type { PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { PassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, history } from '@proton/pass/components/Navigation/routing';
import { api } from '@proton/pass/lib/api/api';
import { getRequestIDHeaders } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectExportData } from '@proton/pass/store/selectors/export';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { AppGuard } from './AppGuard';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientProvider } from './Context/ClientProvider';
import type { ServiceWorkerContextValue } from './ServiceWorker/ServiceWorkerProvider';
import { ServiceWorkerContext, ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';
import { store } from './Store/store';

sentry({ config: PASS_CONFIG });

export const getPassCoreProps = (sw: MaybeNull<ServiceWorkerContextValue>): PassCoreProviderProps => {
    const cache = new Map<string, Maybe<string>>();

    return {
        config: PASS_CONFIG,
        endpoint: 'web',
        i18n: i18n,

        exportData: async (options) => {
            const state = store.getState();
            const data = selectExportData({ config: PASS_CONFIG, format: options.format })(state);
            return transferableToFile(await createPassExport(data, options));
        },

        generateOTP: (payload) => (payload.type === 'uri' ? generateTOTPCode(payload.totpUri) : null),

        getApiState: api.getState,

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

            return api<Response>({ url, output: 'raw', signal, headers })
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
        onTelemetry: telemetry.push,

        openSettings: (page) =>
            history.push({
                pathname: getLocalPath('settings'),
                search: location.search,
                hash: page,
            }),

        prepareImport: prepareImport,
        writeToClipboard: (value) => navigator.clipboard.writeText(value),
    };
};

export const App = () => (
    <ServiceWorkerProvider>
        <ServiceWorkerContext.Consumer>
            {(sw) => (
                <PassCoreProvider {...getPassCoreProps(sw)}>
                    <CompatibilityCheck>
                        <Icons />
                        <ThemeProvider />
                        <ErrorBoundary component={<StandardErrorPage big />}>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <PassExtensionLink>
                                        <ClientProvider>
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
                                        </ClientProvider>
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
