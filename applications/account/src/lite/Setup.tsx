import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
    EventManagerProvider,
    FeaturesProvider,
    ModalsChildren,
    StandardLoadErrorPage,
    useApi,
    useCache,
    useErrorHandler,
    useThemeQueryParameter,
} from '@proton/components';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { User, UserSettings } from '@proton/shared/lib/interfaces';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { pullForkSession, setCookies, setRefreshCookies } from '@proton/shared/lib/api/auth';
import { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import getRandomString from '@proton/utils/getRandomString';
import { locales } from '@proton/shared/lib/i18n/locales';
import { getGenericErrorPayload } from '@proton/shared/lib/broadcast';
import { getLatestID } from '@proton/shared/lib/api/events';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { loadModels } from '@proton/shared/lib/models/helper';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { loadOpenPGP } from '@proton/shared/lib/openpgp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { UserModel, UserSettingsModel } from '@proton/shared/lib/models';

import MainContainer from './content/MainContainer';
import broadcast, { MessageType } from './broadcast';

interface Props {
    onLogin: (UID: string) => void;
    UID?: string;
}

const Setup = ({ onLogin, UID }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);

    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const cache = useCache();

    useThemeQueryParameter();

    useEffect(() => {
        const setupFork = async (selector: string) => {
            const { UID, RefreshToken } = await silentApi<PullForkResponse>(pullForkSession(selector));
            const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } =
                await silentApi<RefreshSessionResponse>(withUIDHeaders(UID, setRefreshCookies({ RefreshToken })));
            await silentApi(
                withAuthHeaders(
                    UID,
                    newAccessToken,
                    setCookies({
                        Persistent: false,
                        UID,
                        RefreshToken: newRefreshToken,
                        State: getRandomString(24),
                    })
                )
            );

            return UID;
        };

        const setupApp = async (UID: string) => {
            const uidApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));

            const eventManagerPromise = uidApi<{ EventID: string }>(getLatestID())
                .then(({ EventID }) => EventID)
                .then((eventID) => {
                    eventManagerRef.current = createEventManager({ api: uidApi, eventID });
                });

            const modelsPromise = loadModels([UserSettingsModel, UserModel], {
                api: uidApi,
                cache,
            }).then((result: any) => {
                const [userSettings] = result as [UserSettings, User];
                const searchParams = new URLSearchParams(location.search);
                const languageParams = searchParams.get('language');
                const browserLocale = getBrowserLocale();
                const localeCode =
                    getClosestLocaleMatch(languageParams || '', locales) ||
                    getClosestLocaleCode(userSettings.Locale, locales);

                return Promise.all([
                    loadLocale(localeCode, locales),
                    loadDateLocale(localeCode, browserLocale, userSettings),
                ]);
            });

            await Promise.all([eventManagerPromise, modelsPromise, loadOpenPGP()]);

            flushSync(() => {
                onLogin(UID);
                setLoading(false);
                broadcast({ type: MessageType.LOADED });
            });
        };

        const handleSetupError = (error: any) => {
            broadcast({ type: MessageType.ERROR, payload: getGenericErrorPayload(error) });
            errorHandler(error);
            setError({
                message: getApiErrorMessage(error),
            });
        };

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const selector = hashParams.get('selector');
        hashParams.delete('selector');
        window.location.hash = hashParams.toString();

        if (selector) {
            setupFork(selector)
                .then((UID) => setupApp(UID))
                .catch(handleSetupError);
        } else if (UID) {
            setupApp(UID).catch(handleSetupError);
        } else {
            broadcast({ type: MessageType.ERROR, payload: { message: 'No selector found' } });
        }
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading || !eventManagerRef.current) {
        return <LoaderPage />;
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <FeaturesProvider>
                <ModalsChildren />
                <MainContainer />
            </FeaturesProvider>
        </EventManagerProvider>
    );
};

export default Setup;
