import { Route, Router } from 'react-router-dom';

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
import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { PassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath, history } from '@proton/pass/components/Navigation/routing';
import { api } from '@proton/pass/lib/api/api';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectExportData } from '@proton/pass/store/selectors/export';
import type { Maybe } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import type { ServiceWorkerContextValue } from './ServiceWorker/ServiceWorkerProvider';
import { ServiceWorkerContext, ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';
import { store } from './Store/store';
import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';
import * as config from './config';

sentry({ config });

const generateOTP: PassCoreContextValue['generateOTP'] = ({ totpUri }) => generateTOTPCode(totpUri);

const onLink: PassCoreContextValue['onLink'] = (url, options) =>
    window.open(url, options?.replace ? '_self' : '_blank');

/** If service worker support is unavailable, use a fallback caching strategy for
 * domain images. When service worker is enabled, utilize abort message passing to
 * correctly abort intercepted fetch requests. */
const getDomainImageFactory = (sw: ServiceWorkerContextValue): PassCoreContextValue['getDomainImage'] => {
    const cache = new Map<string, Maybe<string>>();
    return async (domain, signal) => {
        const url = `core/v4/images/logo?Domain=${domain}&Size=32&Mode=light&MaxScaleUpFactor=4`;

        const cachedImage = cache.get(url);
        if (cachedImage) return cachedImage;

        const baseUrl = `${config.API_URL}/${url}`;
        const requestUrl = (/^https?:\/\//.test(baseUrl) ? baseUrl : new URL(baseUrl, document.baseURI)).toString();
        signal.onabort = () => sw.send({ type: 'abort', requestUrl });

        /* Forward the abort signal to the service worker. */
        return api<Response>({ url, output: 'raw', signal })
            .then(async (res) => {
                const dataURL = await imageResponsetoDataURL(res);
                if (!sw.enabled) cache.set(url, dataURL);
                return dataURL;
            })
            .catch(noop);
    };
};

const openSettings: PassCoreContextValue['openSettings'] = (page) =>
    history.push({
        pathname: getLocalPath('settings'),
        search: location.search,
        hash: page,
    });

const exportData: PassCoreContextValue['exportData'] = async (options) => {
    const state = store.getState();
    const data = selectExportData({ config, encrypted: options.encrypted })(state);
    return transferableToFile(await createPassExport(data, options));
};

export const App = () => (
    <ServiceWorkerProvider>
        <ServiceWorkerContext.Consumer>
            {(sw) => (
                <PassCoreProvider
                    config={PASS_CONFIG}
                    endpoint="web"
                    exportData={exportData}
                    generateOTP={generateOTP}
                    getDomainImage={getDomainImageFactory(sw)}
                    i18n={i18n}
                    onLink={onLink}
                    onboardingAcknowledge={onboarding.acknowledge}
                    onboardingCheck={pipe(onboarding.checkMessage, prop('enabled'))}
                    onTelemetry={telemetry.push}
                    openSettings={openSettings}
                    prepareImport={prepareImport}
                    getLogs={logStore.read}
                    writeToClipboard={(value) => navigator.clipboard.writeText(value)}
                >
                    <CompatibilityCheck>
                        <Icons />
                        <ThemeProvider />
                        <ErrorBoundary component={<StandardErrorPage big />}>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <PassExtensionLink>
                                        <ClientProvider>
                                            <ClientContext.Consumer>
                                                {({ state: { loggedIn } }) => (
                                                    <Router history={history}>
                                                        <NavigationProvider>
                                                            <AuthServiceProvider>
                                                                <StoreProvider>
                                                                    <Localized>
                                                                        <Route
                                                                            path="*"
                                                                            render={() =>
                                                                                loggedIn ? <Main /> : <Lobby />
                                                                            }
                                                                        />
                                                                    </Localized>
                                                                    <Portal>
                                                                        <ModalsChildren />
                                                                        <NotificationsChildren />
                                                                    </Portal>
                                                                </StoreProvider>
                                                            </AuthServiceProvider>
                                                        </NavigationProvider>
                                                    </Router>
                                                )}
                                            </ClientContext.Consumer>
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
