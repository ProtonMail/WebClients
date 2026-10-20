import type { UserModel } from '../interfaces/User';
import { getIsSSOVPNOnlyAccount } from '../keys/accountType';

export const getIsAccountRecoveryAvailable = (user: UserModel | undefined) => {
    if (!user) {
        return false;
    }
    return user.isPrivate && !getIsSSOVPNOnlyAccount(user);
};
