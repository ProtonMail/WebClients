import { UserModel } from '../interfaces';
import { getIsSSOVPNOnlyAccount } from '../keys';

export const getIsRecoveryAvailable = (user: UserModel) => {
    const isSSOUser = getIsSSOVPNOnlyAccount(user);

    return user.isPrivate && !isSSOUser;
};
