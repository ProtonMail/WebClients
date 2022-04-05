import { FunctionComponent, ReactNode, useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import { UserModel, UserSettingsModel } from '@proton/shared/lib/models';
import { unique } from '@proton/shared/lib/helpers/array';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { loadModels } from '@proton/shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { Model } from '@proton/shared/lib/interfaces/Model';
import { User, UserSettings, UserType } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { APPS, REQUIRES_INTERNAL_EMAIL_ADDRESS, REQUIRES_NONDELINQUENT } from '@proton/shared/lib/constants';
import { getFeatures } from '@proton/shared/lib/api/features';

import { useApi, useCache, useConfig } from '../../hooks';

import {
    CalendarModelEventManagerProvider,
    EventManagerProvider,
    EventModelListener,
    EventNotices,
} from '../eventManager';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { ModalsChildren } from '../modals';
import { ThemeInjector } from '../themes';
import { DensityInjector } from '../layouts';
import { ContactProvider } from '../contacts';
import { Feature, FeatureCode, FeaturesProvider } from '../features';
import { useAppLink } from '../../components';
import { handleEarlyAccessDesynchronization } from '../../helpers/earlyAccessDesynchronization';

import loadEventID from './loadEventID';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import KeyBackgroundManager from './KeyBackgroundManager';
import StorageListener from './StorageListener';
import DelinquentContainer from './DelinquentContainer';
import { clearAutomaticErrorRefresh, handleAutomaticErrorRefresh } from './errorRefresh';

interface Props<T, M extends Model<T>, E, EvtM extends Model<E>> {
    locales?: TtagLocaleMap;
    onInit?: () => void;
    onLogout: () => void;
    fallback?: ReactNode;
    openpgpConfig?: any;
    preloadModels?: M[];
    eventModels?: EvtM[];
    noModals?: boolean;
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    hasMemberKeyMigration?: boolean;
    app: () => Promise<{ default: FunctionComponent }>;
}

const StandardPrivateApp = <T, M extends Model<T>, E, EvtM extends Model<E>>({
    locales = {},
    onLogout,
    onInit,
    fallback,
    openpgpConfig,
    preloadModels = [],
    eventModels = [],
    noModals = false,
    hasPrivateMemberKeyGeneration = false,
    hasReadableMemberKeyActivation = false,
    hasMemberKeyMigration = false,
    app: appFactory,
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

    useEffect(() => {
        const eventManagerPromise = loadEventID(silentApi, cache).then((eventID) => {
            eventManagerRef.current = createEventManager({ api: silentApi, eventID });
        });

        const loadModelsArgs = {
            api: silentApi,
            cache,
        };

        const hasInternalEmailAddressRequirement = REQUIRES_INTERNAL_EMAIL_ADDRESS.includes(APP_NAME);

        const featuresPromise = silentApi<{ Features: Feature[] }>(getFeatures([FeatureCode.EarlyAccessScope]));

        const models = unique([UserSettingsModel, UserModel, ...preloadModels]);

        let earlyAccessRefresher: undefined | (() => void);
        let shouldSetupInternalAddress = false;

        const setupPromise = loadModels(models, loadModelsArgs).then((result: any) => {
            const [userSettings, user] = result as [UserSettings, User];

            const hasNonDelinquentRequirement = REQUIRES_NONDELINQUENT.includes(APP_NAME);
            const hasNonDelinquentScope = getHasNonDelinquentScope(user);
            hasDelinquentBlockRef.current = hasNonDelinquentRequirement && !hasNonDelinquentScope;

            shouldSetupInternalAddress = hasInternalEmailAddressRequirement && user.Type === UserType.EXTERNAL;

            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                featuresPromise.then(async ({ Features }) => {
                    const [earlyAccessScope] = Features;
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

        let ignoreError = false;
        const handleUnload = () => {
            ignoreError = true;
        };
        // In Firefox, navigation events cancel ongoing network requests. This triggers the error handler and error
        // screen to be displayed. We set up a 'beforeunload' listener to detect those types of events to not
        // unnecessarily show those errors as fatal errors, and keep showing the loader screen instead.
        window.addEventListener('beforeunload', handleUnload);
        const clearBeforeUnload = () => window.removeEventListener('beforeunload', handleUnload);

        Promise.all([eventManagerPromise, setupPromise, onInit?.(), loadOpenPGP(openpgpConfig), appPromise])
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
                    clearAutomaticErrorRefresh();
                    clearBeforeUnload();
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (getIs401Error(error)) {
                    return onLogout();
                }

                const handleError = (error: any) => {
                    if (handleAutomaticErrorRefresh(error) || ignoreError) {
                        return;
                    }
                    setError({
                        message: getApiErrorMessage(error) || error?.message || c('Error').t`Unknown error`,
                    });
                };

                // We add an arbitrary timeout in handling the error to avoid errors that are due to page navigations.
                // This allows the beforeunload handler to trigger first.
                setTimeout(() => handleError(error), 2500);
            });

        return () => {
            destroyOpenPGP();
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
                    <FeaturesProvider>
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
                    </FeaturesProvider>
                </ContactProvider>
            </CalendarModelEventManagerProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
