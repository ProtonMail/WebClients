import { Router } from 'react-router-dom';

import { createHashHistory } from 'history';
import { AppGuard } from 'proton-pass-web/app/AppGuard';
import { AuthServiceProvider } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { AuthSwitchProvider } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { StoreProvider } from 'proton-pass-web/app/Store/StoreProvider';
import { store } from 'proton-pass-web/app/Store/store';
import { B2BEvents } from 'proton-pass-web/lib/b2b';
import { core } from 'proton-pass-web/lib/core';
import { i18n } from 'proton-pass-web/lib/i18n';
import { logStore } from 'proton-pass-web/lib/logger';
import { monitor } from 'proton-pass-web/lib/monitor';
import { settings } from 'proton-pass-web/lib/settings';
import { spotlightProxy as spotlight } from 'proton-pass-web/lib/spotlight';
import { telemetry } from 'proton-pass-web/lib/telemetry';
import { getTheme } from 'proton-pass-web/lib/theme';

import { Portal } from '@proton/components/components/portal';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import ModalsChildren from '@proton/components/containers/modals/Children';
import ModalsProvider from '@proton/components/containers/modals/Provider';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import InlineIcons from '@proton/icons/InlineIcons';
import { ContextMenuProvider } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { AuthStoreProvider } from '@proton/pass/components/Core/AuthStoreProvider';
import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { Localized } from '@proton/pass/components/Core/Localized';
import type { PassCoreProviderProps } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { PassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { createPassThemeManager } from '@proton/pass/components/Layout/Theme/ThemeService';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { ClipboardProvider } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { api, exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { createImageProxyHandler, imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { getBiometricsStorageKey, inferBiometricsStorageKey } from '@proton/pass/lib/auth/lock/biometrics/utils';
import { type AuthStore, createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { QA_SERVICE } from '@proton/pass/lib/qa/service';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { ping } from '@proton/shared/lib/api/tests';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import sentry from '@proton/shared/lib/helpers/sentry';

import { clipboard } from '../lib/clipboard';
import { PASS_CONFIG, SENTRY_CONFIG } from '../lib/env';
import { useDesktopContextMenu } from '../lib/hooks/useDesktopContextMenu';
import { WelcomeScreen } from './Views/WelcomeScreen/WelcomeScreen';
import { isFirstLaunch } from './firstLaunch';
import locales from './locales';

import './app.scss';

if (ENV === 'development') QA_SERVICE?.init(localStorage);

const authStore = exposeAuthStore(createAuthStore(createSecureSessionStorage()));

exposeApi(createApi({ config: PASS_CONFIG }));
exposePassCrypto(createPassCrypto(core, store));
sentry({ config: PASS_CONFIG, sentryConfig: SENTRY_CONFIG });

const history = createHashHistory();
const imageProxy = createImageProxyHandler(api);
const showWelcome = isFirstLaunch();

export const getPassCoreProps = (): PassCoreProviderProps => ({
    config: PASS_CONFIG,
    core,
    endpoint: 'desktop',
    i18n: i18n(locales),
    monitor,
    settings,
    spotlight,
    theme: createPassThemeManager({ getTheme }),

    generateOTP: (payload) => (payload.type === 'uri' ? generateTOTPCode(payload.totpUri) : null),

    getApiState: api.getState,

    supportsBiometrics: async () => {
        if (BUILD_TARGET === 'linux') return false;
        return window.ctxBridge?.canCheckPresence() ?? false;
    },

    getBiometricsKey: async (store: AuthStore) => {
        const { storageKey, version } = inferBiometricsStorageKey(store);
        return (await window.ctxBridge?.getSecret(storageKey, version)) ?? null;
    },

    generateBiometricsKey: async () => {
        const keyBytes = generateKey();
        const biometricsStorageKey = getBiometricsStorageKey(authStore.getLocalID()!);
        await window.ctxBridge!.setSecret(biometricsStorageKey, keyBytes);
        return importSymmetricKey(keyBytes);
    },

    getDomainImage: async (domain, signal) => {
        const url = `${PASS_CONFIG.API_URL}/core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;
        const res = await imageProxy(url, signal);
        return imageResponsetoDataURL(res);
    },

    getLogs: logStore.read,

    onLink: (url) => window.open(url, '_blank'),
    onTelemetry: pipe(createTelemetryEvent, telemetry.push),
    onB2BEvent: B2BEvents.push,

    openSettings: (page) =>
        history.push({
            pathname: getLocalPath('settings'),
            search: location.search,
            hash: page,
        }),

    writeToClipboard: async (content, clipboardTTL) => {
        await clipboard.write(content);
        if (clipboardTTL && clipboardTTL > 0) clipboard.autoClear(clipboardTTL, content);
        return true;
    },

    isFirstLaunch,
});

export const App = () => {
    useDesktopContextMenu();

    return (
        <PassCoreProvider {...getPassCoreProps()} wasm>
            <InlineIcons /> {/* Remove when enabling SRI in desktop */}
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
                                        <AuthStoreProvider store={authStore}>
                                            <AuthSwitchProvider>
                                                <AuthServiceProvider>
                                                    <StoreProvider>
                                                        <ContextMenuProvider>
                                                            <Localized>
                                                                <ClipboardProvider>
                                                                    {showWelcome ? <WelcomeScreen /> : <AppGuard />}
                                                                </ClipboardProvider>
                                                            </Localized>
                                                            <Portal>
                                                                <ModalsChildren />
                                                                <NotificationsChildren />
                                                            </Portal>
                                                        </ContextMenuProvider>
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
        </PassCoreProvider>
    );
};
