import type { Mock } from 'vitest';

import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { clearSession } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { buildExternalSessionsViaFork } from '../remote/externalSession';
import { sendSessionMigrationToNative } from '../remote/nativeAuthBridge';
import {
    NATIVE_SWITCH_USER_ID_PARAM,
    consumeNativeSwitchLocalID,
    maybeMigrateLegacySessionToNative,
    registerNativeMigrationOutcomeHandler,
} from './legacySessionMigration';
import { canUseNativeAuth, isNativeAuthFlagEnabled, isNativeMobileApp } from './userAgent';

vi.mock('../remote/externalSession', () => ({ buildExternalSessionsViaFork: vi.fn() }));
vi.mock('../remote/nativeAuthBridge', () => ({ sendSessionMigrationToNative: vi.fn() }));
vi.mock('./userAgent', () => ({
    isNativeMobileApp: vi.fn(),
    canUseNativeAuth: vi.fn(),
    isNativeAuthFlagEnabled: vi.fn(),
}));
vi.mock('@proton/shared/lib/authentication/persistedSessionStorage', () => ({ getPersistedSessions: vi.fn() }));
vi.mock('@proton/shared/lib/authentication/handleLogoutFromURL', () => ({ clearSession: vi.fn() }));
vi.mock('@proton/shared/lib/helpers/browser', () => ({ replaceUrl: vi.fn() }));

const migratedKey = (userId: string) => `lumo:native-session-migrated:${userId}`;

describe('registerNativeMigrationOutcomeHandler', () => {
    const api = {} as Api;

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        (getPersistedSessions as Mock).mockReturnValue([]);
        registerNativeMigrationOutcomeHandler({ api });
    });

    afterEach(() => {
        delete (window as any).lumoNativeMigrationOutcome;
    });

    const invokeOutcome = (userId: string, outcome: string) =>
        (window as any).lumoNativeMigrationOutcome(userId, outcome);

    it('clears the migrated flag only for the signalled account on a retryable outcome', () => {
        localStorage.setItem(migratedKey('user-a'), '1');
        localStorage.setItem(migratedKey('user-b'), '1');

        invokeOutcome('user-a', 'retryable');

        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();
        expect(localStorage.getItem(migratedKey('user-b'))).toBe('1');
        expect(clearSession).not.toHaveBeenCalled();
    });

    it('leaves the migrated flag set and drops nothing on an unknown outcome', () => {
        localStorage.setItem(migratedKey('user-a'), '1');
        invokeOutcome('user-a', 'ok');
        expect(localStorage.getItem(migratedKey('user-a'))).toBe('1');
        expect(clearSession).not.toHaveBeenCalled();
    });

    it('drops the signalled account and clears its flag on a terminal outcome', () => {
        const session = { localID: 1, UserID: 'user-a', UID: 'uid-a' };
        (getPersistedSessions as Mock).mockReturnValue([session, { localID: 2, UserID: 'user-b', UID: 'uid-b' }]);
        localStorage.setItem(migratedKey('user-a'), '1');
        localStorage.setItem(migratedKey('user-b'), '1');

        invokeOutcome('user-a', 'terminal');

        // only user-a's session is revoked + removed, keyed by its Proton userId
        expect(clearSession).toHaveBeenCalledTimes(1);
        expect(clearSession).toHaveBeenCalledWith({ session, api, revokeSession: true });
        // its flag is cleared so a future re-login re-attempts; user-b is untouched
        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();
        expect(localStorage.getItem(migratedKey('user-b'))).toBe('1');
    });

    it('still clears the flag on terminal when no persisted session matches', () => {
        (getPersistedSessions as Mock).mockReturnValue([]);
        localStorage.setItem(migratedKey('user-a'), '1');

        invokeOutcome('user-a', 'terminal');

        expect(clearSession).not.toHaveBeenCalled();
        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();
    });

    it('does not redirect on terminal when the dropped account is not the active session', () => {
        const session = { localID: 1, UserID: 'user-a', UID: 'uid-a' };
        (getPersistedSessions as Mock).mockReturnValue([session]);
        const authentication = { getUID: () => 'uid-other' } as unknown as AuthenticationStore;
        registerNativeMigrationOutcomeHandler({ api, authentication });

        invokeOutcome('user-a', 'terminal');

        expect(clearSession).toHaveBeenCalledWith({ session, api, revokeSession: true });
        expect(replaceUrl).not.toHaveBeenCalled();
    });

    it('redirects to /guest on terminal when the dropped account is the active session', () => {
        const session = { localID: 1, UserID: 'user-a', UID: 'uid-a' };
        (getPersistedSessions as Mock).mockReturnValue([session]);
        const authentication = { getUID: () => 'uid-a' } as unknown as AuthenticationStore;
        registerNativeMigrationOutcomeHandler({ api, authentication });

        invokeOutcome('user-a', 'terminal');

        expect(clearSession).toHaveBeenCalledWith({ session, api, revokeSession: true });
        expect(replaceUrl).toHaveBeenCalledTimes(1);
    });
});

describe('maybeMigrateLegacySessionToNative (per-account push)', () => {
    let authentication: AuthenticationStore;
    // Only the object identity matters here: which of the two flags applies is decided by
    // isNativeAuthFlagEnabled, which is unit-tested against the user agent in userAgent.test.ts.
    const nativeAuthFlags = { android: true, ios: true };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        (isNativeMobileApp as Mock).mockReturnValue(true);
        (canUseNativeAuth as Mock).mockReturnValue(true);
        (isNativeAuthFlagEnabled as Mock).mockReturnValue(true);
        authentication = { hasSession: () => true } as unknown as AuthenticationStore;
    });

    it.each([
        ['not running inside the native app', () => (isNativeMobileApp as Mock).mockReturnValue(false)],
        ['the native app is too old for native auth', () => (canUseNativeAuth as Mock).mockReturnValue(false)],
        [
            // Pushing to a platform whose rollout is still off would strand the account: marked
            // migrated on our side, never adopted on theirs.
            'the native-auth flag is off for this platform',
            () => (isNativeAuthFlagEnabled as Mock).mockReturnValue(false),
        ],
        [
            'there is no logged-in web session',
            () => {
                authentication = { hasSession: () => false } as unknown as AuthenticationStore;
            },
        ],
    ])('does not fork, push or mark when %s', async (_, disableGuard) => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 1, UserID: 'user-a', UID: 'uid-a' }]);
        disableGuard();

        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        expect(buildExternalSessionsViaFork).not.toHaveBeenCalled();
        expect(sendSessionMigrationToNative).not.toHaveBeenCalled();
        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();
    });

    it('resolves the platform gate from the flags it is given', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 1, UserID: 'user-a', UID: 'uid-a' }]);
        (buildExternalSessionsViaFork as Mock).mockResolvedValue([{ userId: 'user-a' }]);
        (sendSessionMigrationToNative as Mock).mockReturnValue(true);

        await maybeMigrateLegacySessionToNative({
            api: {} as Api,
            authentication,
            nativeAuthFlags: { android: false, ios: true },
            pathname: '/',
        });

        // Both flags are handed over untouched; the platform is picked inside the resolver.
        expect(isNativeAuthFlagEnabled).toHaveBeenCalledWith({ android: false, ios: true });
    });

    it('re-pushes once the flag is turned on for the platform', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 1, UserID: 'user-a', UID: 'uid-a' }]);
        (buildExternalSessionsViaFork as Mock).mockResolvedValue([{ userId: 'user-a' }]);
        (sendSessionMigrationToNative as Mock).mockReturnValue(true);

        // Flag off: nothing goes out and, crucially, nothing is marked...
        (isNativeAuthFlagEnabled as Mock).mockReturnValue(false);
        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });
        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();

        // ...so the account is still eligible on the boot after the rollout reaches it.
        (isNativeAuthFlagEnabled as Mock).mockReturnValue(true);
        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        expect(sendSessionMigrationToNative).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem(migratedKey('user-a'))).toBe('1');
    });

    it('forks and marks only accounts not already migrated', async () => {
        (getPersistedSessions as Mock).mockReturnValue([
            { localID: 1, UserID: 'user-a', UID: 'uid-a' },
            { localID: 2, UserID: 'user-b', UID: 'uid-b' },
        ]);
        localStorage.setItem(migratedKey('user-a'), '1'); // already migrated
        (buildExternalSessionsViaFork as Mock).mockResolvedValue([{ userId: 'user-b' }]);
        (sendSessionMigrationToNative as Mock).mockReturnValue(true);

        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        // only the un-migrated account's localID is forked and pushed
        expect(buildExternalSessionsViaFork).toHaveBeenCalledWith(expect.objectContaining({ localIDs: [2] }));
        expect(sendSessionMigrationToNative).toHaveBeenCalledWith([{ userId: 'user-b' }]);
        // it is now marked; the already-migrated account is untouched
        expect(localStorage.getItem(migratedKey('user-b'))).toBe('1');
        expect(localStorage.getItem(migratedKey('user-a'))).toBe('1');
    });

    it('does nothing when every account is already migrated', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 1, UserID: 'user-a', UID: 'uid-a' }]);
        localStorage.setItem(migratedKey('user-a'), '1');

        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        expect(buildExternalSessionsViaFork).not.toHaveBeenCalled();
        expect(sendSessionMigrationToNative).not.toHaveBeenCalled();
    });

    it('does not mark accounts migrated when the payloads were not delivered to a native bridge', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 1, UserID: 'user-a', UID: 'uid-a' }]);
        (buildExternalSessionsViaFork as Mock).mockResolvedValue([{ userId: 'user-a' }]);
        // Bridge not detected / posting failed -> not delivered.
        (sendSessionMigrationToNative as Mock).mockReturnValue(false);

        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        expect(sendSessionMigrationToNative).toHaveBeenCalledWith([{ userId: 'user-a' }]);
        // Left unmarked so the account is re-pushed on the next bootstrap.
        expect(localStorage.getItem(migratedKey('user-a'))).toBeNull();
    });

    it('reports nothing on the fork path and leaves the account unmarked', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 2, UserID: 'user-b', UID: 'uid-b' }]);

        await maybeMigrateLegacySessionToNative({
            api: {} as Api,
            authentication,
            nativeAuthFlags,
            pathname: '/login',
        });

        expect(buildExternalSessionsViaFork).not.toHaveBeenCalled();
        expect(sendSessionMigrationToNative).not.toHaveBeenCalled();
        // Deliberately unmarked: the next bootstrap must push it. Marking here means native never
        // records the account, and it can then never switch to it.
        expect(localStorage.getItem(migratedKey('user-b'))).toBeNull();
    });

    it('pushes a fork-path account on the next bootstrap', async () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 2, UserID: 'user-b', UID: 'uid-b' }]);
        (buildExternalSessionsViaFork as Mock).mockResolvedValue([{ userId: 'user-b' }]);
        (sendSessionMigrationToNative as Mock).mockReturnValue(true);

        // Fork-consume bootstrap: pushes nothing.
        await maybeMigrateLegacySessionToNative({
            api: {} as Api,
            authentication,
            nativeAuthFlags,
            pathname: '/login',
        });
        // Next app launch: still unmarked, so it goes out now. That push is what registers it
        // natively (LumoAccountRepository.migrate marks it forked), which is what lets native emit
        // a switch for it.
        await maybeMigrateLegacySessionToNative({ api: {} as Api, authentication, nativeAuthFlags, pathname: '/' });

        expect(buildExternalSessionsViaFork).toHaveBeenCalledTimes(1);
        expect(buildExternalSessionsViaFork).toHaveBeenCalledWith(expect.objectContaining({ localIDs: [2] }));
        expect(sendSessionMigrationToNative).toHaveBeenCalledWith([{ userId: 'user-b' }]);
        expect(localStorage.getItem(migratedKey('user-b'))).toBe('1');
    });
});

describe('consumeNativeSwitchLocalID', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState(null, '', '/');
    });

    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it("resolves the switch userId (from the URL fragment) to that account's persisted localID", () => {
        (getPersistedSessions as Mock).mockReturnValue([
            { localID: 3, UserID: 'user-a', UID: 'uid-a' },
            { localID: 7, UserID: 'user-b', UID: 'uid-b' },
        ]);
        window.location.hash = `#${NATIVE_SWITCH_USER_ID_PARAM}=user-b`;

        expect(consumeNativeSwitchLocalID('/')).toBe(7);
    });

    it('returns undefined when the fragment param is absent', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 3, UserID: 'user-a', UID: 'uid-a' }]);
        window.location.hash = '#foo=bar';

        expect(consumeNativeSwitchLocalID('/')).toBeUndefined();
    });

    it('returns undefined when no persisted session matches the userId', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 3, UserID: 'user-a', UID: 'uid-a' }]);
        window.location.hash = `#${NATIVE_SWITCH_USER_ID_PARAM}=user-x`;

        expect(consumeNativeSwitchLocalID('/')).toBeUndefined();
    });

    it('returns undefined on the fork path even when the param resolves, so fork consumption still runs', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 3, UserID: 'user-a', UID: 'uid-a' }]);
        window.location.hash = `#${NATIVE_SWITCH_USER_ID_PARAM}=user-a`;

        // A defined localID makes loadSession skip maybeConsumeFork, which would silently drop the
        // login and resume the last-used session instead.
        expect(consumeNativeSwitchLocalID('/login')).toBeUndefined();
        // Not ours to consume on this path: the fork params own the fragment here.
        expect(window.location.hash).toBe(`#${NATIVE_SWITCH_USER_ID_PARAM}=user-a`);
    });

    it('strips the param from the URL so a later reload is no longer pinned to that account', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 7, UserID: 'user-b', UID: 'uid-b' }]);
        window.location.hash = `#${NATIVE_SWITCH_USER_ID_PARAM}=user-b`;

        expect(consumeNativeSwitchLocalID('/')).toBe(7);

        expect(window.location.hash).toBe('');
        expect(consumeNativeSwitchLocalID('/')).toBeUndefined();
    });

    it('strips the param even when it resolved to nothing, so a stale request cannot linger', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 3, UserID: 'user-a', UID: 'uid-a' }]);
        window.location.hash = `#${NATIVE_SWITCH_USER_ID_PARAM}=user-x`;

        expect(consumeNativeSwitchLocalID('/')).toBeUndefined();
        expect(window.location.hash).toBe('');
    });

    it('keeps the rest of the fragment and the search intact', () => {
        (getPersistedSessions as Mock).mockReturnValue([{ localID: 7, UserID: 'user-b', UID: 'uid-b' }]);
        window.history.replaceState(null, '', `/c/123?ref=x#foo=bar&${NATIVE_SWITCH_USER_ID_PARAM}=user-b`);

        expect(consumeNativeSwitchLocalID('/c/123')).toBe(7);

        expect(window.location.pathname).toBe('/c/123');
        expect(window.location.search).toBe('?ref=x');
        expect(window.location.hash).toBe('#foo=bar');
    });
});
