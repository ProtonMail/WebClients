import { createActor, fromCallback, fromPromise, waitFor } from 'xstate';

import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type {
    ActiveSession,
    GetActiveSessionsResult,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, CLIENT_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';

import { type ProduceForkData, SSOType } from '../actions/forkInterface';
import type { LoginLocationState, LoginResult } from '../actions/interface';
import type { AuthSession } from '../authSession';
import { ExternalSSOFlow } from '../fork/ExternalSSOConsumer';
import { AuthType } from '../sign-in/auth/interface';
import type { ResolvedSession } from './publicAppActors';
import {
    type ConsentState,
    InvalidForkError,
    getPublicAppPaths,
    publicAppStateMachine,
    selectBlocking,
    selectClientType,
    selectLoggingIn,
    selectSessionsFailed,
    selectSigningInLocalID,
    selectToAppName,
    selectToOAuthName,
} from './publicAppStateMachine';
import { requireCrypto, runLogin } from './runLogin';

const start = ({
    pathname,
    initialSessionsLength = 1,
    forkState = null,
    resolve = () => Promise.reject(new Error('unexpected resolve')),
    login = () => Promise.reject(new Error('unexpected login')),
    fetchSessions = () => Promise.reject(new Error('unexpected sessions request')),
    resumeSession = () => Promise.reject(new Error('unexpected resume')),
    signOut = () => Promise.reject(new Error('unexpected sign-out')),
    loadCrypto = () => Promise.resolve(),
    startFlags = () => Promise.resolve(),
}: {
    pathname: string;
    initialSessionsLength?: number;
    forkState?: ProduceForkData | null;
    resolve?: () => Promise<ResolvedSession>;
    login?: (input: { session: AuthSession }) => Promise<LoginResult>;
    fetchSessions?: () => Promise<GetActiveSessionsResult>;
    resumeSession?: (localID: number) => Promise<ResumedSessionResult>;
    signOut?: (input: { sessions: ActiveSession[]; clearDeviceRecovery: boolean }) => Promise<void>;
    loadCrypto?: () => Promise<void>;
    startFlags?: () => Promise<void>;
}) => {
    const followLoginResult = jest.fn();
    const replaceLocation = jest.fn();
    const actor = createActor(
        publicAppStateMachine.provide({
            actors: {
                resolve: fromPromise(resolve),
                login: fromPromise(({ input }) => login(input)),
                fetchSessions: fromPromise(fetchSessions),
                resumeSession: fromPromise(({ input }) => resumeSession(input)),
                signOut: fromPromise(({ input }) => signOut(input)),
                watchLanguage: fromCallback(() => {}),
                loadCrypto: fromPromise(loadCrypto),
                startFlags: fromPromise(startFlags),
            },
            actions: {
                followLoginResult: (_, { result }) => followLoginResult(result),
                replaceLocation: (_, { path }) => replaceLocation(path),
            },
        }),
        {
            input: {
                location: { pathname, search: '', hash: '', state: undefined, localePrefix: '' },
                initialSessionsLength,
                forkState,
            },
        }
    ).start();
    return { actor, followLoginResult, replaceLocation };
};

describe('publicAppStateMachine', () => {
    it('is ready right away without persisted sessions', () => {
        const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0 });
        expect(actor.getSnapshot().matches({ page: 'ready' })).toBe(true);
        expect(selectBlocking(actor.getSnapshot())).toBe(false);
    });

    it('resumes the sessions on a sign-in route and keeps a result that needs input', async () => {
        const loginResult: LoginResult = { type: 'sessions-switcher', location: SSO_PATHS.SWITCH, payload: null };
        const { actor, followLoginResult } = start({
            pathname: SSO_PATHS.LOGIN,
            resolve: async () => ({ forkState: null, sessions: [], loginResult }),
        });
        await waitFor(actor, (state) => state.matches({ page: 'ready' }));
        expect(actor.getSnapshot().context).toMatchObject({ activeSessions: [], locationState: loginResult });
        expect(followLoginResult).toHaveBeenCalledWith(loginResult);
    });

    it('keeps loading while a finished login redirects', async () => {
        const loginResult: LoginResult = { type: 'done', payload: { url: new URL('https://mail.proton.me') } };
        const { actor, followLoginResult } = start({
            pathname: '/',
            resolve: async () => ({ forkState: null, sessions: [], loginResult }),
        });
        await waitFor(actor, (state) => state.matches({ page: 'redirecting' }));
        expect(selectBlocking(actor.getSnapshot())).toBe(true);
        expect(actor.getSnapshot().context.locationState).toBeNull();
        expect(followLoginResult).toHaveBeenCalledWith(loginResult);

        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        expect(actor.getSnapshot().matches({ page: 'ready' })).toBe(true);
        expect(selectBlocking(actor.getSnapshot())).toBe(false);
    });

    it('goes to the login page on an invalid fork', async () => {
        const { actor, replaceLocation } = start({
            pathname: SSO_PATHS.AUTHORIZE,
            resolve: () => Promise.reject(new InvalidForkError()),
        });
        await waitFor(actor, (state) => state.matches({ page: 'ready' }));
        expect(replaceLocation).toHaveBeenCalledWith(expect.stringContaining(SSO_PATHS.LOGIN));
    });

    it('shows the error of a failed fork', async () => {
        const { actor } = start({
            pathname: SSO_PATHS.DESKTOP_SIGN_IN,
            resolve: () => Promise.reject(new Error('Invalid app specified')),
        });
        await waitFor(actor, (state) => state.matches({ page: 'failed' }));
        expect(actor.getSnapshot().context.errorMessage).toBe('Invalid app specified');
    });

    it('updates the sessions, and signs out of the ones the user picks', () => {
        const signOut = jest.fn(async () => {});
        const { actor, replaceLocation } = start({ pathname: SSO_PATHS.SIGNUP, initialSessionsLength: 0, signOut });
        const sessions = [1, 2].map((LocalID) => ({ remote: { LocalID } }) as unknown as ActiveSession);
        actor.send({ type: 'sessions.updated', sessions });
        expect(actor.getSnapshot().context.activeSessions).toEqual(sessions);
        actor.send({ type: 'sessions.signedOut', sessions: [sessions[0]], clearDeviceRecovery: true });
        expect(actor.getSnapshot().context.activeSessions).toEqual([sessions[1]]);
        expect(signOut).toHaveBeenCalledWith({ sessions: [sessions[0]], clearDeviceRecovery: true });
        expect(replaceLocation).not.toHaveBeenCalled();
    });

    it('reads the sessions the account switcher asks for, and lets it retry after a failure', async () => {
        const sessions = [{ remote: { LocalID: 1 } }] as unknown as ActiveSession[];
        const fetchSessions = jest
            .fn()
            .mockRejectedValueOnce(new Error('Servers are unreachable'))
            .mockResolvedValueOnce({ sessions });
        const { actor } = start({ pathname: SSO_PATHS.SWITCH, initialSessionsLength: 0, fetchSessions });

        actor.send({ type: 'switch.opened' });
        await waitFor(actor, selectSessionsFailed);

        actor.send({ type: 'switch.opened' });
        expect(selectSessionsFailed(actor.getSnapshot())).toBe(false);
        expect(actor.getSnapshot().matches({ page: { ready: 'loadingSessions' } })).toBe(true);
        await waitFor(actor, (state) => state.matches({ page: { ready: 'idle' } }));
        expect(actor.getSnapshot().context.activeSessions).toEqual(sessions);
    });

    it('signs out nothing and stays on the account switcher while its sessions load', () => {
        const { actor, replaceLocation } = start({
            pathname: SSO_PATHS.SWITCH,
            fetchSessions: () => new Promise(() => {}),
            signOut: async () => {},
        });
        actor.send({ type: 'switch.opened' });
        actor.send({ type: 'sessions.signedOut', sessions: [], clearDeviceRecovery: false });
        expect(actor.getSnapshot().context.activeSessions).toBeUndefined();
        expect(replaceLocation).not.toHaveBeenCalled();
    });

    describe('an account switcher with nothing to show sends the user to sign in', () => {
        const sessions = [1].map((LocalID) => ({ remote: { LocalID } }) as unknown as ActiveSession);

        it('when the browser has no sessions', async () => {
            const { actor, replaceLocation } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                fetchSessions: async () => ({ sessions: [] }) as unknown as GetActiveSessionsResult,
            });
            actor.send({ type: 'switch.opened' });
            await waitFor(actor, (state) => state.matches({ page: { ready: 'idle' } }));
            expect(replaceLocation).toHaveBeenCalledWith(expect.stringContaining(SSO_PATHS.LOGIN));
        });

        it('when it opens with an empty list', () => {
            const { actor, replaceLocation } = start({ pathname: SSO_PATHS.SWITCH, initialSessionsLength: 0 });
            actor.send({ type: 'sessions.updated', sessions: [] });
            actor.send({ type: 'switch.opened' });
            expect(replaceLocation).toHaveBeenCalledWith(expect.stringContaining(SSO_PATHS.LOGIN));
        });

        it('when the user signs out of the last session', () => {
            const { actor, replaceLocation } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                signOut: async () => {},
            });
            actor.send({ type: 'sessions.updated', sessions });
            actor.send({ type: 'sessions.signedOut', sessions, clearDeviceRecovery: false });
            expect(replaceLocation).toHaveBeenCalledWith(expect.stringContaining(SSO_PATHS.LOGIN));
        });

        it('when the last session expired', async () => {
            const { actor, replaceLocation } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                resumeSession: () => Promise.reject(new InvalidPersistentSessionError('Session invalid')),
            });
            actor.send({ type: 'sessions.updated', sessions });
            actor.send({ type: 'session.picked', localID: 1 });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(replaceLocation).toHaveBeenCalledWith(expect.stringContaining(SSO_PATHS.LOGIN));
        });
    });

    describe('what the user signs in to', () => {
        const contextOf = (pathname: string) =>
            start({ pathname, initialSessionsLength: 0 }).actor.getSnapshot().context;
        const oauthFork = {
            type: SSOType.OAuth,
            payload: { oauthData: { clientInfo: { Name: 'Zapier' } } },
        } as unknown as ProduceForkData;

        it('names the OAuth client of the fork', () => {
            const context = { ...contextOf(SSO_PATHS.LOGIN), forkState: oauthFork };
            expect(selectToOAuthName({ context })).toBe('Zapier');
            expect(selectToAppName({ context })).toBe('Zapier');
        });

        it('names the OAuth client of the consent screen', () => {
            const locationState = {
                type: 'oauth-consent',
                payload: { data: oauthFork },
            } as unknown as LoginLocationState;
            const context = { ...contextOf(SSO_PATHS.LOGIN), locationState };
            expect(selectToAppName({ context })).toBe('Zapier');
        });

        it('names the app and picks its client type', () => {
            const vpn = contextOf(SSO_PATHS.VPN_SIGN_IN);
            expect(selectToOAuthName({ context: vpn })).toBeUndefined();
            expect(selectToAppName({ context: vpn })).toBe(getToAppName(APPS.PROTONVPN_SETTINGS));
            expect(selectClientType({ context: vpn })).toBe(CLIENT_TYPES.VPN);
            expect(selectClientType({ context: contextOf(SSO_PATHS.PASS_SIGN_IN) })).toBe(CLIENT_TYPES.PASS);
            expect(selectClientType({ context: contextOf(SSO_PATHS.LOGIN) })).toBe(CLIENT_TYPES.MAIL);
        });
    });

    describe('flows that end on the sign-in page', () => {
        const startReplacing = () => {
            const replaceLocation = jest.fn();
            const actor = createActor(
                publicAppStateMachine.provide({
                    actors: { watchLanguage: fromCallback(() => {}) },
                    actions: {
                        followLoginResult: () => {},
                        replaceLocation: (_, params) => replaceLocation(params),
                    },
                }),
                {
                    input: {
                        location: {
                            pathname: SSO_PATHS.LOGIN,
                            search: '',
                            hash: '',
                            state: undefined,
                            localePrefix: '',
                        },
                        initialSessionsLength: 0,
                        forkState: null,
                    },
                }
            ).start();
            return { actor, replaceLocation };
        };

        it('signs in with the Proton account a partner account already is', () => {
            const { actor, replaceLocation } = startReplacing();
            const sessions = [{ remote: { LocalID: 1 } }] as unknown as ActiveSession[];
            actor.send({ type: 'oauthPartners.credentialsRequested', email: 'user@proton.me', sessions });
            expect(actor.getSnapshot().context.activeSessions).toEqual(sessions);
            expect(replaceLocation).toHaveBeenCalledWith({
                path: expect.stringContaining(SSO_PATHS.LOGIN),
                state: { username: 'user@proton.me' },
            });
        });

        it('signs in with the token an identity provider hands back', () => {
            const { actor, replaceLocation } = startReplacing();
            actor.send({
                type: 'externalSSO.tokenReceived',
                username: 'user@company.com',
                token: 'token',
                flow: ExternalSSOFlow.Redirect,
                persistent: true,
            });
            expect(replaceLocation).toHaveBeenCalledWith({
                path: expect.stringContaining(SSO_PATHS.LOGIN),
                state: {
                    authTypeData: { type: AuthType.ExternalSSO },
                    externalSSO: { token: 'token', flow: ExternalSSOFlow.Redirect, persistent: true },
                    username: 'user@company.com',
                },
            });
        });
    });

    it('finishes a partner sign-in on its page', () => {
        const { actor, followLoginResult } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0 });
        actor.send({ type: 'externalSSO.partnerSignedIn', token: 'token', uid: 'uid' });
        const result = {
            type: 'oauth-partners',
            payload: { type: 'callback', payload: { token: 'token', uid: 'uid' } },
            location: SSO_PATHS.OAUTH_PARTNERS,
        };
        expect(actor.getSnapshot().context.locationState).toEqual(result);
        expect(followLoginResult).toHaveBeenCalledWith(result);
    });

    it('builds the paths in the language the user picks', () => {
        const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0 });
        actor.send({ type: 'language.changed', localePrefix: 'fr' });
        expect(getPublicAppPaths(actor.getSnapshot().context).login).toBe(`/fr${SSO_PATHS.LOGIN}`);
    });

    const session = { data: { localID: 1 } } as unknown as AuthSession;
    const doneResult: LoginResult = { type: 'done', payload: { url: new URL('https://mail.proton.me') } };
    const inputResult: LoginResult = { type: 'sessions-switcher', location: SSO_PATHS.SWITCH, payload: null };

    describe('consent', () => {
        const consent: ConsentState = {
            type: 'fork-redirect-consent',
            location: '/authorize/consent',
            payload: { session, redirectUrl: 'https://example.com' },
        };

        it('continues the login past a confirmed consent', async () => {
            const login = jest.fn(async () => doneResult);
            const { actor, followLoginResult } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, login });
            actor.send({ type: 'login.resulted', result: consent });
            actor.send({ type: 'consent.confirmed', consent });
            expect(actor.getSnapshot().matches({ page: 'loggingIn' })).toBe(true);
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));
            expect(login).toHaveBeenCalledWith(
                expect.objectContaining({ session: { ...session, interruptions: ['fork-redirect-consent'] } })
            );
            expect(followLoginResult).toHaveBeenCalledWith(doneResult);
        });

        it('reports a failed login and shows the consent again', async () => {
            const error = new Error('Session expired');
            const { actor } = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: () => Promise.reject(error),
            });
            const onFailed = jest.fn();
            actor.on('login.failed', onFailed);
            actor.send({ type: 'login.resulted', result: consent });
            actor.send({ type: 'consent.confirmed', consent });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(onFailed).toHaveBeenCalledWith({ type: 'login.failed', requestId: undefined, error });
        });

        it('ignores a confirmation for a consent the page does not show', () => {
            const login = jest.fn(async () => doneResult);
            const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, login });
            actor.send({ type: 'consent.confirmed', consent });
            expect(actor.getSnapshot().matches({ page: 'ready' })).toBe(true);
            expect(login).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('continues the fork saved before the page reloaded', async () => {
            const forkState = { type: SSOType.Proton, payload: { forkParameters: {} } } as unknown as ProduceForkData;
            const login = jest.fn(async () => doneResult);
            const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, forkState, login });
            actor.send({ type: 'login.requested', session });
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));
            expect(login).toHaveBeenCalledWith(
                expect.objectContaining({ context: expect.objectContaining({ forkState }) })
            );
        });

        it('keeps the screen loading while a finished login leaves the page, and takes no other login', async () => {
            const login = jest.fn(async () => doneResult);
            const { actor } = start({ pathname: SSO_PATHS.SWITCH, initialSessionsLength: 0, login });
            actor.send({ type: 'login.requested', session });
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));
            actor.send({ type: 'login.requested', session });
            expect(login).toHaveBeenCalledTimes(1);
        });

        it('takes a login again once the browser restores the page it left from the back/forward cache', async () => {
            const login = jest.fn(async () => doneResult);
            const { actor } = start({ pathname: SSO_PATHS.SWITCH, initialSessionsLength: 0, login });
            actor.send({ type: 'login.requested', session });
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));

            window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
            expect(actor.getSnapshot().matches({ page: { loggingIn: 'leaving' } })).toBe(true);

            window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
            expect(actor.getSnapshot().matches({ page: 'ready' })).toBe(true);
            expect(selectLoggingIn(actor.getSnapshot())).toBe(false);
            expect(actor.getSnapshot().can({ type: 'login.requested', session })).toBe(true);
        });

        it('takes a login again when a history move cancels the redirect of a finished login', async () => {
            const login = jest.fn(async () => doneResult);
            const { actor } = start({ pathname: SSO_PATHS.SWITCH, initialSessionsLength: 0, login });
            actor.send({ type: 'login.requested', session });
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));

            window.dispatchEvent(new PopStateEvent('popstate'));
            expect(actor.getSnapshot().matches({ page: 'ready' })).toBe(true);
            expect(actor.getSnapshot().can({ type: 'login.requested', session })).toBe(true);
        });

        it('applies the result and hands it to whoever asked', async () => {
            const { actor, followLoginResult } = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: async () => inputResult,
            });
            const onCompleted = jest.fn();
            actor.on('login.completed', onCompleted);
            actor.send({ type: 'login.requested', session, requestId: 'a' });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(actor.getSnapshot().context.locationState).toEqual(inputResult);
            expect(followLoginResult).toHaveBeenCalledWith(inputResult);
            expect(onCompleted).toHaveBeenCalledWith({ type: 'login.completed', requestId: 'a', result: inputResult });
        });

        it('takes no second login while one runs', () => {
            const { actor } = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: () => new Promise(() => {}),
            });
            actor.send({ type: 'login.requested', session, requestId: 'a' });
            actor.send({ type: 'login.requested', session, requestId: 'b' });
            expect(actor.getSnapshot().context.loginRequestId).toBe('a');
        });

        it('takes a login while the sessions still load, and stops loading them', async () => {
            const { actor, followLoginResult } = start({
                pathname: SSO_PATHS.LOGIN,
                resolve: () => new Promise(() => {}),
                login: async () => inputResult,
            });
            expect(actor.getSnapshot().matches({ page: 'opening' })).toBe(true);
            actor.send({ type: 'login.requested', session, requestId: 'a' });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(followLoginResult).toHaveBeenCalledWith(inputResult);
        });
    });

    describe('account switcher', () => {
        const resumed = { localID: 2 } as unknown as ResumedSessionResult;

        it('signs in with the picked session, keeping it loading', async () => {
            const login = jest.fn(async () => doneResult);
            const { actor } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                resumeSession: async () => resumed,
                login,
            });
            actor.send({ type: 'session.picked', localID: 2 });
            expect(actor.getSnapshot().matches({ page: 'resumingSession' })).toBe(true);
            expect(selectSigningInLocalID(actor.getSnapshot())).toBe(2);
            expect(selectLoggingIn(actor.getSnapshot())).toBe(false);
            await waitFor(actor, (state) => state.matches({ page: { loggingIn: 'leaving' } }));
            expect(selectSigningInLocalID(actor.getSnapshot())).toBe(2);
            expect(selectLoggingIn(actor.getSnapshot())).toBe(true);
            expect(login).toHaveBeenCalledWith(expect.objectContaining({ session: { data: resumed, flow: 'switch' } }));
        });

        it('removes an expired session and tells the user', async () => {
            const sessions = [2, 3].map((LocalID) => ({ remote: { LocalID } }) as unknown as ActiveSession);
            const { actor } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                resumeSession: () => Promise.reject(new InvalidPersistentSessionError('Session invalid')),
            });
            const onExpired = jest.fn();
            actor.on('session.expired', onExpired);
            actor.send({ type: 'sessions.updated', sessions });
            actor.send({ type: 'session.picked', localID: 2 });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(actor.getSnapshot().context.activeSessions).toEqual([sessions[1]]);
            expect(onExpired).toHaveBeenCalled();
        });

        it('shows any other error on the page', async () => {
            const error = new Error('Servers are unreachable');
            const { actor } = start({
                pathname: SSO_PATHS.SWITCH,
                initialSessionsLength: 0,
                resumeSession: () => Promise.reject(error),
            });
            const onFailed = jest.fn();
            actor.on('login.failed', onFailed);
            actor.send({ type: 'session.picked', localID: 2 });
            await waitFor(actor, (state) => state.matches({ page: 'ready' }));
            expect(selectSigningInLocalID(actor.getSnapshot())).toBeUndefined();
            expect(onFailed).toHaveBeenCalledWith({ type: 'login.failed', requestId: undefined, error });
        });
    });

    describe('runLogin', () => {
        it('resolves with whether the page leaves once its login finishes', async () => {
            const leaving = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: async () => doneResult,
            });
            await expect(runLogin(leaving.actor, session)).resolves.toEqual({ state: 'complete' });
            const staying = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: async () => inputResult,
            });
            await expect(runLogin(staying.actor, session)).resolves.toEqual({ state: 'input' });
        });

        it('rejects with the error of its login', async () => {
            const error = new Error('Incorrect login credentials');
            const { actor } = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: () => Promise.reject(error),
            });
            await expect(runLogin(actor, session)).rejects.toBe(error);
        });

        it('rejects while another login runs', async () => {
            const { actor } = start({
                pathname: SSO_PATHS.LOGIN,
                initialSessionsLength: 0,
                login: () => new Promise(() => {}),
            });
            void runLogin(actor, session);
            await expect(runLogin(actor, session)).rejects.toThrow('Another sign in is in progress');
        });
    });

    describe('crypto worker', () => {
        it('loads it once, however many pages ask', async () => {
            const loadCrypto = jest.fn(() => Promise.resolve());
            const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, loadCrypto });
            actor.send({ type: 'crypto.requested' });
            actor.send({ type: 'crypto.requested' });
            await requireCrypto(actor);
            await requireCrypto(actor);
            expect(loadCrypto).toHaveBeenCalledTimes(1);
            expect(actor.getSnapshot().matches({ crypto: 'ready' })).toBe(true);
        });

        it('rejects a submit when it fails to load, and loads it again on the next one', async () => {
            const error = new Error('Worker failed');
            const loadCrypto = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
            const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, loadCrypto });
            await expect(requireCrypto(actor)).rejects.toBe(error);
            await expect(requireCrypto(actor)).resolves.toBeUndefined();
            expect(loadCrypto).toHaveBeenCalledTimes(2);
        });
    });

    it('starts the feature flags once', () => {
        const startFlags = jest.fn(() => Promise.resolve());
        const { actor } = start({ pathname: SSO_PATHS.LOGIN, initialSessionsLength: 0, startFlags });
        actor.send({ type: 'flags.requested' });
        actor.send({ type: 'flags.requested' });
        expect(startFlags).toHaveBeenCalledTimes(1);
    });
});
