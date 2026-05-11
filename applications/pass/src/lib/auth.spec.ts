import { store as appStore } from 'proton-pass-web/app/Store/store';

import { ARGON2_PARAMS } from '@proton/crypto/lib';
import { getInitialAppState } from '@proton/pass/components/Core/AppStateManager';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthOptions } from '@proton/pass/lib/auth/service';
import { authStore, createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { bootIntent, offlineResume } from '@proton/pass/store/actions/creators/client';
import { type AppState, AppStatus } from '@proton/pass/types';
import { createMemoryStore } from '@proton/pass/utils/store';
import { createOfflineError } from '@proton/shared/lib/fetch/ApiError';

import * as auth from './auth';
import * as sessions from './sessions';
import * as storage from './storage';

jest.mock('proton-pass-web/app/Store/store', () => ({ store: { dispatch: jest.fn() } }));
jest.mock('proton-pass-web/lib/telemetry', () => ({ telemetry: { stop: jest.fn() } }));
jest.mock('proton-pass-web/lib/settings', () => ({ settings: { clear: jest.fn() } }));
jest.mock('proton-pass-web/lib/theme', () => ({ getThemeForLocalID: jest.fn(() => Promise.resolve()) }));

const MOCK_PERSISTED_SESSION = {
    AccessToken: '',
    LocalID: 42,
    lockMode: LockMode.PASSWORD,
    lockTTL: 5,
    offlineConfig: { salt: '', params: ARGON2_PARAMS.RECOMMENDED },
    offlineVerifier: 'offline-verifier',
    encryptedOfflineKD: 'encrypted-offline-kd',
    RefreshToken: '',
    UID: '',
    UserID: '',
    sso: false,
    blob: '',
};
exposeAuthStore(createAuthStore(createMemoryStore()));
exposeApi({ subscribe: jest.fn(), idle: jest.fn(() => Promise.resolve()) } as any);

const config = { SSO_URL: 'test://' } as PassConfig;
const settings = { clear: jest.fn(), resolve: jest.fn() };

let appState: AppState = getInitialAppState();
const setAppState = (next: Partial<AppState>) => (appState = { ...appState, ...next });

const genericError = new Error('unknown');
const offlineError = createOfflineError({});

const app = {
    getState: jest.fn(() => appState),
    reset: jest.fn(),
    setAuthorized: jest.fn(),
    setBooted: jest.fn((booted: boolean) => setAppState({ booted })),
    setLocalID: jest.fn(),
    setState: jest.fn(),
    setStatus: jest.fn((status: AppStatus) => setAppState({ status })),
    setUID: jest.fn(),
    subscribe: jest.fn(),
};

const history = { replace: jest.fn(), location: { pathname: '/', search: '', state: null, hash: '' } } as any;
const sw = { on: jest.fn(), off: jest.fn() } as any;
const core = { settings, i18n: { setLocale: jest.fn() } } as any;
const authSwitch = { sync: jest.fn() } as any;

/** Connectivity */
const connectivitySubscribers: ((status: ConnectivityStatus) => void)[] = [];
const fireConnectivity = (status: ConnectivityStatus) => connectivitySubscribers.forEach((cb) => cb(status));
const connectivity = {
    online: true,
    check: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn((cb) => {
        connectivitySubscribers.push(cb);
        return () => connectivitySubscribers.splice(connectivitySubscribers.indexOf(cb), 1);
    }),
} as unknown as { -readonly [P in keyof ConnectivityService]: ConnectivityService[P] };

/** Document listeners */
const evtListeners: Map<string, EventListener> = new Map();
let visibility: DocumentVisibilityState = 'visible';
const fireVisibility = () => evtListeners.get('visibilitychange')?.(new Event('visibilitychange'));
document.addEventListener = jest.fn((type: string, handler: EventListener) => evtListeners.set(type, handler));
document.removeEventListener = jest.fn((type: string) => evtListeners.delete(type));
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });

const authService = auth.createAuthService({
    app,
    authSwitch,
    config,
    core,
    connectivity,
    history,
    sw,
    onNotification: jest.fn(),
} as any);

const resumeSession = jest.spyOn(authService, 'resumeSession');
const requestFork = jest.spyOn(authService, 'requestFork').mockImplementation();
const getPersistedSession = jest.spyOn(authService.config, 'getPersistedSession');
const clear = jest.spyOn(authStore, 'clear');
const validSession = jest.spyOn(authStore, 'validSession');
const hasSession = jest.spyOn(authStore, 'hasSession');

jest.spyOn(sessions, 'getDefaultLocalID').mockImplementation(() => undefined);
jest.spyOn(sessions, 'getPersistedLocalIDsForUserID').mockImplementation(() => []);
jest.spyOn(storage, 'clearUserLocalData').mockImplementation(() => []);
jest.spyOn(storage, 'localGarbageCollect').mockImplementation(() => Promise.resolve([]));

jest.useFakeTimers();

describe('AuthService', () => {
    beforeEach(() => {
        authStore.clear();
        jest.clearAllMocks();

        history.location = { pathname: '/', search: '', state: null, hash: '' };
        connectivity.online = true;
        appState = getInitialAppState();
        visibility = 'visible';
        connectivitySubscribers.length = 0;

        evtListeners.clear();
        authService.scheduler.reset();
        core.i18n.setLocale.mockResolvedValue({});
        authSwitch.sync.mockResolvedValue();
    });

    describe('init', () => {
        test('should not request fork if no sessions and no localID provided', async () => {
            /** When no persisted sessions exist and URL has no localID */
            resumeSession.mockImplementation(async () => false);
            const result = await authService.init({});

            expect(resumeSession).toHaveBeenCalled();
            expect(requestFork).not.toHaveBeenCalled();
            expect(result).toBe(false);
        });

        test('should requestFork if no sessions exist when `localID` in pathname', async () => {
            /** When URL contains localID but no persisted sessions exist, request new session fork */
            history.location.pathname = '/u/42';
            resumeSession.mockImplementation(async () => false);

            const result = await authService.init({});

            expect(resumeSession).toHaveBeenCalled();
            expect(requestFork).toHaveBeenCalled();
            expect(result).toBe(false);
        });

        test('should clear authentication store if localID mismatch', async () => {
            /** When in-memory session has localID 41 but URL requests /u/42,
             * clear auth store and request new fork for the different localID */
            history.location.pathname = '/u/42';
            authStore.setLocalID(41);
            resumeSession.mockImplementation(async () => false);

            const result = await authService.init({});

            expect(result).toBe(false);
            expect(authStore.clear).toHaveBeenCalled();
            expect(resumeSession).toHaveBeenCalled();
            expect(requestFork).toHaveBeenCalled();
        });

        test('should not `forceLock` if in-memory session is valid and matches path `localID`', async () => {
            /** When session is valid and URL localID matches in-memory localID,
             * allow seamless authentication without forcing lock screen */
            validSession.mockImplementation(() => true);
            authStore.setLocalID(42);
            history.location.pathname = '/u/42';

            hasSession.mockImplementation(() => true);
            resumeSession.mockImplementation(async () => true);

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(true);
            expect(resumeSession).toHaveBeenCalled();
            expect(options.forceLock).toBe(false);
        });

        test('should set `forceLock` to true if local ID conflict', async () => {
            /** Mock valid in-memory session for localID 41 */
            validSession.mockImplementationOnce(() => true);

            /** Simulate accessing URL for different localID with persisted session */
            history.location.pathname = `/u/1337/some/path`;
            getPersistedSession.mockImplementationOnce(async () => MOCK_PERSISTED_SESSION);

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(false);
            expect(options.forceLock).toBe(true);
            expect(clear).toHaveBeenCalled();
            expect(resumeSession).not.toHaveBeenCalled();
            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
        });

        test('should set `forceLock` to true when offline with valid session', async () => {
            /** Setup valid session with offline capabilities and biometric lock */
            settings.resolve.mockResolvedValueOnce({ offlineEnabled: true });
            validSession.mockImplementationOnce(() => true);
            history.location.pathname = '/u/41';
            authStore.setLocalID(41);
            authStore.setOfflineConfig({ salt: '', params: ARGON2_PARAMS.RECOMMENDED });
            authStore.setOfflineVerifier('offline-verifier');
            authStore.setEncryptedOfflineKD('encrypted-offline-kd');
            authStore.setLockMode(LockMode.BIOMETRICS);

            /** Simulate offline state */
            connectivity.online = false;

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(false);
            expect(options.forceLock).toBe(true);
            expect(resumeSession).not.toHaveBeenCalled();
            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.BIOMETRICS_LOCKED);
        });

        test('should set `forceLock` to true when session validation returns false', async () => {
            /** When in-memory session is invalid despite matching localID,
             * force lock to require re-authentication through persisted session */
            authStore.setLocalID(MOCK_PERSISTED_SESSION.LocalID);
            history.location.pathname = `/u/${MOCK_PERSISTED_SESSION.LocalID}`;

            /** Mock session validation failure but persisted session exists */
            validSession.mockImplementationOnce(() => false);
            getPersistedSession.mockImplementationOnce(async () => MOCK_PERSISTED_SESSION);

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(false);
            expect(options.forceLock).toBe(true);
            expect(resumeSession).not.toHaveBeenCalled();
            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
        });

        test('should set `forceLock` to true with empty localID manipulation', async () => {
            /** When user has valid session but URL has empty/malformed localID,
             * clear auth store and force lock to prevent unauthorized access */
            authStore.setLocalID(MOCK_PERSISTED_SESSION.LocalID);
            getPersistedSession.mockImplementationOnce(async () => MOCK_PERSISTED_SESSION);

            /** Simulate malformed URL with empty localID &
             * Setup valid in-memory session and persisted session */
            validSession.mockImplementationOnce(() => true);
            history.location.pathname = '/u/';

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(false);
            expect(options.forceLock).toBe(true);
            expect(clear).toHaveBeenCalled();
            expect(resumeSession).not.toHaveBeenCalled();
        });
    });

    describe('getPersistedSession', () => {
        const cases = [
            { desc: 'not persisted', value: null },
            { desc: 'invalid', value: '//invalid//' },
            { desc: 'not valid', value: JSON.stringify({}) },
        ];

        test.each(cases)('should return null if session is $desc', ({ value }) => {
            const getItem = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(value);
            const result = authService.config.getPersistedSession(0);
            expect(getItem).toHaveBeenCalledWith(sessions.getSessionKey(0));
            expect(result).toBe(null);
        });

        test('should return session if parsed and valid', () => {
            const session = { UID: '42', UserID: '42', blob: 'encrypted-blob', cookies: true };
            const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => JSON.stringify(session));
            const result = authService.config.getPersistedSession(0);
            expect(getItem).toHaveBeenCalledWith(sessions.getSessionKey(0));
            expect(result).toEqual(session);
        });
    });

    describe('onSessionFailure', () => {
        beforeEach(() => {
            settings.resolve.mockResolvedValue({ offlineEnabled: false });
            authStore.setLocalID(MOCK_PERSISTED_SESSION.LocalID);
        });

        test('connection issue while offline-booted: no state mutation, scheduler advances', async () => {
            setAppState({ status: AppStatus.OFFLINE, booted: true });
            await authService.config.onSessionFailure({}, offlineError);

            expect(app.setStatus).not.toHaveBeenCalled();
            expect(app.setBooted).not.toHaveBeenCalled();
            expect(authService.scheduler.isThrottled()).toBe(true);
        });

        test('non-connection error while offline-booted: no-op', async () => {
            setAppState({ status: AppStatus.OFFLINE, booted: true });
            await authService.config.onSessionFailure({}, genericError);

            expect(app.setStatus).not.toHaveBeenCalled();
            expect(app.setBooted).not.toHaveBeenCalled();
            expect(authService.scheduler.isThrottled()).toBe(false);
        });

        test('connection issue + canOfflineUnlock + unlocked → boots offline', async () => {
            settings.resolve.mockResolvedValueOnce({ offlineEnabled: true });
            authStore.setUID('uid');
            authStore.setUserID('user-id');
            authStore.setOfflineConfig({ salt: '', params: ARGON2_PARAMS.RECOMMENDED });
            authStore.setOfflineVerifier('offline-verifier');
            authStore.setEncryptedOfflineKD('encrypted-offline-kd');
            authStore.setOfflineKD('offline-kd');
            authStore.setLockMode(LockMode.PASSWORD);

            setAppState({ status: AppStatus.AUTHORIZING, booted: false });
            await authService.config.onSessionFailure({ unlocked: true }, offlineError);

            expect(appStore.dispatch).toHaveBeenCalledTimes(1);
            expect(appStore.dispatch).toHaveBeenCalledWith(bootIntent({ offline: true }));
        });

        test('connection issue + canOfflineUnlock + !unlocked → sets locked status', async () => {
            settings.resolve.mockResolvedValueOnce({ offlineEnabled: true });
            authStore.setOfflineConfig({ salt: '', params: ARGON2_PARAMS.RECOMMENDED });
            authStore.setOfflineVerifier('offline-verifier');
            authStore.setEncryptedOfflineKD('encrypted-offline-kd');
            authStore.setLockMode(LockMode.BIOMETRICS);

            setAppState({ status: AppStatus.AUTHORIZING, booted: false });
            await authService.config.onSessionFailure({}, offlineError);

            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.BIOMETRICS_LOCKED);
            expect(app.setBooted).toHaveBeenCalledWith(false);
        });

        test('non-connection error + not booted → ERROR status', async () => {
            setAppState({ status: AppStatus.AUTHORIZING, booted: false });
            await authService.config.onSessionFailure({}, genericError);

            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.ERROR);
            expect(app.setBooted).toHaveBeenCalledWith(false);
        });
    });

    describe('listen', () => {
        const localID = MOCK_PERSISTED_SESSION.LocalID;
        let detach: () => void = () => {};

        beforeEach(() => {
            authStore.setLocalID(localID);
            detach = authService.listen();
        });

        afterEach(() => detach());

        test('visibilitychange while offline-booted + online dispatches offlineResume', () => {
            setAppState({ status: AppStatus.OFFLINE });
            connectivity.online = true;
            fireVisibility();
            expect(appStore.dispatch).toHaveBeenCalledWith(offlineResume.intent({ localID, silence: true }));
        });

        test('visibilitychange while hidden does not dispatch', () => {
            setAppState({ status: AppStatus.OFFLINE });
            visibility = 'hidden';
            fireVisibility();
            expect(appStore.dispatch).not.toHaveBeenCalled();
        });

        test('connectivity ONLINE transition while offline-booted dispatches', () => {
            setAppState({ status: AppStatus.OFFLINE });
            connectivity.online = true;
            fireConnectivity(ConnectivityStatus.ONLINE);
            expect(appStore.dispatch).toHaveBeenCalledWith(offlineResume.intent({ localID, silence: true }));
        });

        test('does not dispatch when connectivity is offline', () => {
            setAppState({ status: AppStatus.OFFLINE });
            connectivity.online = false;
            fireConnectivity(ConnectivityStatus.OFFLINE);
            fireVisibility();
            expect(appStore.dispatch).not.toHaveBeenCalled();
        });

        test('does not dispatch when not offline-booted', () => {
            setAppState({ status: AppStatus.AUTHORIZED });
            fireConnectivity(ConnectivityStatus.ONLINE);
            fireVisibility();
            expect(appStore.dispatch).not.toHaveBeenCalled();
        });

        test('does not dispatch when localID is missing', () => {
            authStore.clear();
            setAppState({ status: AppStatus.OFFLINE });
            fireVisibility();
            expect(appStore.dispatch).not.toHaveBeenCalled();
        });

        test('throttle gate suppresses dispatch immediately after a connection-issue failure', async () => {
            setAppState({ status: AppStatus.OFFLINE });
            await authService.config.onSessionFailure({}, offlineError);
            fireVisibility();
            expect(appStore.dispatch).not.toHaveBeenCalled();
        });

        test('detach unwires document and connectivity listeners', () => {
            const docRemoveSpy = document.removeEventListener as jest.Mock;
            const subscribersBefore = connectivitySubscribers.length;
            detach();
            expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
            expect(connectivitySubscribers.length).toBe(subscribersBefore - 1);
        });
    });
});
