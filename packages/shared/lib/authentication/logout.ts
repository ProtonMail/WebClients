import createListeners from '@proton/shared/lib/helpers/listeners';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import { getAppHref } from '../apps/helper';
import { getSlugFromApp } from '../apps/slugHelper';
import { PersistedSession } from '../authentication/SessionInterface';
import { stripLocalBasenameFromPathname } from '../authentication/pathnameHelper';
import { requestFork } from '../authentication/sessionForking';
import { APPS, APP_NAMES, SSO_PATHS } from '../constants';
import { replaceUrl } from '../helpers/browser';
import { decodeBase64URL, encodeBase64URL } from '../helpers/encoding';
import { AuthenticationStore } from './createAuthenticationStore';
import { getPersistedSession, removePersistedSession } from './persistedSessionStorage';

const clearRecoveryParam = 'clear-recovery';

const logoutListeners = createListeners<PersistedSession[][], Promise<void>>();

interface PassedSession {
    id: string;
    s: boolean;
}

export const serializeLogoutURL = ({
    persistedSessions,
    clearDeviceRecoveryData,
    appName,
    url,
}: {
    url: URL;
    appName: APP_NAMES;
    persistedSessions: PersistedSession[];
    clearDeviceRecoveryData: boolean | undefined;
}) => {
    const slug = getSlugFromApp(appName);
    if (slug && appName !== APPS.PROTONACCOUNT) {
        url.searchParams.set('product', slug);
    }
    if (clearDeviceRecoveryData) {
        url.searchParams.set(clearRecoveryParam, JSON.stringify(clearDeviceRecoveryData));
    }
    if (persistedSessions.length) {
        const hashParams = new URLSearchParams();
        const sessions = persistedSessions.map((persistedSession): PassedSession => {
            return {
                id: persistedSession.UserID,
                s: persistedSession.isSubUser,
            };
        });
        hashParams.set('sessions', encodeBase64URL(JSON.stringify(sessions)));
        url.hash = hashParams.toString();
    }
    return url;
};

export const getLogoutURL = ({
    type,
    appName,
    mode,
    persistedSessions: inputPersistedSessions,
    clearDeviceRecoveryData,
    reason,
}: {
    type?: 'full' | 'local';
    appName: APP_NAMES;
    mode: 'sso' | 'standalone';
    persistedSessions: PersistedSession[];
    clearDeviceRecoveryData?: boolean;
    reason: 'signout' | 'session-expired';
}) => {
    if (mode === 'sso') {
        let url = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
        url.searchParams.set('reason', reason);

        // If it's not a full logout on account, we just strip the local id from the path in order to get redirected back
        if (appName === APPS.PROTONACCOUNT && type !== 'full') {
            const currentURL = new URL(window.location.href);
            const strippedPathname = stripLocalBasenameFromPathname(currentURL.pathname);
            if (strippedPathname && strippedPathname !== '/') {
                currentURL.pathname = strippedPathname;
                return currentURL.toString();
            }
        }

        const persistedSessions = type === 'full' ? inputPersistedSessions : [];

        return serializeLogoutURL({ appName, url, persistedSessions, clearDeviceRecoveryData }).toString();
    }

    return SSO_PATHS.LOGIN;
};

const parseSessions = (sessions: string | null) => {
    try {
        const result = JSON.parse(decodeBase64URL(sessions || ''));
        if (Array.isArray(result)) {
            return result.map((session): PassedSession => {
                return {
                    id: session.id,
                    s: session.s === true,
                };
            });
        }
        return [];
    } catch (e) {
        return [];
    }
};

export const parseLogoutURL = (url: URL) => {
    const searchParams = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const sessions = parseSessions(hashParams.get('sessions'));
    const reason = searchParams.get('reason') || searchParams.get('flow');
    return {
        logout: reason === 'signout' || reason === 'logout',
        clearDeviceRecoveryData: searchParams.get(clearRecoveryParam) === 'true',
        sessions,
    };
};

export const registerLogoutListener = (listener: (persistedSessions: PersistedSession[]) => Promise<void>) => {
    logoutListeners.subscribe(listener);
};

export const handleLogout = async ({
    appName,
    authentication,
    type,
    clearDeviceRecoveryData,
    localID: maybeLocalID,
    reason = 'signout',
}: {
    appName: APP_NAMES;
    type: 'full' | 'local';
    authentication: AuthenticationStore;
    clearDeviceRecoveryData?: boolean;
    localID?: number;
    reason?: 'signout' | 'session-expired';
}) => {
    const UID = authentication.UID;
    const localID = maybeLocalID ?? authentication.localID;
    const mode = authentication.mode;

    const persistedSessions: PersistedSession[] = [];

    if (UID) {
        removeLastRefreshDate(UID);
    }

    if (localID !== undefined && mode === 'sso') {
        const persistedSession = getPersistedSession(localID);
        if (persistedSession) {
            removePersistedSession(localID, UID);
        }
    }

    if (logoutListeners.length()) {
        await Promise.all(logoutListeners.notify(persistedSessions));
    }

    authentication.logout();

    if (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONVPN_SETTINGS || mode !== 'sso' || type === 'full') {
        replaceUrl(getLogoutURL({ type, appName, reason, mode, persistedSessions, clearDeviceRecoveryData }));
    } else {
        requestFork({ fromApp: appName, localID, reason });
    }
};

export const handleInvalidSession = ({
    appName,
    authentication,
    localID,
}: {
    appName: APP_NAMES;
    authentication: AuthenticationStore;
    localID?: number;
}) => {
    // A session that is invalid should just do a local deletion on its own subdomain, to check if the session still exists on account.
    handleLogout({
        appName,
        reason: 'session-expired',
        authentication,
        type: 'local',
        clearDeviceRecoveryData: false,
        localID,
    });
};
