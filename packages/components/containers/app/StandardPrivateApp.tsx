import React, { useState, useRef, useEffect } from 'react';
import { UserModel, UserSettingsModel } from 'proton-shared/lib/models';
import { unique } from 'proton-shared/lib/helpers/array';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';
import { loadModels } from 'proton-shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from 'proton-shared/lib/openpgp';
import { Model } from 'proton-shared/lib/interfaces/Model';
import { UserSettings as tsUserSettings } from 'proton-shared/lib/interfaces';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { getApiErrorMessage, getIs401Error } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { traceError } from 'proton-shared/lib/helpers/sentry';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';

import { useApi, useCache, useNotifications } from '../../hooks';

import LoaderPage from './LoaderPage';
import ForceRefreshProvider from '../forceRefresh/Provider';

import loadEventID from './loadEventID';
import StandardLoadError from './StandardLoadError';
import { EventManagerProvider, EventModelListener, EventNotices } from '../eventManager';
import { ModalsChildren } from '../modals';
import { ThemeInjector } from '../themes';
import { DensityInjector } from '../layouts';
import { ContactProvider } from '../contacts';
import ReadableMemberKeyActivation from './ReadableMemberKeyActivation';
import PrivateMemberKeyGeneration from './PrivateMemberKeyGeneration';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cache = useCache();
    const { createNotification } = useNotifications();

    useEffect(() => {
        const eventManagerPromise = loadEventID(silentApi, cache).then((eventID) => {
            eventManagerRef.current = createEventManager({ api: silentApi, eventID });
        });

        const modelsPromise = loadModels(unique([UserSettingsModel, UserModel, ...preloadModels]), {
            api: silentApi,
            cache,
        }).then(async (result: any) => {
            const [userSettings] = result as [tsUserSettings];
            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        Promise.all([eventManagerPromise, modelsPromise, onInit?.(), loadOpenPGP(openpgpConfig)])
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
                {hasPrivateMemberKeyGeneration && <PrivateMemberKeyGeneration />}
                {hasReadableMemberKeyActivation && <ReadableMemberKeyActivation />}
                {!noModals && <ModalsChildren />}
                <ForceRefreshProvider>{children}</ForceRefreshProvider>
            </ContactProvider>
        </EventManagerProvider>
    );
};

export default StandardPrivateApp;
