import React, { useState, useRef, useEffect } from 'react';
import { AddressesModel, UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { unique } from 'proton-shared/lib/helpers/array';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { loadModels } from 'proton-shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from 'proton-shared/lib/openpgp';
import { Model } from 'proton-shared/lib/interfaces/Model';
import { Address, UserSettings as tsUserSettings } from 'proton-shared/lib/interfaces';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { getApiErrorMessage, getIs401Error } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { traceError } from 'proton-shared/lib/helpers/sentry';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';
import { REQUIRES_INTERNAL_EMAIL_ADDRESS } from 'proton-shared/lib/constants';
import { getHasOnlyExternalAddresses } from 'proton-shared/lib/helpers/address';

import { useApi, useCache, useConfig, useNotifications } from '../../hooks';

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

interface Props<T, M extends Model<T>, E, EvtM extends Model<E>> {
    locales?: TtagLocaleMap;
    onInit?: () => void;
    onLogout: () => void;
    fallback?: React.ReactNode;
    openpgpConfig?: object;
    preloadModels?: M[];
    eventModels?: EvtM[];
    noModals?: boolean;
    hasPrivateMemberKeyGeneration?: boolean;
    hasReadableMemberKeyActivation?: boolean;
    children: React.ReactNode;
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
    children,
}: Props<T, M, E, EvtM>) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cache = useCache();
    const { createNotification } = useNotifications();
    const onceRef = useRef<{ externalEmailAddress: Address } | undefined>();

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
            const [userSettings] = result as [tsUserSettings];
            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        Promise.all([eventManagerPromise, modelsPromise, addressesPromise, onInit?.(), loadOpenPGP(openpgpConfig)])
            .then(() => {
                setLoading(false);
            })
            .catch((e) => {
                if (getIs401Error(e)) {
                    return onLogout();
                }
                const errorMessage = getApiErrorMessage(e) || 'Unknown error';
                createNotification({ type: 'error', text: errorMessage });
                console.error(e);
                traceError(e);
                setError(true);
            });

        return () => {
            destroyOpenPGP();
        };
    }, []);

    if (error) {
        return <StandardLoadError />;
    }

    if (loading || !eventManagerRef.current) {
        return (
            <>
                <ModalsChildren />
                {fallback || <LoaderPage />}
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <ContactProvider>
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
                    <ForceRefreshProvider>{children}</ForceRefreshProvider>
                </InternalEmailAddressGeneration>
            </ContactProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
