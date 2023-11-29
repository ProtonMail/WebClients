import { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react';

import { useUnleashClient } from '@protontech/proxy-client-react';
import { c } from 'ttag';

import { Feature, FeatureCode } from '@proton/features';
import metrics from '@proton/metrics';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { requiresNonDelinquent } from '@proton/shared/lib/authentication/apps';
import { APPS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import { destroyCryptoWorker, loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { User, UserSettings } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getIsSSOVPNOnlyAccount, getRequiresAddressSetup } from '@proton/shared/lib/keys';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { useAppLink } from '../../components/link';
import { handleEarlyAccessDesynchronization } from '../../helpers/earlyAccessDesynchronization';
import { WELCOME_FLAGS_CACHE_KEY, getWelcomeFlagsValue, useCache, useConfig, useIsInboxElectronApp } from '../../hooks';
import SessionRecoveryLocalStorageManager from '../account/sessionRecovery/SessionRecoveryLocalStorageManager';
import { getCryptoWorkerOptions } from '../app/cryptoWorkerOptions';
import { ContactProvider } from '../contacts';
import { EventManagerProvider, EventModelListener, EventNotices } from '../eventManager';
import { CalendarModelEventManagerProvider } from '../eventManager/calendar';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { KeyTransparencyManager } from '../keyTransparency';
import { DensityInjector } from '../layouts';
import { ModalsChildren } from '../modals';
import ThemeInjector from '../themes/ThemeInjector';
import { UnleashFlagProvider, useFlagsReady } from '../unleash';
import DelinquentContainer from './DelinquentContainer';
import ElectronBlockedContainer from './ElectronBlockedContainer';
import KeyBackgroundManager from './KeyBackgroundManager';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import StorageListener from './StorageListener';
import { wrapUnloadError } from './errorRefresh';

interface Props {
    locales?: TtagLocaleMap;
    onPreload?: () => void;
    onInit: () => Promise<{
        user: User;
        userSettings: UserSettings;
        eventManager: ReturnType<typeof createEventManager>;
        features: { [key in FeatureCode]?: Feature };
    }>;
    onLogout: () => void;
    loader: ReactNode;
    eventModels?: any[];
    noModals?: boolean;
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    hasMemberKeyMigration?: boolean;
    app: () => Promise<{ default: FunctionComponent }>;
    eventQuery?: (eventID: string) => object;
}

const InnerStandardPrivateApp = ({
    locales = {},
    onLogout,
    onPreload,
    onInit,
    loader,
    eventModels = [],
    noModals = false,
    hasPrivateMemberKeyGeneration = false,
    hasReadableMemberKeyActivation = false,
    hasMemberKeyMigration = false,
    app: appFactory,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const cache = useCache();
    const appRef = useRef<FunctionComponent | null>(null);
    const hasDelinquentBlockRef = useRef(false);
    const appLink = useAppLink();
    const flagsReadyPromise = useFlagsReady();
    const { isElectronDisabled } = useIsInboxElectronApp();
    const client = useUnleashClient();

    useEffect(() => {
        const initPromise = onInit();

        let earlyAccessRefresher: undefined | (() => void);
        let redirect: false | 'setup-address' | 'account/vpn' = false;

        const eventManagerPromise = initPromise.then(({ eventManager }) => {
            eventManagerRef.current = eventManager;
            return eventManagerRef.current;
        });

        const setupInitPromise = initPromise.then(({ user }) => {
            const hasNonDelinquentRequirement = requiresNonDelinquent.includes(APP_NAME);
            const hasNonDelinquentScope = getHasNonDelinquentScope(user);
            hasDelinquentBlockRef.current = hasNonDelinquentRequirement && !hasNonDelinquentScope;

            redirect = (() => {
                if (getRequiresAddressSetup(APP_NAME, user)) {
                    return 'setup-address' as const;
                }
                if (
                    getIsSSOVPNOnlyAccount(user) &&
                    ![APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS].includes(APP_NAME as any)
                ) {
                    return 'account/vpn' as const;
                }
                return false;
            })();
        });

        const setupPromise = initPromise.then(({ userSettings, features }) => {
            cache.set(WELCOME_FLAGS_CACHE_KEY, getWelcomeFlagsValue(userSettings));

            setSentryEnabled(!!userSettings.CrashReports);
            setMetricsEnabled(!!userSettings.Telemetry);
            metrics.setReportMetrics(!!userSettings.Telemetry);

            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);

            earlyAccessRefresher = handleEarlyAccessDesynchronization({
                userSettings,
                earlyAccessScope: features[FeatureCode.EarlyAccessScope],
                appName: APP_NAME,
            });

            return Promise.all([
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        const appPromise = appFactory().then((result) => {
            appRef.current = result.default;
        });
        const preloadPromise = onPreload?.();

        const run = async () => {
            const promises = [
                initPromise,
                eventManagerPromise,
                setupPromise,
                preloadPromise,
                appPromise,
                flagsReadyPromise,
            ];

            try {
                await setupInitPromise;
                await Promise.all(promises);
                await loadCryptoWorker(
                    getCryptoWorkerOptions(APP_NAME, {
                        checkEdDSAFaultySignatures: client.isEnabled('EdDSAFaultySignatureCheck'),
                        v6Canary: client.isEnabled('CryptoCanaryOpenPGPjsV6'),
                    })
                );
            } catch (error) {
                if (getIs401Error(error)) {
                    // Trigger onLogout early, ignoring the unload wrapper
                    onLogout();
                    await new Promise(noop);
                }
                throw error;
            } finally {
                // The Version cookie is set on each request. This causes race-conditions between with what the client
                // has set it to and what the API is replying with. Old API requests with old cookies may finish after
                // the refresh has happened which resets the Version cookie, causing assets to fail loading.
                // Here we explicitly wait for all requests to finish loading before triggering the refresh.
                if (earlyAccessRefresher) {
                    await Promise.allSettled(promises);
                    earlyAccessRefresher();
                    await new Promise(noop);
                }
                if (redirect === 'setup-address') {
                    appLink(`${SETUP_ADDRESS_PATH}?to=${APP_NAME}`, APPS.PROTONACCOUNT);
                    await new Promise(noop);
                }
                if (redirect === 'account/vpn') {
                    appLink('/vpn', APPS.PROTONACCOUNT);
                    await new Promise(noop);
                }
            }
        };

        wrapUnloadError(run())
            .then(() => {
                setLoading(false);
            })
            .catch((error) => {
                setError({
                    message: getApiErrorMessage(error) || error?.message || c('Error').t`Unknown error`,
                });
            });

        return () => {
            void destroyCryptoWorker();
        };
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const LoadedApp = appRef.current;

    if (loading || !eventManagerRef.current || LoadedApp === null) {
        return (
            <>
                <ModalsChildren />
                {loader}
            </>
        );
    }

    if (hasDelinquentBlockRef.current) {
        return <DelinquentContainer />;
    }

    if (isElectronDisabled) {
        return <ElectronBlockedContainer />;
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <CalendarModelEventManagerProvider>
                <ContactProvider>
                    <KeyTransparencyManager appName={APP_NAME}>
                        <SessionRecoveryLocalStorageManager>
                            <EventModelListener models={eventModels} />
                            <EventNotices />
                            <ThemeInjector />
                            <DensityInjector />
                            {!noModals && <ModalsChildren />}
                            <KeyBackgroundManager
                                hasPrivateMemberKeyGeneration={hasPrivateMemberKeyGeneration}
                                hasReadableMemberKeyActivation={hasReadableMemberKeyActivation}
                                hasMemberKeyMigration={hasMemberKeyMigration}
                            />
                            <StorageListener />
                            <ForceRefreshProvider>
                                <LoadedApp />
                            </ForceRefreshProvider>
                        </SessionRecoveryLocalStorageManager>
                    </KeyTransparencyManager>
                </ContactProvider>
            </CalendarModelEventManagerProvider>
        </EventManagerProvider>
    );
};

const StandardPrivateApp = (props: Props) => {
    return (
        <UnleashFlagProvider>
            <InnerStandardPrivateApp {...props} />
        </UnleashFlagProvider>
    );
};

export default StandardPrivateApp;
