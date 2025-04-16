import type { UserModel } from '../interfaces';
import { getIsSSOVPNOnlyAccount } from '../keys';

export const getIsAccountRecoveryAvailable = (user: UserModel) => {
    const isSSOUser = getIsSSOVPNOnlyAccount(user);

    return user.isPrivate && !isSSOUser;
};
