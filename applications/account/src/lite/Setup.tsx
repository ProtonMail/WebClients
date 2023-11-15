import { ReactNode, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import {
    EventManagerProvider,
    ModalsChildren,
    StandardLoadErrorPage,
    useApi,
    useCache,
    useErrorHandler,
    useThemeQueryParameter,
} from '@proton/components';
import { authJwt, pullForkSession, setCookies, setRefreshCookies } from '@proton/shared/lib/api/auth';
import { getLatestID } from '@proton/shared/lib/api/events';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { getGenericErrorPayload } from '@proton/shared/lib/broadcast';
import { DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { locales } from '@proton/shared/lib/i18n/locales';
import { UserModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';
import getRandomString from '@proton/utils/getRandomString';

import broadcast, { MessageType } from './broadcast';
import ExpiredLink from './components/ExpiredLink';
import LiteLayout from './components/LiteLayout';
import LiteLoaderPage from './components/LiteLoaderPage';

const checkDomain = (hostname: string, domain: string) => {
    return hostname === domain || hostname.endsWith(`.${domain}`);
};

const getFallbackUrl = (maybeUrl?: string) => {
    try {
        const url = new URL(maybeUrl || '');
        if (checkDomain(url.hostname, 'protonvpn.com') || checkDomain(url.hostname, 'proton.me')) {
            return url.toString();
        }
    } catch (e) {}
};

interface Props {
    onLogin: (UID: string) => void;
    UID?: string;
    children: ReactNode;
}

const Setup = ({ onLogin, UID, children }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [expiredLinkError, setExpiredLinkError] = useState<boolean>(false);

    const eventManagerRef = useRef<ReturnType<typeof createEventManager>>();
    const cache = useCache();

    useThemeQueryParameter();

    const searchParams = new URLSearchParams(location.search);

    useEffect(() => {
        const setupCookies = async ({ UID, RefreshToken }: { UID: string; RefreshToken: string }) => {
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
        };

        const setupFork = async (selector: string) => {
            const { UID, RefreshToken } = await silentApi<PullForkResponse>(pullForkSession(selector));

            await setupCookies({ UID, RefreshToken });

            return UID;
        };

        const setupJwt = async (jwt: string) => {
            const { UID, RefreshToken } = await silentApi<{
                UID: string;
                AccessToken: string;
                RefreshToken?: string;
            }>(authJwt({ Token: jwt }));

            if (!RefreshToken) {
                throw new Error('Invalid JWT token');
            }

            await setupCookies({ UID, RefreshToken });

            return UID;
        };

        const setupApp = async (UID: string) => {
            const uidApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));

            const eventManagerPromise = uidApi<{ EventID: string }>(getLatestID())
                .then(({ EventID }) => EventID)
                .then((eventID) => {
                    eventManagerRef.current = createEventManager({ api: uidApi, eventID });
                });

            const modelsPromise = loadModels([UserModel], {
                api: uidApi,
                cache,
            });

            const loadLocales = () => {
                const languageParams = searchParams.get('language');
                const browserLocale = getBrowserLocale();
                const localeCode = getClosestLocaleMatch(languageParams || browserLocale, locales) || DEFAULT_LOCALE;

                return Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, browserLocale)]);
            };

            await Promise.all([eventManagerPromise, modelsPromise, loadLocales(), loadCryptoWorker({ poolSize: 1 })]);

            flushSync(() => {
                onLogin(UID);
                setLoading(false);
                broadcast({ type: MessageType.LOADED });
            });
        };

        const fallbackUrl = getFallbackUrl(searchParams.get('fallback_url') || '');

        const handleSetupError = (error: any) => {
            if (fallbackUrl) {
                replaceUrl(fallbackUrl);
                return;
            }

            broadcast({ type: MessageType.ERROR, payload: getGenericErrorPayload(error) });

            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                setExpiredLinkError(true);
            } else {
                errorHandler(error);
                setError({
                    message: getApiErrorMessage(error) || error?.message,
                });
            }
        };

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const selector = hashParams.get('selector');
        const jwtToken = hashParams.get('token');

        hashParams.delete('selector');
        hashParams.delete('token');
        window.location.hash = hashParams.toString();

        if (selector) {
            setupFork(selector)
                .then((UID) => setupApp(UID))
                .catch(handleSetupError);

            return;
        }

        if (jwtToken) {
            setupJwt(jwtToken)
                .then((UID) => setupApp(UID))
                .catch(handleSetupError);

            return;
        }

        if (UID) {
            setupApp(UID).catch(handleSetupError);
            return;
        }

        // Old clients not supporting auto-sign in receive upgrade notifications to the lite app.
        if (fallbackUrl) {
            replaceUrl(fallbackUrl);
            return;
        }
        setError({
            message: 'No selector or JWT token found',
        });
        broadcast({ type: MessageType.ERROR, payload: { message: 'No selector or JWT token found' } });
    }, []);

    if (expiredLinkError) {
        return <ExpiredLink />;
    }

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading || !eventManagerRef.current) {
        return (
            <LiteLayout searchParams={searchParams}>
                <LiteLoaderPage />
            </LiteLayout>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <ModalsChildren />
            {children}
        </EventManagerProvider>
    );
};

export default Setup;
