import { addDays, getUnixTime } from 'date-fns';

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

export const getExpirationTime = (days: number) => {
    const date = addDays(new Date(), days);
    return days ? getUnixTime(date) : null;
};
