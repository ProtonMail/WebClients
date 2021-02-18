import React, { useState, useRef, useEffect, FunctionComponent } from 'react';
import { AddressesModel, UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { unique } from 'proton-shared/lib/helpers/array';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { loadModels } from 'proton-shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from 'proton-shared/lib/openpgp';
import { Model } from 'proton-shared/lib/interfaces/Model';
import { Address, User as tsUser, UserSettings as tsUserSettings } from 'proton-shared/lib/interfaces';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { getIs401Error } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';
import { REQUIRES_INTERNAL_EMAIL_ADDRESS, REQUIRES_NONDELINQUENT, UNPAID_STATE } from 'proton-shared/lib/constants';
import { getHasOnlyExternalAddresses } from 'proton-shared/lib/helpers/address';

import { useApi, useCache, useConfig, useErrorHandler } from '../../hooks';

import { EventManagerProvider, EventModelListener, EventNotices } from '../eventManager';
import ForceRefreshProvider from '../forceRefresh/Provider';
import { ModalsChildren } from '../modals';
import { ThemeInjector } from '../themes';
import { DensityInjector } from '../layouts';
import { ContactProvider } from '../contacts';

import loadEventID from './loadEventID';
import LoaderPage from './LoaderPage';
import StandardLoadError from './StandardLoadError';
import KeyBackgroundManager from './KeyBackgroundManager';
import InternalEmailAddressGeneration from './InternalEmailAddressGeneration';
import StorageListener from './StorageListener';
import DelinquentContainer from './DelinquentContainer';
import { FeaturesProvider } from '../features';

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
    app: appFactory,
}: Props<T, M, E, EvtM>) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cache = useCache();
    const errorHandler = useErrorHandler();
    const onceRef = useRef<{ externalEmailAddress: Address } | undefined>();
    const appRef = useRef<FunctionComponent | null>(null);
    const hasDelinquentBlockRef = useRef(false);

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
            ? loadModels([AddressesModel], loadModelsArgs).then((result: any) => {
                  const [Addresses] = result as [Address[]];
                  if (Addresses?.length && getHasOnlyExternalAddresses(Addresses)) {
                      onceRef.current = {
                          externalEmailAddress: Addresses[0],
                      };
                  }
              })
            : undefined;

        const models = unique([UserSettingsModel, UserModel, ...preloadModels]);
        const filteredModels = addressesPromise ? models.filter((model) => model !== AddressesModel) : models;

        const modelsPromise = loadModels(filteredModels, loadModelsArgs).then((result: any) => {
            const [userSettings, user] = result as [tsUserSettings, tsUser];

            const hasNonDelinquentRequirement = REQUIRES_NONDELINQUENT.includes(APP_NAME);
            const hasNonDelinquentScope = user.Delinquent < UNPAID_STATE.DELINQUENT;
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
            eventManagerPromise,
            modelsPromise,
            addressesPromise,
            onInit?.(),
            loadOpenPGP(openpgpConfig),
            appPromise,
        ])
            .then(() => {
                setLoading(false);
            })
            .catch((e) => {
                if (getIs401Error(e)) {
                    return onLogout();
                }
                errorHandler(e);
                setError(true);
            });

        return () => {
            destroyOpenPGP();
        };
    }, []);

    if (error) {
        return <StandardLoadError />;
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
            <ContactProvider>
                <FeaturesProvider>
                    <EventModelListener models={eventModels} />
                    <EventNotices />
                    <ThemeInjector />
                    <DensityInjector />
                    {!noModals && <ModalsChildren />}
                    <InternalEmailAddressGeneration externalEmailAddress={onceRef.current?.externalEmailAddress}>
                        <KeyBackgroundManager
                            hasPrivateMemberKeyGeneration={hasPrivateMemberKeyGeneration}
                            hasReadableMemberKeyActivation={hasReadableMemberKeyActivation}
                        />
                        <StorageListener />
                        <ForceRefreshProvider>
                            <LoadedApp />
                        </ForceRefreshProvider>
                    </InternalEmailAddressGeneration>
                </FeaturesProvider>
            </ContactProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
