import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { clearSession } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import type { Api } from '@proton/shared/lib/interfaces';

import { type ExternalSessionPayload, buildExternalSessionsViaFork } from '../remote/externalSession';
import { sendSessionMigrationToNative } from '../remote/nativeAuthBridge';
import { type NativeAuthFlags, canUseNativeAuth, isNativeAuthFlagEnabled, isNativeMobileApp } from './userAgent';

const MIGRATED_KEY_PREFIX = 'lumo:native-session-migrated:';

const migratedKey = (uid: string) => `${MIGRATED_KEY_PREFIX}${uid}`;

/**
 * Target Proton userId the native shell puts in the URL fragment when it switches account. In the
 * fragment, not the query, so it never reaches the server. Cross-repo contract: must match the
 * Android shell's `SWITCH_USER_ID_PARAM`.
 */
export const NATIVE_SWITCH_USER_ID_PARAM = 'native-switch-user-id';

// replaceState, not `location.hash = ...`, which pushes a history entry and leaves a bare `#`.
const stripNativeSwitchParam = (params: URLSearchParams): void => {
    params.delete(NATIVE_SWITCH_USER_ID_PARAM);
    const rest = params.toString();
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}${rest ? `#${rest}` : ''}`);
};

/**
 * Resolves the switch param to a persisted localID for bootstrap to pass to `loadSession`, so the
 * switch lands on the intended account instead of the last-used one.
 *
 * Single-use: the param is stripped once read, resolved or not. Bootstrap otherwise keeps
 * re-applying it — `loadSession` returns the path with the fragment, `createHistory` replays it,
 * and `requestFork` stashes the whole href — so it survives a fork round-trip and pins later
 * reloads to an account the app may no longer be running as.
 *
 * Not on the fork path: a defined localID makes `loadSession` skip fork consumption, silently
 * dropping the login. The fragment there belongs to the fork params, so leave it alone.
 */
export const consumeNativeSwitchLocalID = (pathname: string): number | undefined => {
    if (typeof window === 'undefined' || pathname.startsWith(SSO_PATHS.FORK)) {
        return undefined;
    }
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const userId = params.get(NATIVE_SWITCH_USER_ID_PARAM);
    if (!userId) {
        return undefined;
    }
    stripNativeSwitchParam(params);
    return getPersistedSessions().find((session) => session.UserID === userId)?.localID;
};

const wasPreviouslyForked = (uid: string): boolean => {
    try {
        return localStorage.getItem(migratedKey(uid)) === '1';
    } catch {
        return false;
    }
};

const markForked = (uid: string): void => {
    try {
        localStorage.setItem(migratedKey(uid), '1');
    } catch {
        // Non-fatal: worst case we re-attempt migration on the next load.
    }
};

const unmarkForked = (uid: string): void => {
    try {
        localStorage.removeItem(migratedKey(uid));
    } catch {
        // Non-fatal.
    }
};

/**
 * Revokes and removes one account's persisted web session. Used on a `terminal` outcome: native has
 * given up adopting it, so we drop the now-orphaned copy. Unmarking lets a future re-login of the
 * same account retry migration cleanly.
 */
const dropMigratedAccount = (userId: string, api: Api, authentication?: AuthenticationStore): void => {
    const session = getPersistedSessions().find((persisted) => persisted.UserID === userId);
    if (session) {
        // Revoking the active session pulls the auth out from under the running app, so send it to
        // /guest rather than let it keep running on a dead token.
        const isActiveSession = authentication?.getUID() === session.UID;
        clearSession({ session, api, revokeSession: true });
        if (isActiveSession) {
            replaceUrl(getAppHref('/guest', APPS.PROTONLUMO));
        }
    }
    unmarkForked(userId);
};

/**
 * Registers `window.lumoNativeMigrationOutcome`, which native calls per account once it's done
 * handling a migrated session (native `WebAppInterface.signalMigrationOutcome`):
 *  - `retryable` — unmark, so the next bootstrap re-pushes it
 *  - `terminal` — drop the web session so both sides converge
 *  - anything else (success) — leave the mark set and stop re-pushing
 *
 * Old native clients never call this and keep today's mark-on-push behaviour.
 */
export const registerNativeMigrationOutcomeHandler = ({
    api,
    authentication,
}: {
    api: Api;
    authentication?: AuthenticationStore;
}): void => {
    (window as any).lumoNativeMigrationOutcome = (userId: string, outcome: string) => {
        console.log('lumoNativeMigrationOutcome', { userId, outcome });
        if (outcome === 'retryable') {
            unmarkForked(userId);
        } else if (outcome === 'terminal') {
            dropMigratedAccount(userId, api, authentication);
        }
    };
};

/**
 * Adopts legacy web-auth sessions into native auth: forks each not-yet-migrated session, reads its
 * refresh token and pushes the {@link ExternalSessionPayload} over the auth bridge.
 *
 * Only runs inside the native WebView (`ProtonLumo/` UA) on a version that supports native auth
 * (iOS >= 2.1.0, Android >= 2.1.0), with the native-auth flag on for that platform and a logged-in
 * web session. Best-effort: failures are logged and swallowed so they never block bootstrap.
 *
 * The flag gate matters as much as the version gate: pushing a session to a native app whose auth
 * is still switched off strands it — web marks the account migrated while native never adopts it.
 * `nativeAuthFlags` is passed in rather than read here because this runs outside React; the caller
 * is responsible for reading it once the Unleash toggles have resolved.
 */
export const maybeMigrateLegacySessionToNative = async ({
    api,
    authentication,
    pathname,
    nativeAuthFlags,
}: {
    api: Api;
    authentication: AuthenticationStore;
    pathname: string;
    nativeAuthFlags: NativeAuthFlags;
}): Promise<void> => {
    console.log('maybeMigrateLegacySessionToNative', isNativeMobileApp(), canUseNativeAuth());
    if (!isNativeMobileApp() || !canUseNativeAuth()) {
        return;
    }

    if (!isNativeAuthFlagEnabled(nativeAuthFlags)) {
        console.log('maybeMigrateLegacySessionToNative: native auth flag off for this platform');
        return;
    }

    console.log('maybeMigrateLegacySessionToNative', authentication.hasSession());
    if (!authentication.hasSession()) {
        return;
    }

    // Login/fork-consume path: push nothing and leave the account unmarked on purpose, so the next
    // bootstrap pushes it. Don't "optimise" that into a mark here — native only records an account
    // as forked by adopting a push, and it won't emit a switch for one it hasn't
    // (LumoAccountRepository.switchAccounts).
    if (pathname.startsWith(SSO_PATHS.FORK)) {
        return;
    }

    // Migration path: push only accounts native hasn't migrated yet, keyed per-account by userId.
    const unmigratedLocalIDs = getPersistedSessions()
        .filter((session) => !wasPreviouslyForked(session.UserID))
        .map((session) => session.localID);
    if (unmigratedLocalIDs.length === 0) {
        return;
    }

    try {
        const { payloads, delivered } = await buildExternalAndSendToNative({
            api,
            localIDs: unmigratedLocalIDs,
        });
        // Only mark what the bridge confirmed it took. Marking an undelivered (or failed) fork
        // would strand the account: migrated on our side, never received on theirs, never retried.
        if (delivered && payloads.length) {
            payloads.forEach((payload) => markForked(payload.userId));
            console.log(`Legacy session migration: sent ${payloads.length} external session(s) to native`);
        }
    } catch (e) {
        console.error('Legacy session migration: failed to migrate session to native:', e);
    }
};

const buildExternalAndSendToNative = async ({
    api,
    localIDs,
}: {
    api: Api;
    localIDs?: number[];
}): Promise<{ payloads: ExternalSessionPayload[]; delivered: boolean }> => {
    const payloads = await buildExternalSessionsViaFork({ api, localIDs });
    const delivered = sendSessionMigrationToNative(payloads);
    return { payloads, delivered };
};
