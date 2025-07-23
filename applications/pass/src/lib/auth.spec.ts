import { ARGON2_PARAMS } from '@proton/crypto/lib';
import { getInitialAppState } from '@proton/pass/components/Core/AppStateManager';
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthOptions } from '@proton/pass/lib/auth/service';
import { authStore, createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { AppStatus } from '@proton/pass/types';
import createStore from '@proton/shared/lib/helpers/store';

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
exposeAuthStore(createAuthStore(createStore()));
exposeApi({ subscribe: jest.fn() } as any);

const config = { SSO_URL: 'test://' } as PassConfig;

const settings = {
    resolve: jest.fn(() => Promise.resolve({})),
    read: jest.fn(() => Promise.resolve({})),
};

const app = {
    getState: getInitialAppState,
    reset: jest.fn(),
    setAuthorized: jest.fn(),
    setBooted: jest.fn(),
    setLocalID: jest.fn(),
    setState: jest.fn(),
    setStatus: jest.fn(),
    setUID: jest.fn(),
    subscribe: jest.fn(),
};

const history = { replace: jest.fn(), location: { pathname: '/', search: '', state: null, hash: '' } } as any;
const sw = { on: jest.fn(), off: jest.fn() } as any;
const core = { settings, i18n: { setLocale: jest.fn() } } as any;
const authSwitch = { sync: jest.fn() } as any;
const getOnline = jest.fn(() => true);

const authService = auth.createAuthService({
    app,
    authSwitch,
    config,
    core,
    history,
    sw,
    getOnline,
    onNotification: jest.fn(),
} as any);

const resumeSession = jest.spyOn(authService, 'resumeSession');
const login = jest.spyOn(authService, 'login');
const requestFork = jest.spyOn(authService, 'requestFork').mockImplementation();
const getPersistedSession = jest.spyOn(authService.config, 'getPersistedSession');
const clear = jest.spyOn(authStore, 'clear');
const validSession = jest.spyOn(authStore, 'validSession');
const hasSession = jest.spyOn(authStore, 'hasSession');

jest.spyOn(sessions, 'getDefaultLocalID').mockImplementation(() => undefined);
jest.spyOn(sessions, 'getPersistedLocalIDsForUserID').mockImplementation(() => []);
jest.spyOn(storage, 'clearUserLocalData').mockImplementation(() => []);
jest.spyOn(storage, 'localGarbageCollect').mockImplementation(() => Promise.resolve());

describe('AuthService', () => {
    beforeEach(() => {
        authStore.clear();
        history.location = { pathname: '/', search: '', state: null, hash: '' };

        jest.clearAllMocks();

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
            login.mockImplementation(async () => true);

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(true);
            expect(login).toHaveBeenCalled();
            expect(options.forceLock).toBe(false);
        });

        test('should set `forceLock` to true if local ID conflict', async () => {
            /** When in-memory session has localID 41 but URL requests different localID
             * that has a persisted session, force password lock to switch accounts */

            /** Mock valid in-memory session for localID 41 */
            validSession.mockImplementationOnce(() => true);
            authStore.setLocalID(41);

            /** Simulate accessing URL for different localID with persisted session */
            history.location.pathname = `/u/${MOCK_PERSISTED_SESSION}/some/path`;
            getPersistedSession.mockImplementationOnce(async () => MOCK_PERSISTED_SESSION);

            const options: AuthOptions = {};
            const result = await authService.init(options);

            expect(result).toBe(false);
            expect(options.forceLock).toBe(true);
            expect(resumeSession).not.toHaveBeenCalled();
            expect(clear).toHaveBeenCalled();
            expect(app.setStatus).toHaveBeenCalledWith(AppStatus.PASSWORD_LOCKED);
        });

        test('should set `forceLock` to true when offline with valid session', async () => {
            /** When user has valid session but is offline, force lock screen
             * to require local authentication (biometrics/password) */

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
            getOnline.mockReturnValueOnce(false);

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
            resumeSession.mockImplementation(async () => true);

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

            /** Setup valid in-memory session and persisted session */
            validSession.mockImplementationOnce(() => true);
            authStore.setLocalID(MOCK_PERSISTED_SESSION.LocalID);
            getPersistedSession.mockImplementationOnce(async () => MOCK_PERSISTED_SESSION);

            /** Simulate malformed URL with empty localID */
            history.location.pathname = '/u/';
            resumeSession.mockImplementation(async () => true);

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
});
