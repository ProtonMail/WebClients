import { Router, matchPath } from 'react-router-dom';

import config from 'proton-pass-web/app/config';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { PASS_WEB_COMPAT } from 'proton-pass-web/lib/compatibility';
import { core } from 'proton-pass-web/lib/core';
import { PASS_CONFIG } from 'proton-pass-web/lib/env';
import { i18n } from 'proton-pass-web/lib/i18n';
import { logStore } from 'proton-pass-web/lib/logger';
import { monitor } from 'proton-pass-web/lib/monitor';
import { settings } from 'proton-pass-web/lib/settings';
import { spotlightProxy as spotlight } from 'proton-pass-web/lib/spotlight';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { getTheme } from 'proton-pass-web/lib/theme';

import {
    CompatibilityCheck,
    ErrorBoundary,
    ModalsChildren,
    ModalsProvider,
    NotificationsChildren,
    NotificationsProvider,
} from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { StandardErrorPageDisplay } from '@proton/components/containers/app/StandardErrorPage';
import { GenericErrorDisplay } from '@proton/components/containers/error/GenericError';
import Icons from '@proton/icons/Icons';
import { AuthStoreProvider } from '@proton/pass/components/Core/AuthStoreProvider';
import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import type { PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { PassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { ThemeConnect } from '@proton/pass/components/Layout/Theme/ThemeConnect';
import { createPassThemeManager } from '@proton/pass/components/Layout/Theme/ThemeService';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { PublicRoutes, getLocalPath, history } from '@proton/pass/components/Navigation/routing';
import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { api, exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { getRequestIDHeaders } from '@proton/pass/lib/api/fetch-controller';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { getBiometricsStorageKey, inferBiometricsStorageKey } from '@proton/pass/lib/auth/lock/biometrics/utils';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import {
    deriveKeyFromPRFCredential,
    generateCredential,
    getSerializedCredential,
    isPRFSupported,
} from '@proton/pass/lib/crypto/utils/prf';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import type { Maybe } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { ping } from '@proton/shared/lib/api/tests';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { decodeBase64URL, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { AppGuard } from './AppGuard';
import { AuthServiceProvider } from './Auth/AuthServiceProvider';
import { AuthSwitchProvider } from './Auth/AuthSwitchProvider';
import { ServiceWorkerContext, ServiceWorkerProvider } from './ServiceWorker/client/ServiceWorkerProvider';
import type { ServiceWorkerClient } from './ServiceWorker/client/client';
import { StoreProvider } from './Store/StoreProvider';
import locales from './locales';

const authStore = exposeAuthStore(createAuthStore(createSecureSessionStorage()));

exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));
exposePassCrypto(createPassCrypto(core));
sentry({ config: PASS_CONFIG });

export const getPassCoreProps = (sw: Maybe<ServiceWorkerClient>): PassCoreProviderProps => {
    const cache = new Map<string, Maybe<string>>();

    return {
        config: PASS_CONFIG,
        core,
        endpoint: 'web',
        i18n: i18n(locales),
        monitor,
        settings,
        spotlight,

        theme: createPassThemeManager({
            getTheme: async () => {
                /** UnauthorizedRoutes should stay in PassDark mode */
                const forceDarkMode = matchPath(window.location.pathname, PublicRoutes.SecureLink);
                return forceDarkMode ? PassThemeOption.PassDark : getTheme();
            },
        }),

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

            return api<Response>({ url, output: 'raw', headers, signal, sideEffects: false })
                .then(async (res) => {
                    const dataURL = await imageResponsetoDataURL(res);
                    if (!sw) cache.set(url, dataURL);
                    return dataURL;
                })
                .catch(noop);
        },

        getLogs: logStore.read,

        onLink: (url, options) => window.open(url, options?.replace ? '_self' : '_blank'),
        onTelemetry: pipe(createTelemetryEvent, telemetry.push),
        onB2BEvent: B2BEvents.push,

        openSettings: (page) =>
            history.push({
                pathname: getLocalPath('settings'),
                search: location.search,
                hash: page,
            }),

        writeToClipboard: (value) => navigator.clipboard.writeText(value),

        supportsBiometrics: isPRFSupported,

        getBiometricsKey: async (store) => {
            const { storageKey } = inferBiometricsStorageKey(store);
            const encodedId = localStorage.getItem(storageKey) ?? '';
            const credentialId = stringToUint8Array(decodeBase64URL(encodedId));

            return getSerializedCredential(credentialId);
        },

        generateBiometricsKey: async () => {
            const credential = await generateCredential(authStore);
            const key = await deriveKeyFromPRFCredential(credential);

            /* Store the Passkey ID that can be used to derive this
             * key once we've successfully derived it */
            const storageKey = getBiometricsStorageKey(authStore.getLocalID()!);
            localStorage.setItem(storageKey, credential.id);

            return key;
        },
    };
};

export const App = () => (
    <ServiceWorkerProvider>
        <ServiceWorkerContext.Consumer>
            {(sw) => (
                <PassCoreProvider {...getPassCoreProps(sw?.client)} wasm>
                    <CompatibilityCheck compatibilities={PASS_WEB_COMPAT}>
                        <Icons />

                        <ErrorBoundary
                            component={<StandardErrorPageDisplay big errorComponent={GenericErrorDisplay} />}
                        >
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <PassExtensionLink>
                                        <ConnectivityProvider
                                            subscribe={api.subscribe}
                                            onPing={() => api({ ...ping(), unauthenticated: true })}
                                        >
                                            <Router history={history}>
                                                <NavigationProvider>
                                                    <AuthStoreProvider store={authStore}>
                                                        <AuthSwitchProvider>
                                                            <AuthServiceProvider>
                                                                <StoreProvider>
                                                                    <ThemeConnect />
                                                                    <Localized>
                                                                        <AppGuard />
                                                                    </Localized>
                                                                    <Portal>
                                                                        <ModalsChildren />
                                                                        <NotificationsChildren />
                                                                    </Portal>
                                                                </StoreProvider>
                                                            </AuthServiceProvider>
                                                        </AuthSwitchProvider>
                                                    </AuthStoreProvider>
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
