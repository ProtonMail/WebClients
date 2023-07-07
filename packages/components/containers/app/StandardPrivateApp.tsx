import { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

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
import { Model } from '@proton/shared/lib/interfaces/Model';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';
import { UserModel, UserSettingsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import { useAppLink } from '../../components';
import { handleEarlyAccessDesynchronization } from '../../helpers/earlyAccessDesynchronization';
import {
    WELCOME_FLAGS_CACHE_KEY,
    getWelcomeFlagsValue,
    useApi,
    useCache,
    useConfig,
    useLoadFeature,
} from '../../hooks';
import { getCryptoWorkerOptions } from '../app/cryptoWorkerOptions';
import { ContactProvider } from '../contacts';
import { EventManagerProvider, EventModelListener, EventNotices } from '../eventManager';
import { CalendarModelEventManagerProvider } from '../eventManager/calendar';
import { FeatureCode } from '../features';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { KeyTransparencyManager } from '../keyTransparency';
import { DensityInjector } from '../layouts';
import { ModalsChildren } from '../modals';
import ThemeInjector from '../themes/ThemeInjector';
import DelinquentContainer from './DelinquentContainer';
import KeyBackgroundManager from './KeyBackgroundManager';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import StorageListener from './StorageListener';
import { wrapUnloadError } from './errorRefresh';
import loadEventID from './loadEventID';

interface Props<T, M extends Model<T>, E, EvtM extends Model<E>> {
    locales?: TtagLocaleMap;
    onInit?: () => void;
    onUserSettings?: (userSettings: UserSettings) => void;
    onLogout: () => void;
    loader: ReactNode;
    preloadModels?: M[];
    preloadFeatures?: FeatureCode[];
    eventModels?: EvtM[];
    noModals?: boolean;
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    hasMemberKeyMigration?: boolean;
    app: () => Promise<{ default: FunctionComponent }>;
    eventQuery?: (eventID: string) => object;
}

const StandardPrivateApp = <T, M extends Model<T>, E, EvtM extends Model<E>>({
    locales = {},
    onLogout,
    onInit,
    onUserSettings,
    loader,
    preloadModels = [],
    preloadFeatures = [],
    eventModels = [],
    noModals = false,
    hasPrivateMemberKeyGeneration = false,
    hasReadableMemberKeyActivation = false,
    hasMemberKeyMigration = false,
    app: appFactory,
    eventQuery,
}: Props<T, M, E, EvtM>) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cache = useCache();
    const appRef = useRef<FunctionComponent | null>(null);
    const hasDelinquentBlockRef = useRef(false);
    const appLink = useAppLink();
    const getFeature = useLoadFeature();

    useEffect(() => {
        const eventManagerPromise = loadEventID(silentApi, cache).then((eventID) => {
            eventManagerRef.current = createEventManager({ api: silentApi, eventID, query: eventQuery });
        });

        const loadModelsArgs = {
            api: silentApi,
            cache,
        };

        const featuresPromise = getFeature([FeatureCode.EarlyAccessScope, ...preloadFeatures]);

        let earlyAccessRefresher: undefined | (() => void);
        let shouldSetupAddress = false;

        const userModelPromise = loadModels([UserModel], loadModelsArgs).then((result: any) => {
            const [user] = result as [User];

            const hasNonDelinquentRequirement = requiresNonDelinquent.includes(APP_NAME);
            const hasNonDelinquentScope = getHasNonDelinquentScope(user);
            hasDelinquentBlockRef.current = hasNonDelinquentRequirement && !hasNonDelinquentScope;

            shouldSetupAddress = getRequiresAddressSetup(APP_NAME, user);
        });

        const models = unique([UserSettingsModel, ...preloadModels]).filter((model) => model !== UserModel);
        const setupPromise = loadModels(models, loadModelsArgs).then((result: any) => {
            const [userSettings] = result as [UserSettings];

            cache.set(WELCOME_FLAGS_CACHE_KEY, getWelcomeFlagsValue(userSettings));
            onUserSettings?.(userSettings);

            setSentryEnabled(!!userSettings.CrashReports);
            setMetricsEnabled(!!userSettings.Telemetry);
            metrics.setReportMetrics(!!userSettings.Telemetry);

            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                featuresPromise.then(async ([earlyAccessScope]) => {
                    earlyAccessRefresher = handleEarlyAccessDesynchronization({
                        userSettings,
                        earlyAccessScope,
                        appName: APP_NAME,
                    });
                }),
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        const appPromise = appFactory().then((result) => {
            appRef.current = result.default;
        });
        const initPromise = onInit?.();
        const cryptoWorkerPromise = loadCryptoWorker(getCryptoWorkerOptions(APP_NAME));

        const run = async () => {
            const promises = [eventManagerPromise, setupPromise, initPromise, cryptoWorkerPromise, appPromise];
            try {
                await userModelPromise;
                await Promise.all(promises);
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
                if (shouldSetupAddress) {
                    appLink(`${SETUP_ADDRESS_PATH}?to=${APP_NAME}`, APPS.PROTONACCOUNT);
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

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <CalendarModelEventManagerProvider>
                <ContactProvider>
                    <KeyTransparencyManager appName={APP_NAME}>
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
                    </KeyTransparencyManager>
                </ContactProvider>
            </CalendarModelEventManagerProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
