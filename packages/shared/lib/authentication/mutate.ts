import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from '@proton/shared/lib/helpers/crossTab';
import { Api, User } from '@proton/shared/lib/interfaces';
import { isSubUser } from '@proton/shared/lib/user/helpers';

const mutatePassword = async ({
    authentication,
    keyPassword,
    User,
    api,
}: {
    authentication: AuthenticationStore;
    keyPassword: string;
    api: Api;
    User: User;
}) => {
    // Don't mutate the password when signed in as sub-user
    if (isSubUser(User)) {
        return;
    }
    const localID = authentication.getLocalID?.();
    if (authentication.mode !== 'sso' || localID === undefined) {
        authentication.setPassword(keyPassword);
        return;
    }
    try {
        authentication.setPassword(keyPassword);

        const { clientKey } = await persistSession({
            api,
            keyPassword,
            User,
            UID: authentication.getUID(),
            LocalID: localID,
            persistent: authentication.getPersistent(),
            trusted: authentication.getTrusted(),
            mode: authentication.mode,
        });

        authentication.setClientKey(clientKey);

        sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: true });
    } catch (e: any) {
        sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: false });
        // If persisting the password fails for some reason.
        throw e;
    }
};

export default mutatePassword;
