import { ReactNode, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import FlagProvider from '@protontech/proxy-client-react';
import { UnleashClient } from 'unleash-proxy-client';

import { serverEvent, userThunk } from '@proton/account';
import {
    ApiProvider,
    EventManagerProvider,
    ModalsChildren,
    StandardLoadErrorPage,
    useErrorHandler,
    useThemeQueryParameter,
} from '@proton/components';
import {
    createCustomFetch,
    createUnleashReadyPromise,
    getUnleashConfig,
} from '@proton/components/containers/unleash/UnleashFlagProvider';
import { authJwt, pullForkSession, setCookies, setRefreshCookies } from '@proton/shared/lib/api/auth';
import { ApiWithListener } from '@proton/shared/lib/api/createApi';
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
import getRandomString from '@proton/utils/getRandomString';

import { useAccountDispatch } from '../app/store/hooks';
import { extendStore } from '../app/store/store';
import { extraThunkArguments } from '../app/store/thunk';
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
    api: ApiWithListener;
}

const Setup = ({ api, onLogin, UID, children }: Props) => {
    const errorHandler = useErrorHandler();
    const dispatch = useAccountDispatch();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [expiredLinkError, setExpiredLinkError] = useState<boolean>(false);

    useThemeQueryParameter();

    const searchParams = new URLSearchParams(location.search);

    useEffect(() => {
        const setupCookies = async ({ UID, RefreshToken }: { UID: string; RefreshToken: string }) => {
            const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } = await api<RefreshSessionResponse>(
                withUIDHeaders(UID, setRefreshCookies({ RefreshToken }))
            );

            await api(
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
            const { UID, RefreshToken } = await api<PullForkResponse>(pullForkSession(selector));

            await setupCookies({ UID, RefreshToken });

            return UID;
        };

        const setupJwt = async (jwt: string) => {
            const { UID, RefreshToken } = await api<{
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
            api.UID = UID;

            const unleashClient = new UnleashClient(getUnleashConfig({ fetch: createCustomFetch(api) }));

            extendStore({ unleashClient });

            const eventManagerPromise = api<{ EventID: string }>(getLatestID())
                .then(({ EventID }) => EventID)
                .then((eventID) => {
                    return createEventManager({ api, eventID });
                });

            const setupModels = async () => {
                const [user] = await Promise.all([dispatch(userThunk())]);
                return { user };
            };

            const loadLocales = () => {
                const languageParams = searchParams.get('language');
                const browserLocale = getBrowserLocale();
                const localeCode = getClosestLocaleMatch(languageParams || browserLocale, locales) || DEFAULT_LOCALE;

                return Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, browserLocale)]);
            };

            const [eventManager] = await Promise.all([
                eventManagerPromise,
                setupModels(),
                loadLocales(),
                loadCryptoWorker({ poolSize: 1 }),
                createUnleashReadyPromise(unleashClient).promise,
            ]);

            extendStore({ eventManager });
            eventManager.subscribe((event) => {
                dispatch(serverEvent(event));
            });
            eventManager.start();

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

    if (loading) {
        return (
            <LiteLayout searchParams={searchParams}>
                <LiteLoaderPage />
            </LiteLayout>
        );
    }

    return (
        <ApiProvider api={extraThunkArguments.api}>
            <FlagProvider unleashClient={extraThunkArguments.unleashClient} startClient={false}>
                <EventManagerProvider eventManager={extraThunkArguments.eventManager}>
                    <ModalsChildren />
                    {children}
                </EventManagerProvider>
            </FlagProvider>
        </ApiProvider>
    );
};

export default Setup;
