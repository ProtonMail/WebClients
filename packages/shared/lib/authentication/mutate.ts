import type { Api, User } from '../interfaces';
import { isSelf } from '../user/helpers';
import { SessionSource } from './SessionInterface';
import type { AuthenticationStore } from './createAuthenticationStore';
import { sendPasswordChangeMessageToTabs } from './passwordChangeMessage';
import { persistSession } from './persistedSessionHelper';

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
