import { UserModel } from '@proton/shared/lib/interfaces';

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel) => {
    if (!featureFlagValue) {
        return false;
    }

    if (user.isFree) {
        return false;
    }

    return true;
};
