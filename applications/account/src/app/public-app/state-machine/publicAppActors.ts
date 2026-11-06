import type * as H from 'history';
import { type EventObject, fromCallback, fromPromise } from 'xstate';

import { loadCrypto } from '@proton/account/bootstrap';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
} from '@proton/shared/lib/authentication/fork/validation';
import type {
    ActiveSession,
    GetActiveSessionsResult,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions, resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/storage';
import type { UnleashClient } from '@proton/unleash/UnleashClient';
import noop from '@proton/utils/noop';

import type { ProduceForkData } from '../actions/forkInterface';
import { getActiveSessionLoginResult } from '../actions/getActiveSessionLoginResult';
import { getLoginResult } from '../actions/getLoginResult';
import type { LoginResult } from '../actions/interface';
import type { AuthSession } from '../authSession';
import { handleDesktopFork } from '../fork/handleDesktopFork';
import { handleOAuthFork } from '../fork/handleOAuthFork';
import { handleProtonFork } from '../fork/handleProtonFork';
import type { Paths } from '../helper';
import { stripLocaleTagPrefix } from '../localePrefix';
import {
    InvalidForkError,
    type PublicAppMachineContext,
    forkPaths,
    getPublicAppPaths,
    getPublicAppPreAppIntent,
} from './publicAppStateMachine';

/** Where opening the page leads: the fork, the active sessions when they were read, and the login result. */
export interface ResolvedSession {
    forkState: ProduceForkData | null;
    sessions?: ActiveSession[];
    loginResult: LoginResult;
}

/** The active sessions, narrowed to the account the URL asks for. Pass the app's api, not the unauthenticated one. */
export const getPublicAppActiveSessions = (api: Api, initialSearchParams: URLSearchParams) =>
    getActiveSessions({
        api: getSilentApi(api),
        localID: getLocalIDForkSearchParameter(initialSearchParams),
        email: getEmailSessionForkSearchParameter(initialSearchParams),
    });

/** What working out a login result needs. */
interface LoginServices {
    api: Api;
}

const resolveActiveSessions = async (
    { api }: LoginServices,
    context: PublicAppMachineContext,
    sessionsResult: GetActiveSessionsResult,
    forkState: ProduceForkData | null
): Promise<ResolvedSession> => ({
    forkState,
    sessions: sessionsResult.sessions,
    loginResult: await getActiveSessionLoginResult({
        api,
        sessionsResult,
        forkState,
        localRedirect: context.localRedirect,
        initialSearchParams: context.initialSearchParams,
        preAppIntent: getPublicAppPreAppIntent(context, forkState),
        paths: getPublicAppPaths(context, forkState),
    }),
});

const handleForkPath = ({ api, pathname, paths }: LoginServices & { pathname: string; paths: Paths }) => {
    if (pathname === SSO_PATHS.OAUTH_AUTHORIZE) {
        return handleOAuthFork({ api, paths });
    }
    if (pathname === SSO_PATHS.AUTHORIZE) {
        return handleProtonFork({ api, paths });
    }
    return handleDesktopFork({ api, paths });
};

export const createPublicAppActors = ({
    api,
    history,
    unleashClient,
}: {
    api: Api;
    history: H.History;
    unleashClient: UnleashClient;
}) => ({
    /** Where opening the page leads: the fork on a fork route, else the active sessions. */
    resolve: fromPromise<ResolvedSession, PublicAppMachineContext>(async ({ input }) => {
        if (!forkPaths.includes(input.pathname)) {
            const sessionsResult = await getPublicAppActiveSessions(api, input.initialSearchParams);
            return resolveActiveSessions({ api }, input, sessionsResult, input.forkState);
        }
        const result = await handleForkPath({ api, pathname: input.pathname, paths: getPublicAppPaths(input) });
        if (result.type === 'invalid') {
            throw new InvalidForkError();
        }
        if (result.type === 'switch') {
            return resolveActiveSessions({ api }, input, result.payload.activeSessionsResult, result.payload.fork);
        }
        return { forkState: result.fork, loginResult: result.payload };
    }),
    login: fromPromise<LoginResult, { context: PublicAppMachineContext; session: AuthSession }>(
        ({ input: { context, session } }) =>
            getLoginResult({
                api,
                session,
                localRedirect: context.localRedirect,
                initialSearchParams: context.initialSearchParams,
                forkState: context.forkState,
                preAppIntent: getPublicAppPreAppIntent(context),
                paths: getPublicAppPaths(context),
            })
    ),
    resumeSession: fromPromise<ResumedSessionResult, number>(({ input }) => resumeSession({ api, localID: input })),
    signOut: fromPromise<void, { sessions: ActiveSession[]; clearDeviceRecovery: boolean }>(
        async ({ input: { sessions, clearDeviceRecovery } }) => {
            await Promise.all(
                sessions.map(({ persisted }) => {
                    if (clearDeviceRecovery) {
                        removeDeviceRecovery(persisted.UserID);
                    }
                    return Promise.all([
                        removePersistedSession(persisted).catch(noop),
                        api(withUIDHeaders(persisted.UID, revoke())).catch(noop),
                    ]);
                })
            );
        }
    ),
    fetchSessions: fromPromise<GetActiveSessionsResult, URLSearchParams>(({ input }) =>
        getPublicAppActiveSessions(api, input)
    ),
    /** The crypto worker, which a sign-in, signup or reset needs before it submits. */
    loadCrypto: fromPromise<void>(() => loadCrypto({ appName: APPS.PROTONACCOUNT, unleashClient: undefined })),
    /** The feature flags; starting them opens an unauthenticated session, and a failure leaves the defaults. */
    startFlags: fromPromise<void>(() => unleashClient.start().catch(noop)),
    /** Tells the machine when the user picks another language, which moves the page to its locale prefix. */
    watchLanguage: fromCallback<EventObject, string>(({ input, sendBack }) => {
        let localePrefix = input;
        return history.listen((location) => {
            const next = stripLocaleTagPrefix(location.pathname).localePrefix;
            if (next !== localePrefix) {
                localePrefix = next;
                sendBack({ type: 'language.changed', localePrefix });
            }
        });
    }),
});

export type PublicAppActors = ReturnType<typeof createPublicAppActors>;
