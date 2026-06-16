export type NativeAccountAction = 'AddAccount' | 'LogIn' | 'SignUp' | 'SignOut' | 'SignOutAll';

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
    localId: number | null;
    canMigrate: boolean;
}

/**
 * Hand one or more {@link ExternalSessionPayload} objects to the native client so
 * it can adopt them via `migrateExternalSessions`. Native registers an
 * `onSessionMigration` JS interface (Android) / `nativeAuthHandler` message
 * handler (iOS, not yet wired) that receives the JSON-encoded session list.
 */
export const sendSessionMigrationToNative = (sessions: ExternalSessionPayload[]): void => {
    const payload = JSON.stringify(sessions);
    console.log('Native Auth Bridge: Sending session migration to native', { count: sessions.length });
    try {
        if ((window as any).webkit?.messageHandlers?.nativeAuthHandler) {
            (window as any).webkit.messageHandlers.nativeAuthHandler.postMessage({
                action: 'MigrateSession',
                sessions,
            });
        } else if ((window as any).Android?.onSessionMigration) {
            (window as any).Android.onSessionMigration(payload);
        } else {
            console.warn('Native Auth Bridge: Native bridge not detected for session migration.');
        }
    } catch (e) {
        console.error('Native Auth Bridge: Error sending session migration to native:', e);
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
