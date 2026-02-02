import { Suspense, lazy, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';

import type * as H from 'history';

import type { OnLoginCallback, OnLoginCallbackResult } from '@proton/components/containers/app/interface';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
} from '@proton/shared/lib/authentication/fork';
import type { ActiveSession, GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { readForkState } from '../public/persistedForkState';
import { type ProductParams, getProductParams } from '../signup/searchParams';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import AccountEffect from './AccountAutoLogin';
import AccountLoaderPage from './AccountLoaderPage';
import type { PublicAppInteractiveProps } from './PublicAppInteractive';
import type { ProduceForkData } from './actions/forkInterface';
import { getActiveSessionLoginResult } from './actions/getActiveSessionLoginResult';
import { getLoginResult } from './actions/getLoginResult';
import type { LoginLocationState, LoginResult } from './actions/interface';
import { handleDesktopFork } from './fork/handleDesktopFork';
import { handleOAuthFork } from './fork/handleOAuthFork';
import { handleProtonFork } from './fork/handleProtonFork';
import { getPaths, getPreAppIntent } from './helper';
import { getLocalRedirect } from './localRedirect';
import { addSession } from './session';

const LazyPublicApp = lazy(
    () =>
        import(
            /* webpackChunkName: "PublicAppInteractive" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './PublicAppInteractive'
        )
);

export const getProductParamsFromLocation = (location: H.Location, searchParams: URLSearchParams): ProductParams => {
    const { product, productParam } = getProductParams(location.pathname, searchParams);
    return { product, productParam };
};

const completeResult: OnLoginCallbackResult = { state: 'complete' };
const inputResult: OnLoginCallbackResult = { state: 'input' };

const loginPaths = [
    SSO_PATHS.LOGIN,
    SSO_PATHS.MAIL_SIGN_IN,
    SSO_PATHS.CALENDAR_SIGN_IN,
    SSO_PATHS.DRIVE_SIGN_IN,
    SSO_PATHS.DOCS_SIGN_IN,
    SSO_PATHS.VPN_SIGN_IN,
    SSO_PATHS.PASS_SIGN_IN,
    SSO_PATHS.WALLET_SIGN_IN,
    SSO_PATHS.LUMO_SIGN_IN,
    SSO_PATHS.MEET_SIGN_IN,
];

const ephemeralLoginPaths = [SSO_PATHS.APP_SWITCHER, SSO_PATHS.REAUTH];

export const PublicAppInitial = ({ sessions }: { sessions: { initialSessionsLength: number } }) => {
    const silentApi = useSilentApi();
    const history = useHistory();
    const location = useLocationWithoutLocale<{ from?: H.Location }>();
    const [forkState, setForkState] = useState<ProduceForkData | null>(readForkState);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>();
    const [maybeHasActiveSessions] = useState(Boolean(sessions.initialSessionsLength));
    const [locationState, setLocationState] = useState<null | LoginLocationState>(null);

    const searchParams = new URLSearchParams(location.search);

    const [
        {
            productParams: { product: maybeQueryAppIntent, productParam },
            initialSearchParams,
            maybeLocalRedirect,
        },
    ] = useState(() => {
        const productParams = getProductParamsFromLocation(location, searchParams);
        return {
            productParams,
            initialLocation: location,
            initialSearchParams: searchParams,
            maybeLocalRedirect: getLocalRedirect(location, productParams),
        };
    });

    const [hasInitialSessionBlockingLoading, setHasInitialSessionBlockingLoading] = useState(() => {
        return (
            maybeHasActiveSessions &&
            ((maybeLocalRedirect && maybeLocalRedirect.type !== 'prompt-login') ||
                location.pathname === '/' ||
                [...loginPaths, ...ephemeralLoginPaths].some((pathname) => location.pathname === pathname))
        );
    });

    const handleLoginResult = (result: LoginResult) => {
        if (result.type === 'done') {
            const url = result.payload.url;
            replaceUrl(url.toString());
            return completeResult;
        }
        setLocationState(result);
        if (result.location) {
            history.push(result.location);
        }
        const payload = result.payload;
        if (payload && 'session' in payload) {
            setActiveSessions((previousSessions) => {
                return addSession(previousSessions, payload.session);
            });
        }
        return inputResult;
    };

    const maybePreAppIntent = getPreAppIntent({
        forkState,
        localRedirect: maybeLocalRedirect,
        queryAppIntent: maybeQueryAppIntent,
    });
    const paths = getPaths({
        maybeLocalePrefix: location.localePrefix,
        forkState,
        app: maybePreAppIntent,
        productParam,
        searchParams: initialSearchParams,
    });

    const handleLogin: OnLoginCallback = async (session) => {
        const result = await getLoginResult({
            api: silentApi,
            session,
            localRedirect: maybeLocalRedirect,
            initialSearchParams,
            forkState,
            preAppIntent: maybePreAppIntent,
            paths,
        });
        return handleLoginResult(result);
    };

    const handleGetActiveSessions = async () => {
        const result = await getActiveSessions({
            api: silentApi,
            localID: getLocalIDForkSearchParameter(initialSearchParams),
            email: getEmailSessionForkSearchParameter(initialSearchParams),
        });
        setActiveSessions(result.sessions);
        return result;
    };

    const handleActiveSessions = async (
        sessionsResult: GetActiveSessionsResult,
        newForkState = forkState
    ): Promise<OnLoginCallbackResult> => {
        const maybePreAppIntent = getPreAppIntent({
            forkState: newForkState,
            localRedirect: maybeLocalRedirect,
            queryAppIntent: maybeQueryAppIntent,
        });
        const paths = getPaths({
            maybeLocalePrefix: location.localePrefix,
            forkState: newForkState,
            app: maybePreAppIntent,
            productParam,
            searchParams: initialSearchParams,
        });
        const result = await getActiveSessionLoginResult({
            api: silentApi,
            sessionsResult,
            forkState: newForkState,
            localRedirect: maybeLocalRedirect,
            initialSearchParams,
            preAppIntent: maybePreAppIntent,
            paths,
        });
        setForkState(newForkState);
        setActiveSessions(sessionsResult.sessions);
        return handleLoginResult(result);
    };

    const hasBackToSwitch = activeSessions === undefined ? maybeHasActiveSessions : activeSessions.length >= 1;

    const loader = <AccountLoaderPage />;

    const blockingLoginEffect = hasInitialSessionBlockingLoading ? (
        <AccountEffect
            onEffect={async () => {
                const activeSessionsResult = await handleGetActiveSessions();
                const result = await handleActiveSessions(activeSessionsResult, undefined);
                setHasInitialSessionBlockingLoading(result === completeResult);
            }}
        >
            {loader}
        </AccountEffect>
    ) : null;

    const props: PublicAppInteractiveProps = {
        loader,
        location,
        locationState,
        handleLoginResult,
        hasBackToSwitch,
        handleLogin,
        handleGetActiveSessions,
        activeSessions,
        blockingLoginEffect,
        paths,
        maybePreAppIntent,
        forkState,
        productParam,
        searchParams,
        initialSearchParams,
        setActiveSessions,
        initialSessionsLength: sessions.initialSessionsLength,
        loginPaths,
    };

    return (
        <Switch>
            <Route path={SSO_PATHS.OAUTH_AUTHORIZE}>
                <AccountEffect
                    onEffect={async () => {
                        const result = await handleOAuthFork({ api: silentApi, paths });
                        if (result.type === 'invalid') {
                            history.replace(paths.login);
                            return;
                        }
                        if (result.type === 'switch') {
                            await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                            return;
                        }
                        handleLoginResult(result.payload);
                        return;
                    }}
                >
                    {loader}
                </AccountEffect>
            </Route>
            <Route path={SSO_PATHS.AUTHORIZE}>
                <AccountEffect
                    onEffect={async () => {
                        const result = await handleProtonFork({ api: silentApi, paths });
                        if (result.type === 'invalid') {
                            history.replace(paths.login);
                            return;
                        }
                        if (result.type === 'switch') {
                            await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                            return;
                        }
                        handleLoginResult(result.payload);
                        return;
                    }}
                >
                    {loader}
                </AccountEffect>
            </Route>
            <Route path={SSO_PATHS.DESKTOP_SIGN_IN}>
                <AccountEffect
                    onEffect={async () => {
                        const result = await handleDesktopFork({ api: silentApi, paths });
                        await handleActiveSessions(result.payload.activeSessionsResult, result.payload.fork);
                    }}
                >
                    {loader}
                </AccountEffect>
            </Route>
            <Route path="*">
                <Suspense fallback={loader}>
                    <LazyPublicApp {...props} />
                </Suspense>
            </Route>
        </Switch>
    );
};
