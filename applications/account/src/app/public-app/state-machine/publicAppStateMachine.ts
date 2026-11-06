/**
 * The public app's page state: the fork, the active sessions and the login location state, and the work that runs
 * when the page opens: a fork on the fork routes, or resuming the active sessions on the sign-in routes. The page
 * shows a loader until it's `ready`. `createPublicAppActors` provides the actors, and `createPublicAppNavigation` the
 * navigation.
 */
import type * as H from 'history';
import { type DoneActorEvent, type SnapshotFrom, and, assertEvent, assign, emit, setup, spawnChild } from 'xstate';

import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getIsLumoApp, getIsPassApp, getIsVPNApp, getToAppName } from '@proton/shared/lib/authentication/apps';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type {
    ActiveSession,
    GetActiveSessionsResult,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';

import { type ProduceForkData, SSOType } from '../actions/forkInterface';
import type { LoginLocationState, LoginResult } from '../actions/interface';
import type { AuthSession } from '../authSession';
import type { ExternalSSOFlow } from '../fork/ExternalSSOConsumer';
import { getPaths, getPreAppIntent } from '../helper';
import { withInterruption } from '../interruptions';
import { type LocalRedirect, getLocalRedirect } from '../localRedirect';
import type { SignInLocationState } from '../sign-in/SignInContainer';
import { AuthType } from '../sign-in/auth/interface';
import {
    errorOf,
    isErrorOf,
    reportActorError,
    unprovidedAction,
    unprovidedActors,
} from '../sign-in/state-machine/machineHelpers';
import { getProductParams } from '../signup/searchParams';
import type { PublicAppActors, ResolvedSession } from './publicAppActors';
import { addSession } from './session';

/** The fork's parameters are missing from the URL. */
export class InvalidForkError extends Error {}

export const loginPaths = [
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
    SSO_PATHS.SPACES_SIGN_IN,
];

const ephemeralLoginPaths = [SSO_PATHS.APP_SWITCHER, SSO_PATHS.REAUTH];

export const forkPaths: string[] = [SSO_PATHS.OAUTH_AUTHORIZE, SSO_PATHS.AUTHORIZE, SSO_PATHS.DESKTOP_SIGN_IN];

export interface PublicAppMachineInput {
    /** The location the page opened on, without the locale. */
    location: H.Location & { localePrefix: string };
    initialSessionsLength: number;
    /** The fork saved before the page reloaded, such as during a signup or an SSO sign-in. */
    forkState: ProduceForkData | null;
}

export interface PublicAppMachineContext {
    /** The pathname the page opened on. */
    pathname: string;
    /** The language's path prefix, which follows the language the user picks. */
    localePrefix: string;
    initialSearchParams: URLSearchParams;
    productParam: ProductParam;
    queryAppIntent: APP_NAMES | undefined;
    localRedirect: LocalRedirect | undefined;
    /** How many sessions the browser had when the page opened. */
    initialSessionsLength: number;
    forkState: ProduceForkData | null;
    activeSessions: ActiveSession[] | undefined;
    locationState: LoginLocationState | null;
    errorMessage: string | undefined;
    /** The session picked in the account switcher, which shows as loading. */
    pickedLocalID: number | undefined;
    /** Who asked for the running login, to hand them its outcome; a consent screen's login has none. */
    loginRequestId: string | undefined;
    /** Why the crypto worker last failed to load. */
    cryptoError: unknown;
}

enum PublicAppStateMachineTags {
    /** The page shows its loader, or the error that stopped it, instead of its pages. */
    blocking = 'blocking',
    /** A login runs, or finished and the page is leaving; the screen that asked for it shows its loading state. */
    loggingIn = 'loggingIn',
    /** A session resumes or logs in; the account switcher shows the picked one as loading. */
    signingIn = 'signingIn',
    /** The account switcher couldn't read the sessions. */
    sessionsFailed = 'sessionsFailed',
}

/** A login result that asks the user to confirm before continuing. */
export type ConsentState = Extract<
    LoginLocationState,
    { type: 'oauth-consent' | 'fork-redirect-consent' | 'desktop-fork-consent' }
>;

const RESUME_SESSION = 'resumeSession';

export type PublicAppMachineEvent =
    | { type: 'login.resulted'; result: LoginResult }
    | { type: 'login.requested'; session: AuthSession; requestId?: string }
    | { type: 'consent.confirmed'; consent: ConsentState }
    | { type: 'sessions.updated'; sessions: ActiveSession[] }
    | { type: 'sessions.signedOut'; sessions: ActiveSession[]; clearDeviceRecovery: boolean }
    /** The account switcher opened. */
    | { type: 'switch.opened' }
    /** The partner's account is already a Proton account, or the partner sign-in failed: sign in with Proton. */
    | { type: 'oauthPartners.credentialsRequested'; email: string; sessions: ActiveSession[] | undefined }
    /** An identity provider handed back a token for the SSO sign-in. */
    | {
          type: 'externalSSO.tokenReceived';
          username?: string;
          token?: string;
          flow: ExternalSSOFlow;
          persistent?: boolean;
      }
    /** A partner's OAuth handed back a session to finish signing in with. */
    | { type: 'externalSSO.partnerSignedIn'; token: string; uid: string }
    | { type: 'session.picked'; localID: number }
    /** The picked session resumed; listed so the login reads it from the event. */
    | DoneActorEvent<ResumedSessionResult, typeof RESUME_SESSION>
    | { type: 'language.changed'; localePrefix: string }
    /** A page will submit soon, or is about to: load the crypto worker. */
    | { type: 'crypto.requested' }
    /** A page that reads feature flags opened. */
    | { type: 'flags.requested' };

export type PublicAppMachineEmitted =
    | { type: 'login.completed'; requestId: string | undefined; result: LoginResult }
    | { type: 'login.failed'; requestId: string | undefined; error: unknown }
    | { type: 'session.expired' };

export const getPublicAppPreAppIntent = (context: PublicAppMachineContext, forkState = context.forkState) =>
    getPreAppIntent({ forkState, localRedirect: context.localRedirect, queryAppIntent: context.queryAppIntent });

export const getPublicAppPaths = (context: PublicAppMachineContext, forkState = context.forkState) =>
    getPaths({
        maybeLocalePrefix: context.localePrefix,
        forkState,
        app: getPublicAppPreAppIntent(context, forkState),
        productParam: context.productParam,
        searchParams: context.initialSearchParams,
    });

type PublicAppSnapshot = { context: PublicAppMachineContext };

export const selectPreAppIntent = ({ context }: PublicAppSnapshot) => getPublicAppPreAppIntent(context);

/** A new object on each call: select it with a deep compare. */
export const selectPaths = ({ context }: PublicAppSnapshot) => getPublicAppPaths(context);

/** The OAuth client the user signs in to, from the fork or its consent screen. */
export const selectToOAuthName = ({ context }: PublicAppSnapshot) => {
    if (context.forkState?.type === SSOType.OAuth) {
        return context.forkState.payload.oauthData.clientInfo.Name;
    }
    if (context.locationState?.type === 'oauth-consent') {
        return context.locationState.payload.data.payload.oauthData.clientInfo.Name;
    }
};

/** The name of what the user signs in to: the OAuth client, or the app. */
export const selectToAppName = ({ context }: PublicAppSnapshot) => {
    const preAppIntent = getPublicAppPreAppIntent(context);
    return selectToOAuthName({ context }) || (preAppIntent && getToAppName(preAppIntent));
};

export const selectClientType = ({ context }: PublicAppSnapshot) => {
    const preAppIntent = getPublicAppPreAppIntent(context);
    if (getIsVPNApp(preAppIntent)) {
        return CLIENT_TYPES.VPN;
    }
    if (getIsPassApp(preAppIntent)) {
        return CLIENT_TYPES.PASS;
    }
    if (getIsLumoApp(preAppIntent)) {
        return CLIENT_TYPES.LUMO;
    }
    return CLIENT_TYPES.MAIL;
};

export const selectHasBackToSwitch = ({ context }: { context: PublicAppMachineContext }) =>
    context.activeSessions === undefined ? context.initialSessionsLength > 0 : context.activeSessions.length >= 1;

type PublicAppMachineSnapshot = SnapshotFrom<typeof publicAppStateMachine>;

/** The page shows its loader, or the error that stopped it, instead of its pages. */
export const selectBlocking = (snapshot: PublicAppMachineSnapshot) =>
    snapshot.hasTag(PublicAppStateMachineTags.blocking);

export const selectLoggingIn = (snapshot: PublicAppMachineSnapshot) =>
    snapshot.hasTag(PublicAppStateMachineTags.loggingIn);

/** The picked session, while it signs in. */
export const selectSigningInLocalID = (snapshot: PublicAppMachineSnapshot) =>
    snapshot.hasTag(PublicAppStateMachineTags.signingIn) ? snapshot.context.pickedLocalID : undefined;

/** The account switcher couldn't read the sessions. */
export const selectSessionsFailed = (snapshot: PublicAppMachineSnapshot) =>
    snapshot.hasTag(PublicAppStateMachineTags.sessionsFailed);

type ResolvedDoneEvent = { event: { output: ResolvedSession } };

const resolvedActions = [
    { type: 'assignResolved' as const, params: ({ event }: ResolvedDoneEvent) => ({ resolved: event.output }) },
    {
        type: 'applyLoginResult' as const,
        params: ({ event }: ResolvedDoneEvent) => ({ result: event.output.loginResult }),
    },
    {
        type: 'followLoginResult' as const,
        params: ({ event }: ResolvedDoneEvent) => ({ result: event.output.loginResult }),
    },
];

const onResolved = [
    {
        guard: {
            type: 'isLoginDone' as const,
            params: ({ event }: ResolvedDoneEvent) => ({ result: event.output.loginResult }),
        },
        target: 'redirecting',
        actions: resolvedActions,
    },
    { target: 'ready', actions: resolvedActions },
];

type LoginDoneEvent = { event: { output: LoginResult } };

const loginDoneActions = [
    { type: 'applyLoginResult' as const, params: ({ event }: LoginDoneEvent) => ({ result: event.output }) },
    { type: 'followLoginResult' as const, params: ({ event }: LoginDoneEvent) => ({ result: event.output }) },
    { type: 'emitLoginCompleted' as const, params: ({ event }: LoginDoneEvent) => ({ result: event.output }) },
];

const requestLogin = {
    target: '#publicApp.page.loggingIn',
    actions: {
        type: 'assignLoginRequest' as const,
        params: ({ event }: { event: { requestId?: string } }) => ({ requestId: event.requestId }),
    },
};

/** Finishes a partner's OAuth sign-in on its page. */
const getPartnerCallbackResult = ({ token, uid }: { token: string; uid: string }): LoginLocationState => ({
    type: 'oauth-partners',
    payload: { type: 'callback', payload: { token, uid } },
    location: SSO_PATHS.OAUTH_PARTNERS,
});

/** Undefined while the list hasn't loaded: an unknown list isn't an empty one. */
const getRemainingSessions = (sessions: ActiveSession[] | undefined, localIDs: number[]) =>
    sessions?.filter((session) => !localIDs.includes(session.remote.LocalID));

/** The account switcher has nothing to show: sign in instead. */
const leaveSwitcher = {
    type: 'replaceLocation' as const,
    params: ({ context }: { context: PublicAppMachineContext }) => ({ path: getPublicAppPaths(context).login }),
};

type SignedOutEvent = { event: { sessions: ActiveSession[] } };

const signedOutActions = [
    {
        type: 'removeSessions' as const,
        params: ({ event }: SignedOutEvent) => ({ localIDs: event.sessions.map((session) => session.remote.LocalID) }),
    },
    'signOut' as const,
];

type ExpiredContext = { context: PublicAppMachineContext };

const getPickedLocalIDs = ({ context }: ExpiredContext) => ({
    localIDs: context.pickedLocalID === undefined ? [] : [context.pickedLocalID],
});

const expiredActions = [
    { type: 'removeSessions' as const, params: getPickedLocalIDs },
    'notifySessionExpired' as const,
];

type SessionsDoneEvent = { event: { output: GetActiveSessionsResult } };

const updateFetchedSessions = {
    type: 'updateSessions' as const,
    params: ({ event }: SessionsDoneEvent) => ({ sessions: event.output.sessions }),
};

export const publicAppStateMachine = setup({
    types: {
        context: {} as PublicAppMachineContext,
        events: {} as PublicAppMachineEvent,
        input: {} as PublicAppMachineInput,
        emitted: {} as PublicAppMachineEmitted,
        tags: {} as `${PublicAppStateMachineTags}`,
    },
    actors: unprovidedActors<PublicAppActors>({
        resolve: true,
        login: true,
        fetchSessions: true,
        resumeSession: true,
        signOut: true,
        watchLanguage: true,
        loadCrypto: true,
        startFlags: true,
    }),
    actions: {
        assignResolved: assign(({ context }, { resolved }: { resolved: ResolvedSession }) => ({
            forkState: resolved.forkState,
            activeSessions: resolved.sessions ?? context.activeSessions,
        })),
        /** Keeps a login result that needs more input, and its session; a finished login only redirects. */
        applyLoginResult: assign(({ context }, { result }: { result: LoginResult }) => {
            if (result.type === 'done') {
                return {};
            }
            const payload = result.payload;
            return {
                locationState: result,
                activeSessions:
                    payload && 'session' in payload
                        ? addSession(context.activeSessions, payload.session)
                        : context.activeSessions,
            };
        }),
        /** Redirects to a finished login's URL, or goes to the login result's location. */
        followLoginResult: (_, _params: { result: LoginResult }) => unprovidedAction('followLoginResult'),
        replaceLocation: (_, _params: { path: string; state?: SignInLocationState }) =>
            unprovidedAction('replaceLocation'),
        updateSessions: assign(({ context }, { sessions }: { sessions: ActiveSession[] | undefined }) => ({
            activeSessions: sessions ?? context.activeSessions,
        })),
        removeSessions: assign(({ context }, { localIDs }: { localIDs: number[] }) => ({
            activeSessions: getRemainingSessions(context.activeSessions, localIDs),
        })),
        assignPickedSession: assign((_, { localID }: { localID: number }) => ({ pickedLocalID: localID })),
        notifySessionExpired: emit({ type: 'session.expired' as const }),
        /** Clears the signed-out sessions from the browser and revokes them, in the background. */
        signOut: spawnChild('signOut', {
            input: ({ event }) => {
                assertEvent(event, 'sessions.signedOut');
                return { sessions: event.sessions, clearDeviceRecovery: event.clearDeviceRecovery };
            },
        }),
        setLocalePrefix: assign((_, { localePrefix }: { localePrefix: string }) => ({ localePrefix })),
        reportError: assign((_, { error }: { error: unknown }) => ({ errorMessage: getNonEmptyErrorMessage(error) })),
        assignCryptoError: assign((_, { error }: { error: unknown }) => ({ cryptoError: error })),
        assignLoginRequest: assign((_, { requestId }: { requestId: string | undefined }) => ({
            loginRequestId: requestId,
        })),
        emitLoginCompleted: emit(({ context }, { result }: { result: LoginResult }) => ({
            type: 'login.completed' as const,
            requestId: context.loginRequestId,
            result,
        })),
        emitLoginFailed: emit(({ context }, { error }: { error: unknown }) => ({
            type: 'login.failed' as const,
            requestId: context.loginRequestId,
            error,
        })),
    },
    guards: {
        isForkPath: ({ context }) => forkPaths.includes(context.pathname),
        /** A session may be signed in and the page would show or redirect to it, so it waits for the sessions. */
        shouldResumeSessions: ({ context }) =>
            context.initialSessionsLength > 0 &&
            ((context.localRedirect !== undefined && context.localRedirect.type !== 'prompt-login') ||
                context.pathname === '/' ||
                [...loginPaths, ...ephemeralLoginPaths].some((pathname) => context.pathname === pathname)),
        isLoginDone: (_, { result }: { result: LoginResult }) => result.type === 'done',
        /** Only the consent the page shows can be confirmed. */
        isShownConsent: ({ context, event }) =>
            event.type === 'consent.confirmed' && event.consent === context.locationState,
        hasNoSessionList: ({ context }) => context.activeSessions === undefined,
        hasNoSessions: (_, { sessions }: { sessions: ActiveSession[] | undefined }) => sessions?.length === 0,
        leavesNoSessions: ({ context }, { localIDs }: { localIDs: number[] }) =>
            getRemainingSessions(context.activeSessions, localIDs)?.length === 0,
        /** The picked session was the switcher's last one. */
        isPickedSessionLast: ({ context }) =>
            getRemainingSessions(context.activeSessions, getPickedLocalIDs({ context }).localIDs)?.length === 0,
        isErrorOf,
    },
}).createMachine({
    id: 'publicApp',
    type: 'parallel',
    context: ({ input: { location, initialSessionsLength, forkState } }) => {
        const initialSearchParams = new URLSearchParams(location.search);
        const productParams = getProductParams(location.pathname, initialSearchParams);
        return {
            pathname: location.pathname,
            localePrefix: location.localePrefix,
            initialSearchParams,
            productParam: productParams.productParam,
            queryAppIntent: productParams.product,
            localRedirect: getLocalRedirect(location, productParams),
            initialSessionsLength,
            forkState,
            activeSessions: undefined,
            locationState: null,
            errorMessage: undefined,
            pickedLocalID: undefined,
            loginRequestId: undefined,
            cryptoError: undefined,
        };
    },
    invoke: { src: 'watchLanguage', input: ({ context }) => context.localePrefix },
    on: {
        'login.resulted': {
            actions: [
                { type: 'applyLoginResult', params: ({ event }) => ({ result: event.result }) },
                { type: 'followLoginResult', params: ({ event }) => ({ result: event.result }) },
            ],
        },
        'sessions.updated': {
            actions: { type: 'updateSessions', params: ({ event }) => ({ sessions: event.sessions }) },
        },
        'sessions.signedOut': [
            {
                guard: {
                    type: 'leavesNoSessions',
                    params: ({ event }) => ({ localIDs: event.sessions.map((session) => session.remote.LocalID) }),
                },
                actions: [...signedOutActions, leaveSwitcher],
            },
            { actions: signedOutActions },
        ],
        'oauthPartners.credentialsRequested': {
            actions: [
                { type: 'updateSessions', params: ({ event }) => ({ sessions: event.sessions }) },
                {
                    type: 'replaceLocation',
                    params: ({ context, event }) => ({
                        path: getPublicAppPaths(context).login,
                        state: event.email ? { username: event.email } : undefined,
                    }),
                },
            ],
        },
        'externalSSO.tokenReceived': {
            actions: {
                type: 'replaceLocation',
                params: ({ context, event }) => ({
                    path: getPublicAppPaths(context).login,
                    state: {
                        authTypeData: { type: AuthType.ExternalSSO },
                        externalSSO: { token: event.token, flow: event.flow, persistent: event.persistent },
                        username: event.username,
                    },
                }),
            },
        },
        'externalSSO.partnerSignedIn': {
            actions: [
                { type: 'applyLoginResult', params: ({ event }) => ({ result: getPartnerCallbackResult(event) }) },
                { type: 'followLoginResult', params: ({ event }) => ({ result: getPartnerCallbackResult(event) }) },
            ],
        },
        'language.changed': {
            actions: { type: 'setLocalePrefix', params: ({ event }) => ({ localePrefix: event.localePrefix }) },
        },
    },
    states: {
        page: {
            initial: 'starting',
            states: {
                starting: {
                    always: [
                        { guard: 'isForkPath', target: 'opening' },
                        { guard: 'shouldResumeSessions', target: 'opening' },
                        { target: 'ready' },
                    ],
                },
                /** Where opening the page leads: the fork on the fork routes, or the sessions to resume. */
                opening: {
                    tags: [PublicAppStateMachineTags.blocking],
                    // A standalone page (a partner's OAuth callback) can sign in before the sessions load: it wins
                    on: { 'login.requested': requestLogin },
                    invoke: {
                        src: 'resolve',
                        input: ({ context }) => context,
                        onDone: onResolved,
                        onError: [
                            {
                                // The fork's parameters are missing: sign in without the fork
                                guard: errorOf(InvalidForkError),
                                target: 'ready',
                                actions: {
                                    type: 'replaceLocation',
                                    params: ({ context }) => ({ path: getPublicAppPaths(context).login }),
                                },
                            },
                            { target: 'failed', actions: reportActorError },
                        ],
                    },
                },
                /** A login finished: the page is leaving for the app. */
                redirecting: { tags: [PublicAppStateMachineTags.blocking] },
                failed: { tags: [PublicAppStateMachineTags.blocking] },
                ready: {
                    on: {
                        'login.requested': requestLogin,
                        'consent.confirmed': {
                            guard: 'isShownConsent',
                            target: 'loggingIn',
                            actions: { type: 'assignLoginRequest', params: { requestId: undefined } },
                        },
                        'switch.opened': [
                            { guard: 'hasNoSessionList', target: '.loadingSessions' },
                            {
                                guard: {
                                    type: 'hasNoSessions',
                                    params: ({ context }) => ({ sessions: context.activeSessions }),
                                },
                                actions: leaveSwitcher,
                            },
                        ],
                        'session.picked': {
                            target: 'resumingSession',
                            actions: [
                                { type: 'assignPickedSession', params: ({ event }) => ({ localID: event.localID }) },
                                { type: 'assignLoginRequest', params: { requestId: undefined } },
                            ],
                        },
                    },
                    initial: 'idle',
                    states: {
                        idle: {},
                        /** The account switcher reads the sessions it shows. */
                        loadingSessions: {
                            invoke: {
                                src: 'fetchSessions',
                                input: ({ context }) => context.initialSearchParams,
                                onDone: [
                                    {
                                        guard: {
                                            type: 'hasNoSessions',
                                            params: ({ event }) => ({ sessions: event.output.sessions }),
                                        },
                                        target: 'idle',
                                        actions: [updateFetchedSessions, leaveSwitcher],
                                    },
                                    { target: 'idle', actions: updateFetchedSessions },
                                ],
                                onError: 'sessionsFailed',
                            },
                        },
                        /** The account switcher couldn't read the sessions. */
                        sessionsFailed: { tags: [PublicAppStateMachineTags.sessionsFailed] },
                    },
                },
                /** The account switcher's picked session resumes, to sign in with it. */
                resumingSession: {
                    tags: [PublicAppStateMachineTags.signingIn],
                    invoke: {
                        id: RESUME_SESSION,
                        src: 'resumeSession',
                        input: ({ event }) => {
                            assertEvent(event, 'session.picked');
                            return event.localID;
                        },
                        onDone: 'loggingIn',
                        onError: [
                            {
                                guard: and([errorOf(InvalidPersistentSessionError), 'isPickedSessionLast']),
                                target: 'ready',
                                actions: [...expiredActions, leaveSwitcher],
                            },
                            { guard: errorOf(InvalidPersistentSessionError), target: 'ready', actions: expiredActions },
                            {
                                target: 'ready',
                                actions: { type: 'emitLoginFailed', params: ({ event }) => ({ error: event.error }) },
                            },
                        ],
                    },
                },
                /** A session signed in, the user picked one or confirmed a consent screen: where it goes next. */
                loggingIn: {
                    tags: [PublicAppStateMachineTags.loggingIn, PublicAppStateMachineTags.signingIn],
                    initial: 'resolving',
                    states: {
                        resolving: {
                            invoke: {
                                src: 'login',
                                input: ({ context, event }) => {
                                    assertEvent(event, [
                                        'login.requested',
                                        'consent.confirmed',
                                        `xstate.done.actor.${RESUME_SESSION}`,
                                    ]);
                                    if (event.type === 'login.requested') {
                                        return { context, session: event.session };
                                    }
                                    if (event.type === 'consent.confirmed') {
                                        return {
                                            context,
                                            session: withInterruption(
                                                event.consent.payload.session,
                                                event.consent.type
                                            ),
                                        };
                                    }
                                    return { context, session: { data: event.output, flow: 'switch' as const } };
                                },
                                onDone: [
                                    {
                                        guard: {
                                            type: 'isLoginDone',
                                            params: ({ event }) => ({ result: event.output }),
                                        },
                                        target: 'leaving',
                                        actions: loginDoneActions,
                                    },
                                    { target: '#publicApp.page.ready', actions: loginDoneActions },
                                ],
                                onError: {
                                    target: '#publicApp.page.ready',
                                    actions: {
                                        type: 'emitLoginFailed',
                                        params: ({ event }) => ({ error: event.error }),
                                    },
                                },
                            },
                        },
                        /**
                         * The login finished: the page is leaving for the app, and the screen that asked for it keeps
                         * loading.
                         */
                        leaving: {},
                    },
                },
            },
        },
        /** The crypto worker: loaded once a page asks for it, and again after a failure so a retry can succeed. */
        crypto: {
            initial: 'idle',
            states: {
                idle: { on: { 'crypto.requested': 'loading' } },
                loading: {
                    invoke: {
                        src: 'loadCrypto',
                        onDone: 'ready',
                        onError: {
                            target: 'failed',
                            actions: { type: 'assignCryptoError', params: ({ event }) => ({ error: event.error }) },
                        },
                    },
                },
                ready: {},
                failed: { on: { 'crypto.requested': 'loading' } },
            },
        },
        /** The feature flags start once, on the first page that needs them. */
        flags: {
            initial: 'idle',
            states: {
                idle: { on: { 'flags.requested': 'started' } },
                started: { invoke: { src: 'startFlags' } },
            },
        },
    },
});
