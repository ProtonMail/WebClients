import { Router } from 'react-router-dom';

import { createHashHistory } from 'history';
import { AppGuard } from 'proton-pass-web/app/AppGuard';
import { AuthServiceProvider } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { ClientProvider } from 'proton-pass-web/app/Context/ClientProvider';
import { StoreProvider } from 'proton-pass-web/app/Store/StoreProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { logStore } from 'proton-pass-web/lib/logger';
import { monitor } from 'proton-pass-web/lib/monitor';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { telemetry } from 'proton-pass-web/lib/telemetry';

import {
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
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { api } from '@proton/pass/lib/api/api';
import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    getCache,
    getMaxAgeHeaders,
    shouldRevalidate,
} from '@proton/pass/lib/api/cache';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { API_BODYLESS_STATUS_CODES } from '@proton/pass/lib/api/utils';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { selectExportData } from '@proton/pass/store/selectors/export';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { PASS_CONFIG } from '../lib/core';
import { i18n } from '../lib/i18n';
import '../lib/sentry';

import './app.scss';

const history = createHashHistory();

export const getPassCoreProps = (): PassCoreProviderProps => ({
    config: PASS_CONFIG,
    endpoint: 'desktop',
    i18n: i18n,
    monitor,

    exportData: async (options) => {
        const state = store.getState();
        const data = selectExportData({ config: PASS_CONFIG, format: options.format })(state);
        return transferableToFile(await createPassExport(data, options));
    },

    generateOTP: (payload) => (payload.type === 'uri' ? generateTOTPCode(payload.totpUri) : null),

    getApiState: api.getState,

    getDomainImage: async (domain, signal) => {
        const res = await (async () => {
            const url = `${PASS_CONFIG.API_URL}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
            const cache = await getCache();
            const cachedResponse = await cache.match(url);

            if (cachedResponse && !shouldRevalidate(cachedResponse)) return cachedResponse;

            return api<Response>({ url, output: 'raw', signal })
                .then(async (res) => {
                    if (API_BODYLESS_STATUS_CODES.includes(res.status)) {
                        void cache.put(url, res.clone());
                        return res;
                    } else if (res.status === 422) {
                        /* When dealing with unprocessable content from the image
                         * endpoint - cache the error eitherway for now as we want
                         * to avoid swarming the service-worker with unnecessary
                         * parallel requests which may block other api calls with
                         * higher priority */
                        const response = new Response('Unprocessable Content', {
                            status: res.status,
                            statusText: res.statusText,
                            headers: getMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                        });

                        void cache.put(url, response.clone());
                        return response;
                    } else if (res.ok) {
                        /* max-age is set to 0 on image responses from BE: this is sub-optimal in
                         * the context of the extension -> override the max-age header. */
                        const response = new Response(await res.blob(), {
                            status: res.status,
                            statusText: res.statusText,
                            headers: getMaxAgeHeaders(res, CACHED_IMAGE_DEFAULT_MAX_AGE),
                        });

                        void cache.put(url, response.clone());
                        return response;
                    } else throw new Error();
                })
                .catch(
                    () =>
                        new Response('Network error', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' },
                        })
                );
        })();

        return imageResponsetoDataURL(res);
    },

    onLink: (url) => window.open(url, '_blank'),
    onboardingAcknowledge: onboarding.acknowledge,
    onboardingCheck: pipe(onboarding.checkMessage, prop('enabled')),
    onTelemetry: pipe(createTelemetryEvent, telemetry.push),

    openSettings: (page) =>
        history.push({
            pathname: getLocalPath('settings'),
            search: location.search,
            hash: page,
        }),

    prepareImport: prepareImport,
    getLogs: logStore.read,
    writeToClipboard: window.ctxBridge.writeToClipboard,
});

export const App = () => {
    return (
        <PassCoreProvider {...getPassCoreProps()}>
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
        </PassCoreProvider>
    );
};
