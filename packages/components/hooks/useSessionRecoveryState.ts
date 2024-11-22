import { useUser } from '@proton/account/user/hooks';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';

export const useSessionRecoveryState = () => {
    const [user] = useUser();

    if (!user?.AccountRecovery) {
        return SessionRecoveryState.NONE;
    }

    return user.AccountRecovery.State;
};
