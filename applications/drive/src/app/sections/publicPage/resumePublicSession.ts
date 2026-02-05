import type { useGetAddresses } from '@proton/account/addresses/hooks';
import type { useAuthentication } from '@proton/components';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { driveMetrics } from '../../modules/metrics';
import { getLastActivePersistedUserSession } from '../../utils/lastActivePersistedUserSession';
import { usePublicAuthStore } from './usePublicAuth.store';

interface ResumePublicSessionProps {
    api: <T>(config: any) => Promise<T>;
    authentication: ReturnType<typeof useAuthentication>;
    getAddresses: ReturnType<typeof useGetAddresses>;
}

export const resumePublicSession = async ({
    api,
    authentication,
    getAddresses,
}: ResumePublicSessionProps): Promise<void> => {
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });

    const persistedSession = getLastActivePersistedUserSession();
    if (!persistedSession) {
        return;
    }

    try {
        const resumedSession = await resumeSession({
            api: silentApi,
            localID: persistedSession.localID,
        });

        if (!resumedSession) {
            return;
        }

        authentication.setPassword(resumedSession.keyPassword);
        authentication.setUID(persistedSession.UID);
        authentication.setLocalID(persistedSession.localID);
        (api as any).UID = persistedSession.UID;

        usePublicAuthStore.getState().setIsLoggedIn(true);
        const addresses = await getAddresses();

        const userAddresses = addresses.map((address) => ({
            email: address.Email,
            displayName: address.DisplayName || address.Email,
        }));
        usePublicAuthStore.getState().setAddresses(userAddresses);

        const user = formatUser(resumedSession.User);
        driveMetrics.init({ user, isPublicContext: true });
    } catch (e) {
        console.warn('Cannot resume session');
    }
};
