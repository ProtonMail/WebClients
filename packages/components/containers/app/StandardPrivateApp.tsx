import { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { getCryptoWorkerOptions } from '@proton/components/containers/app/cryptoWorkerOptions';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS, REQUIRES_INTERNAL_EMAIL_ADDRESS, REQUIRES_NONDELINQUENT } from '@proton/shared/lib/constants';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { setSentryEnabled } from '@proton/shared/lib/helpers/sentry';
import { destroyCryptoWorker, loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { User, UserSettings, UserType } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { Model } from '@proton/shared/lib/interfaces/Model';
import { UserModel, UserSettingsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
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
import { ContactProvider } from '../contacts';
import {
    CalendarModelEventManagerProvider,
    EventManagerProvider,
    EventModelListener,
    EventNotices,
} from '../eventManager';
import { FeatureCode } from '../features';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { DensityInjector } from '../layouts';
import { ModalsChildren } from '../modals';
import { ThemeInjector } from '../themes';
import DelinquentContainer from './DelinquentContainer';
import KeyBackgroundManager from './KeyBackgroundManager';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import StorageListener from './StorageListener';
import { wrapUnloadError } from './errorRefresh';
import loadEventID from './loadEventID';

interface Props<T, M extends Model<T>, E, EvtM extends Model<E>> {
    locales?: TtagLocaleMap;
    onInit?: () => void;
    onLogout: () => void;
    fallback?: ReactNode;
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
    fallback,
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

        const hasInternalEmailAddressRequirement = REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(APP_NAME);

        const featuresPromise = getFeature([FeatureCode.EarlyAccessScope, ...preloadFeatures]);

        const models = unique([UserSettingsModel, UserModel, ...preloadModels]);

        let earlyAccessRefresher: undefined | (() => void);
        let shouldSetupInternalAddress = false;

        const setupPromise = loadModels(models, loadModelsArgs).then((result: any) => {
            const [userSettings, user] = result as [UserSettings, User];

            cache.set(WELCOME_FLAGS_CACHE_KEY, getWelcomeFlagsValue(userSettings));

            setSentryEnabled(!!userSettings.CrashReports);
            setMetricsEnabled(!!userSettings.Telemetry);

            const hasNonDelinquentRequirement = REQUIRES_NONDELINQUENT.includes(APP_NAME);
            const hasNonDelinquentScope = getHasNonDelinquentScope(user);
            hasDelinquentBlockRef.current = hasNonDelinquentRequirement && !hasNonDelinquentScope;

            shouldSetupInternalAddress = hasInternalEmailAddressRequirement && user.Type === UserType.EXTERNAL;

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

        const run = () => {
            return Promise.all([
                eventManagerPromise,
                setupPromise,
                onInit?.(),
                loadCryptoWorker(getCryptoWorkerOptions(APP_NAME)),
                appPromise,
            ]).catch((error) => {
                if (getIs401Error(error)) {
                    // Trigger onLogout early, ignoring the unload wrapper
                    onLogout();
                }
                throw error;
            });
        };

        wrapUnloadError(run())
            .then(() => {
                // The Version cookie is set on each request. This causes race-conditions between with what the client
                // has set it to and what the API is replying with. Old API requests with old cookies may finish after
                // the refresh has happened which resets the Version cookie, causing assets to fail loading.
                // Here we explicitly wait for all requests to finish loading before triggering the refresh.
                if (earlyAccessRefresher) {
                    earlyAccessRefresher();
                    return;
                }
                if (shouldSetupInternalAddress) {
                    appLink(`/setup-internal-address?app=${APP_NAME}`, APPS.PROTONACCOUNT);
                } else {
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (getIs401Error(error)) {
                    return;
                }
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
                {fallback || <LoaderPage />}
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
                </ContactProvider>
            </CalendarModelEventManagerProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
