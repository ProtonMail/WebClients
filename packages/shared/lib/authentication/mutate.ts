import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { sendPasswordChangeMessageToTabs } from '@proton/shared/lib/authentication/passwordChangeMessage';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { isSelf } from '@proton/shared/lib/user/helpers';

const mutatePassword = async ({
    authentication,
    keyPassword,
    clearKeyPassword,
    User,
    api,
    source = SessionSource.Proton,
}: {
    authentication: AuthenticationStore;
    keyPassword: string;
    clearKeyPassword: string;
    api: Api;
    User: User;
    source?: SessionSource;
}) => {
    // Don't mutate the password when signed in through admin access
    if (!isSelf(User)) {
        return;
    }
    const localID = authentication.getLocalID?.();
    try {
        authentication.setPassword(keyPassword);

        const { clientKey, offlineKey } = await persistSession({
            api,
            clearKeyPassword,
            keyPassword,
            User,
            UID: authentication.getUID(),
            LocalID: localID,
            persistent: authentication.getPersistent(),
            trusted: authentication.getTrusted(),
            mode: authentication.mode,
            source,
        });

        authentication.setClientKey(clientKey);
        authentication.setOfflineKey(offlineKey);

        sendPasswordChangeMessageToTabs({ localID, status: true });
    } catch (e: any) {
        sendPasswordChangeMessageToTabs({ localID, status: true });
        // If persisting the password fails for some reason.
        throw e;
    }
};

export default mutatePassword;
