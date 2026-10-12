import { ipcLogger } from "./log";

const OAUTH_SESSION_TIMEOUT_MS = 10 * 1000; // 10 seconds

type OAuthSession = {
    authorizationUrl: string;
    timeoutHandle: ReturnType<typeof setTimeout>;
};

const sessions = new Map<string, OAuthSession>();

export const startOAuthSession = (sessionId: string, authorizationUrl: string) => {
    // Clear any pre-existing session with the same ID before starting a new one
    clearOAuthSession(sessionId);

    const timeoutHandle = setTimeout(() => {
        ipcLogger.warn(`oauthSession ${sessionId} timed out, clearing state`);
        clearOAuthSession(sessionId);
    }, OAUTH_SESSION_TIMEOUT_MS);

    sessions.set(sessionId, { authorizationUrl, timeoutHandle });
};

export const clearOAuthSession = (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (session) {
        clearTimeout(session.timeoutHandle);
        sessions.delete(sessionId);
    }
};

const oauthWindowIds = new Set<number>();

export const registerOAuthWindow = (id: number) => oauthWindowIds.add(id);
export const unregisterOAuthWindow = (id: number) => oauthWindowIds.delete(id);
export const isOAuthWindow = (id: number) => oauthWindowIds.has(id);

export const matchesActiveOAuthSession = (url: string): boolean => {
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
