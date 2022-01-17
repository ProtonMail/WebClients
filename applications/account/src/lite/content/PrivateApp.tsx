import { useState, useEffect, useRef, ReactNode } from 'react';
import { UserModel, UserSettingsModel } from '@proton/shared/lib/models';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { getLatestID } from '@proton/shared/lib/api/events';
import { loadModels } from '@proton/shared/lib/models/helper';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { User, UserSettings } from '@proton/shared/lib/interfaces';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';

import {
    FeaturesProvider,
    EventManagerProvider,
    StandardLoadErrorPage,
    ModalsChildren,
    useApi,
    useCache,
    LoaderPage,
    useErrorHandler,
} from '@proton/components';

interface Props {
    locales?: TtagLocaleMap;
    onLogout: () => void;
    openpgpConfig?: any;
    noModals?: boolean;
    children: ReactNode;
}

const PrivateApp = ({ locales = {}, onLogout, openpgpConfig, noModals = false, children }: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const cache = useCache();
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const loadModelsArgs = {
            api: silentApi,
            cache,
        };

        const eventManagerPromise = silentApi<{ EventID: string }>(getLatestID())
            .then(({ EventID }) => EventID)
            .then((eventID) => {
                eventManagerRef.current = createEventManager({ api: silentApi, eventID });
            });

        const models = [UserModel, UserSettingsModel];

        const modelsPromise = loadModels(models, loadModelsArgs).then((result: any) => {
            const [userSettings] = result as [UserSettings, User];

            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
            return Promise.all([
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale, userSettings),
            ]);
        });

        Promise.all([eventManagerPromise, modelsPromise, loadOpenPGP(openpgpConfig)])
            .then(() => {
                setLoading(false);
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

    if (loading || !eventManagerRef.current) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <FeaturesProvider>
                {!noModals && <ModalsChildren />}
                {children}
            </FeaturesProvider>
        </EventManagerProvider>
    );
};

export default PrivateApp;
