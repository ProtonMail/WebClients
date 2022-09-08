import { getAppHref } from '@proton/shared/lib/apps/helper';
import { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { APPS } from '@proton/shared/lib/constants';
import { decodeBase64URL, encodeBase64URL } from '@proton/shared/lib/helpers/encoding';

interface PassedSession {
    id: string;
    s: boolean;
}

export const serializeLogoutURL = (
    persistedSessions: PersistedSession[],
    clearDeviceRecoveryData: boolean | undefined
) => {
    const url = new URL(getAppHref(`/switch`, APPS.PROTONACCOUNT));
    url.searchParams.set('flow', 'logout');
    if (clearDeviceRecoveryData) {
        url.searchParams.set('clear-recovery', JSON.stringify(clearDeviceRecoveryData));
    }
    const hashParams = new URLSearchParams();
    const sessions = persistedSessions.map((persistedSession): PassedSession => {
        return {
            id: persistedSession.UserID,
            s: persistedSession.isSubUser,
        };
    });
    hashParams.set('sessions', encodeBase64URL(JSON.stringify(sessions)));
    url.hash = hashParams.toString();
    return url;
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
    return {
        flow: searchParams.get('flow'),
        clearDeviceRecoveryData: searchParams.get('clear-recovery') === 'true',
        sessions,
    };
};
