import type { UserModel } from '../interfaces';
import { getIsSSOVPNOnlyAccount } from '../keys';

export const getIsAccountRecoveryAvailable = (user: UserModel | undefined) => {
    if (!user) {
        return false;
    }
    return user.isPrivate && !getIsSSOVPNOnlyAccount(user);
};
