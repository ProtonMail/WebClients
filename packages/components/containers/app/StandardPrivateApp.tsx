import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import React, { useState, useRef, useEffect, FunctionComponent } from 'react';
import { AddressesModel, UserModel, UserSettingsModel } from '@proton/shared/lib/models';
import { unique } from '@proton/shared/lib/helpers/array';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { loadModels } from '@proton/shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { Model } from '@proton/shared/lib/interfaces/Model';
import { Address, User as tsUser, UserSettings as tsUserSettings } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { APPS, REQUIRES_INTERNAL_EMAIL_ADDRESS, REQUIRES_NONDELINQUENT } from '@proton/shared/lib/constants';
import { getHasOnlyExternalAddresses } from '@proton/shared/lib/helpers/address';

import { useApi, useCache, useConfig, useErrorHandler } from '../../hooks';

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

import loadEventID from './loadEventID';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import KeyBackgroundManager from './KeyBackgroundManager';
import StorageListener from './StorageListener';
import DelinquentContainer from './DelinquentContainer';
import { FeaturesProvider } from '../features';
import { useAppLink } from '../../components';

interface Props<T, M extends Model<T>, E, EvtM extends Model<E>> {
    locales?: TtagLocaleMap;
    onInit?: () => void;
    onLogout: () => void;
    fallback?: React.ReactNode;
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
    const errorHandler = useErrorHandler();
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

        const addressesPromise = hasInternalEmailAddressRequirement
            ? loadModels([AddressesModel], loadModelsArgs)
            : undefined;

        const hasOnlyExternalAddressesPromise = addressesPromise?.then((result: any) => {
            const [Addresses] = result as [Address[]];
            return hasInternalEmailAddressRequirement && Addresses?.length && getHasOnlyExternalAddresses(Addresses);
        });

        const models = unique([UserSettingsModel, UserModel, ...preloadModels]);
        const filteredModels = addressesPromise ? models.filter((model) => model !== AddressesModel) : models;

        const modelsPromise = loadModels(filteredModels, loadModelsArgs).then((result: any) => {
            const [userSettings, user] = result as [tsUserSettings, tsUser];

            const hasNonDelinquentRequirement = REQUIRES_NONDELINQUENT.includes(APP_NAME);
            const hasNonDelinquentScope = getHasNonDelinquentScope(user);
            hasDelinquentBlockRef.current = hasNonDelinquentRequirement && !hasNonDelinquentScope;

            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        const appPromise = appFactory().then((result) => {
            appRef.current = result.default;
        });

        Promise.all([
            hasOnlyExternalAddressesPromise,
            eventManagerPromise,
            modelsPromise,
            addressesPromise,
            onInit?.(),
            loadOpenPGP(openpgpConfig),
            appPromise,
        ])
            .then(([hasOnlyExternalAddresses]) => {
                if (hasOnlyExternalAddresses) {
                    appLink(`/setup-internal-address?app=${APP_NAME}`, APPS.PROTONACCOUNT);
                } else {
                    setLoading(false);
                }
            })
            .catch((e) => {
                if (getIs401Error(e)) {
                    return onLogout();
                }
                errorHandler(e);
                setError({
                    message: getApiErrorMessage(e),
                });
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
