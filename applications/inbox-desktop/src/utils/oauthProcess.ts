import { ipcLogger } from "./log";

const OAUTH_PROCESS_TIMEOUT_MS = 20 * 1000; // 20 seconds

type OAuthSession = {
    authorizationUrl: string;
    timeoutHandle: ReturnType<typeof setTimeout>;
};

const sessions = new Map<string, OAuthSession>();

const syncOAuthProcessGlobal = () => {
    global.oauthProcess = sessions.size > 0;
};

export const startOAuthSession = (sessionId: string, authorizationUrl: string) => {
    // Clear any pre-existing session with the same ID before starting a new one
    clearOAuthSession(sessionId);

    const timeoutHandle = setTimeout(() => {
        ipcLogger.warn(`oauthProcess session ${sessionId} timed out, clearing state`);
        clearOAuthSession(sessionId);
    }, OAUTH_PROCESS_TIMEOUT_MS);

    sessions.set(sessionId, { authorizationUrl, timeoutHandle });
    syncOAuthProcessGlobal();
};

export const clearOAuthSession = (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (session) {
        clearTimeout(session.timeoutHandle);
        sessions.delete(sessionId);
    }
    syncOAuthProcessGlobal();
};

export const isDynamicOAuthURL = (url: string): boolean => {
    if (sessions.size === 0) return false;
    try {
        const incoming = new URL(url);
        for (const { authorizationUrl } of sessions.values()) {
            const stored = new URL(authorizationUrl);
            if (incoming.origin === stored.origin && incoming.pathname.startsWith(stored.pathname)) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
};
