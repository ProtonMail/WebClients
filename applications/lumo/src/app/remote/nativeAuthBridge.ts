export type NativeAccountAction = 'AddAccount' | 'LogIn' | 'SignUp' | 'SignOut' | 'WebAccountSettings';

/**
 * Wire format the bridge sends to native for session adoption. Mirrors the
 * native `ExternalSession`: userId, sessionId, refreshToken, keySecret
 * (SensitiveBytes?), eventId (String?).
 *
 * Defined here (not in externalSession.ts) on purpose: this module is loaded as
 * a bare side-effect import (see lumoBootstrap.ts / GuestApp.tsx) to register
 * `window.nativeAuthApiInstance`, so it MUST stay a dependency-free leaf. Pulling
 * in externalSession.ts would drag heavy @proton/shared crypto into that early
 * import and can prevent the bridge instance from being created.
 */
export interface ExternalSessionPayload {
    userId: string;
    username: string | null;
    sessionId: string;
    refreshToken: string;
    keySecret: string | null;
    eventId: string | null;
    /**
     * Not read by native — account correlation is done via {@link userId}. Kept present and
     * nullable for wire-format stability only: this payload is deserialized by native clients
     * across versions that a single web deploy reaches at once, and removing an established field
     * is riskier than keeping an ignored one. (iOS treats it as optional today; Android is the
     * first native-auth release.)
     */
    localId: number | null;
}

/**
 * Hand one or more {@link ExternalSessionPayload} objects to the native client so
 * it can adopt them via `migrateExternalSessions`. Native registers an
 * `onSessionMigration` JS interface (Android) / `nativeAuthHandler` message
 * handler (iOS, not yet wired) that receives the JSON-encoded session list.
 *
 * Returns `true` when the payload was handed to a native bridge, `false` when no
 * bridge was detected or posting threw. Callers must only treat the sessions as
 * migrated (and skip future re-pushes) when this returns `true` — otherwise the
 * accounts would be marked migrated while native never received them.
 */
export const sendSessionMigrationToNative = (sessions: ExternalSessionPayload[]): boolean => {
    const payload = JSON.stringify(sessions);
    console.log('Native Auth Bridge: Sending session migration to native', { count: sessions.length });
    try {
        if ((window as any).webkit?.messageHandlers?.nativeAuthHandler) {
            (window as any).webkit.messageHandlers.nativeAuthHandler.postMessage({
                action: 'MigrateSession',
                sessions,
            });
            return true;
        }
        if ((window as any).Android?.onSessionMigration) {
            (window as any).Android.onSessionMigration(payload);
            return true;
        }
        console.warn('Native Auth Bridge: Native bridge not detected for session migration.');
        return false;
    } catch (e) {
        console.error('Native Auth Bridge: Error sending session migration to native:', e);
        return false;
    }
};

const sendAccountActionToNative = (action: NativeAccountAction): void => {
    const message = { action };
    console.log('Native Auth Bridge: Sending account action to native', message);
    try {
        if ((window as any).webkit?.messageHandlers?.nativeAuthHandler) {
            (window as any).webkit.messageHandlers.nativeAuthHandler.postMessage(message);
        } else if ((window as any).Android?.onAccountAction) {
            (window as any).Android.onAccountAction(action);
        } else {
            console.warn('Native Auth Bridge: Native bridge not detected. Action:', action);
        }
    } catch (e) {
        console.error('Native Auth Bridge: Error sending account action to native:', e);
    }
};

class NativeAuthApi {
    constructor() {
        console.log('NativeAuthApi instance created');
    }

    public onAccountAction(action: NativeAccountAction): void {
        console.log(`NativeAuthApi: onAccountAction(${action})`);
        sendAccountActionToNative(action);
    }
}

try {
    (window as any).nativeAuthApiInstance = new NativeAuthApi();
    console.log('Native Auth Bridge: NativeAuthApi instance created and exposed as window.nativeAuthApiInstance');
} catch (error) {
    console.error('Native Auth Bridge: Failed to initialize NativeAuthApi bridge:', error);
}
