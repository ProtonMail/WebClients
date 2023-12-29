import { Route, Router } from 'react-router-dom';

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
import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import { PassCoreProvider } from '@proton/pass/components/Core/PassCoreProvider';
import { getLocalPath, history } from '@proton/pass/components/Core/routing';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { createPassExport } from '@proton/pass/lib/export/export';
import { prepareImport } from '@proton/pass/lib/import/reader';
import { generateTOTPCode } from '@proton/pass/lib/otp/otp';
import { selectExportData } from '@proton/pass/store/selectors/export';
import type { Maybe } from '@proton/pass/types';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';

import { PASS_CONFIG, api } from '../lib/core';
import { onboarding } from '../lib/onboarding';
import { telemetry } from '../lib/telemetry';
import { AuthServiceProvider } from './Context/AuthServiceProvider';
import { ClientContext, ClientProvider } from './Context/ClientProvider';
import type { ServiceWorkerContextValue } from './ServiceWorker/ServiceWorkerProvider';
import { ServiceWorkerContext, ServiceWorkerProvider } from './ServiceWorker/ServiceWorkerProvider';
import { StoreProvider } from './Store/StoreProvider';
import { store } from './Store/store';
import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';
import * as config from './config';

import './app.scss';

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
        return api<Response>({ url, output: 'raw', signal }).then(async (res) => {
            const dataURL = await imageResponsetoDataURL(res);
            if (!sw.enabled) cache.set(url, dataURL);
            return dataURL;
        });
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

export const App = () => {
    return (
        <ServiceWorkerProvider>
            <ServiceWorkerContext.Consumer>
                {(sw) => (
                    <PassCoreProvider
                        endpoint="web"
                        config={PASS_CONFIG}
                        exportData={exportData}
                        generateOTP={generateOTP}
                        getDomainImage={getDomainImageFactory(sw)}
                        onLink={onLink}
                        onOnboardingAck={onboarding.acknowledge}
                        onTelemetry={telemetry.push}
                        openSettings={openSettings}
                        prepareImport={prepareImport}
                    >
                        <CompatibilityCheck>
                            <Icons />
                            <ThemeProvider />
                            <ErrorBoundary component={<StandardErrorPage big />}>
                                <NotificationsProvider>
                                    <ModalsProvider>
                                        <ClientProvider>
                                            <ClientContext.Consumer>
                                                {({ state: { loggedIn } }) => (
                                                    <Router history={history}>
                                                        <NavigationProvider>
                                                            <AuthServiceProvider>
                                                                <StoreProvider>
                                                                    <Route
                                                                        path="*"
                                                                        render={() => (loggedIn ? <Main /> : <Lobby />)}
                                                                    />
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
                                    </ModalsProvider>
                                </NotificationsProvider>
                            </ErrorBoundary>
                        </CompatibilityCheck>
                    </PassCoreProvider>
                )}
            </ServiceWorkerContext.Consumer>
        </ServiceWorkerProvider>
    );
};
