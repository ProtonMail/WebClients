import { Router } from 'react-router-dom';

import { createHashHistory } from 'history';
import { AppGuard } from 'proton-pass-web/app/AppGuard';
import { AuthServiceProvider } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { ClientProvider } from 'proton-pass-web/app/Context/ClientProvider';
import { StoreProvider } from 'proton-pass-web/app/Store/StoreProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { core } from 'proton-pass-web/lib/core';
import { i18n } from 'proton-pass-web/lib/i18n';
import { logStore } from 'proton-pass-web/lib/logger';
import { monitor } from 'proton-pass-web/lib/monitor';
import { onboarding } from 'proton-pass-web/lib/onboarding';
import { settings } from 'proton-pass-web/lib/settings';
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
import { api, exposeApi } from '@proton/pass/lib/api/api';
import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    getCache,
    shouldRevalidate,
    withMaxAgeHeaders,
} from '@proton/pass/lib/api/cache';
import { createApi } from '@proton/pass/lib/api/factory';
import { createNetworkError } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { API_BODYLESS_STATUS_CODES } from '@proton/pass/lib/api/utils';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { selectExportData } from '@proton/pass/store/selectors/export';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { PASS_CONFIG, SENTRY_CONFIG } from '../lib/env';
import locales from './locales';

import './app.scss';

const history = createHashHistory();

exposeAuthStore(createAuthStore(createSecureSessionStorage()));
exposePassCrypto(createPassCrypto());
exposeApi(createApi({ config: PASS_CONFIG }));
sentry({ config: PASS_CONFIG, sentryConfig: SENTRY_CONFIG });

export const getPassCoreProps = (): PassCoreProviderProps => ({
    config: PASS_CONFIG,
    core,
    endpoint: 'desktop',
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

    getDomainImage: async (domain, signal) => {
        const res = await (async () => {
            const url = `${PASS_CONFIG.API_URL}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
            const cache = await getCache();
            const cachedResponse = await cache?.match(url).catch(noop);

            if (cachedResponse && !shouldRevalidate(cachedResponse)) return cachedResponse;

            return api<Response>({ url, output: 'raw', signal, sideEffects: false })
                .then(async (res) => {
                    if (res.ok) {
                        /* max-age is set to 0 on image responses from BE: this is sub-optimal in
                         * the context of the extension -> override the max-age header. */
                        const response = new Response(
                            API_BODYLESS_STATUS_CODES.includes(res.status) ? null : await res.blob(),
                            {
                                status: res.status,
                                statusText: res.statusText,
                                headers: withMaxAgeHeaders(res, CACHED_IMAGE_DEFAULT_MAX_AGE),
                            }
                        );

                        cache?.put(url, response.clone()).catch(noop);
                        return response;
                    } else throw new Error();
                })
                .catch((err) => {
                    if (getApiError(err).status === 422) {
                        const res = err.response as Response;
                        const response = new Response('Unprocessable Content', {
                            status: res.status,
                            statusText: res.statusText,
                            headers: withMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                        });

                        void cache?.put(url, response.clone()).catch(noop);
                        return response;
                    }

                    return createNetworkError(408);
                });
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
