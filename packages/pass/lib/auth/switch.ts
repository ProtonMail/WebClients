import type { Api, ApiAuth } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { revoke } from '@proton/shared/lib/api/auth';
import noop from '@proton/utils/noop';

import { getActiveSessions } from './session';

export type SwitchableSession = {
    DisplayName: string;
    lastUsedAt?: number;
    LocalID: number;
    PrimaryEmail: string;
    UID: string;
    UserID: string;
};

type AuthSwitchConfig = {
    api: Api;
    onSwitch: (LocalID: number) => void;
    getSessions: () => SwitchableSession[];
    onActiveSession: (session: SwitchableSession) => void;
    onInactiveSession: (session: SwitchableSession) => void;
    onSessionsSynced: (sessions: SwitchableSession[]) => void;
};

export const createAuthSwitchService = (config: AuthSwitchConfig) => {
    const { api } = config;

    return {
        /** Revoke may be called on a session different then
         * what the authentication store is actually configured
         * with : as such, pass the `UID` to the revoke call.
         * The API call is flagged as side-effects free to avoid
         * mutating the API state of the current active session. */
        revoke: (auth: ApiAuth) => {
            api({ ...revoke(), sideEffects: false, auth }).catch(noop);
            const localSessions = config.getSessions();
            const revoked = localSessions.find((session) => session.UID === auth.UID);
            if (revoked) config.onInactiveSession(revoked);
        },

        switch: config.onSwitch,

        sync: async (options: { revalidate: boolean }): Promise<SwitchableSession[]> => {
            const localSessions = config.getSessions();
            const activeSessions = options.revalidate ? await getActiveSessions(api) : null;

            if (!activeSessions) {
                config.onSessionsSynced(localSessions);
                return localSessions;
            }

            const sessions = new Map(activeSessions.map((session) => [session.LocalID, session]));
            const [localActive, inactive] = partition(localSessions, ({ LocalID }) => sessions.has(LocalID!));

            const active = localActive.map((session) => {
                const { DisplayName, PrimaryEmail = '' } = sessions.get(session.LocalID)!;
                return { ...session, DisplayName, PrimaryEmail };
            });

            active.forEach(config.onActiveSession);
            inactive.forEach(config.onInactiveSession);

            config.onSessionsSynced(active);

            return active;
        },
    };
};

export type AuthSwitchService = ReturnType<typeof createAuthSwitchService>;
