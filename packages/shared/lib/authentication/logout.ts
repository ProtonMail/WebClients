import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import noop from '@proton/utils/noop';

import { removeLastRefreshDate } from '../api/helpers/refreshStorage';
import { getAppHref } from '../apps/helper';
import { getSlugFromApp } from '../apps/slugHelper';
import { APPS, APP_NAMES, SSO_PATHS } from '../constants';
import { replaceUrl } from '../helpers/browser';
import { decodeBase64URL, encodeBase64URL } from '../helpers/encoding';
import { PersistedSession } from './SessionInterface';
import { AuthenticationStore } from './createAuthenticationStore';
import { requestFork } from './fork/consume';
import { ExtraSessionForkData } from './interface';
import { stripLocalBasenameFromPathname } from './pathnameHelper';
import { getPersistedSession, removePersistedSession } from './persistedSessionStorage';

const clearRecoveryParam = 'clear-recovery';

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
    localID,
}: {
    type?: 'full' | 'local';
    appName: APP_NAMES;
    mode: 'sso' | 'standalone';
    persistedSessions: PersistedSession[];
    clearDeviceRecoveryData?: boolean;
    reason: 'signout' | 'session-expired';
    localID: number;
}) => {
    if (mode === 'sso') {
        // If it's not a full logout on account, we just strip the local id from the path in order to get redirected back
        if (appName === APPS.PROTONACCOUNT && type !== 'full') {
            const url = new URL(window.location.href);
            url.pathname = stripLocalBasenameFromPathname(url.pathname);
            if (localID !== undefined) {
                url.searchParams.set(ForkSearchParameters.LocalID, `${localID}`);
            }
            return url.toString();
        }

        const url = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
        url.searchParams.set('reason', reason);
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

export const handleLogout = async ({
    appName,
    authentication,
    type,
    clearDeviceRecoveryData,
    reason = 'signout',
    extra,
}: {
    appName: APP_NAMES;
    type: 'full' | 'local';
    authentication: AuthenticationStore;
    clearDeviceRecoveryData?: boolean;
    reason?: 'signout' | 'session-expired';
    extra?: ExtraSessionForkData;
}) => {
    const UID = authentication.UID;
    const localID = extra?.localID ?? authentication.localID;
    const mode = authentication.mode;

    const persistedSessions: PersistedSession[] = [];

    if (UID) {
        removeLastRefreshDate(UID);
    }

    if (localID !== undefined && mode === 'sso') {
        const persistedSession = getPersistedSession(localID);
        if (persistedSession) {
            persistedSessions.push(persistedSession);
            await removePersistedSession(localID, UID).catch(noop);
        }
    }

    authentication.logout();

    if (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONVPN_SETTINGS || mode !== 'sso' || type === 'full') {
        replaceUrl(
            getLogoutURL({
                type,
                appName,
                reason,
                mode,
                persistedSessions,
                clearDeviceRecoveryData,
                localID,
            })
        );
    } else {
        requestFork({ fromApp: appName, localID, reason, extra });
    }
};

export const handleInvalidSession = ({
    appName,
    authentication,
    extra,
}: {
    appName: APP_NAMES;
    authentication: AuthenticationStore;
    extra?: ExtraSessionForkData;
}) => {
    // A session that is invalid should just do a local deletion on its own subdomain, to check if the session still exists on account.
    handleLogout({
        appName,
        reason: 'session-expired',
        authentication,
        type: 'local',
        clearDeviceRecoveryData: false,
        extra,
    });
};
