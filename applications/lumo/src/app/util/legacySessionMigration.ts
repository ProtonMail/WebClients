import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { buildExternalSessionsViaFork } from '../remote/externalSession';
import { sendSessionMigrationToNative } from '../remote/nativeAuthBridge';
import { canUseNativeAuth, isNativeMobileApp } from './userAgent';

const MIGRATED_KEY_PREFIX = 'lumo:native-session-migrated:';

const migratedKey = (uid: string) => `${MIGRATED_KEY_PREFIX}${uid}`;

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

/**
 * Seamlessly adopt a legacy web-auth session into native auth.
 *
 * Runs only when:
 *  - we're inside the native mobile WebView (`ProtonLumo/` UA), and
 *  - the native app supports native auth (version >= 2.0.0), and
 *  - there's a logged-in web session that wasn't previously forked to native.
 *
 * It mints an independent fork of the current session, reads its refresh token,
 * and pushes the resulting {@link ExternalSessionPayload} to native over the
 * auth bridge. The work is best-effort: any failure is logged and swallowed so
 * it never blocks app bootstrap.
 */
export const maybeMigrateLegacySessionToNative = async ({
    api,
    authentication,
    pathname,
}: {
    api: Api;
    authentication: AuthenticationStore;
    pathname: string;
}): Promise<void> => {
    console.log('maybeMigrateLegacySessionToNative', isNativeMobileApp(), canUseNativeAuth());
    if (!isNativeMobileApp() || !canUseNativeAuth()) {
        return;
    }

    console.log('maybeMigrateLegacySessionToNative', authentication.hasSession());
    if (!authentication.hasSession()) {
        return;
    }

    const uid = authentication.getUID();
    if (pathname.startsWith(SSO_PATHS.FORK)) {
        await buildExternalAndSendToNative({ api, authentication, pathname });

        return;
    }

    console.log('maybeMigrateLegacySessionToNative', wasPreviouslyForked(uid));
    if (wasPreviouslyForked(uid)) {
        return;
    }

    try {
        await buildExternalAndSendToNative({ api, authentication, pathname });
        console.log('Legacy session migration: sent external session to native');
    } catch (e) {
        console.error('Legacy session migration: failed to migrate session to native:', e);
    }
};

const buildExternalAndSendToNative = async ({
    api,
    authentication,
    pathname,
}: {
    api: Api;
    authentication: AuthenticationStore;
    pathname: string;
}): Promise<void> => {
    const uid = authentication.getUID();

    const payloads = await buildExternalSessionsViaFork({ api, pathname });
    sendSessionMigrationToNative(payloads);
    markForked(uid);
};
