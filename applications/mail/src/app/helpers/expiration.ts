import { getUnixTime } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel, labelIDs?: string[]) => {
    if (!featureFlagValue) {
        return false;
    }

    if (user.isFree) {
        return false;
    }

    if (!labelIDs || labelIDs.includes(MAILBOX_LABEL_IDS.SPAM) || labelIDs.includes(MAILBOX_LABEL_IDS.TRASH)) {
        return false;
    }

    return true;
};

export const getExpirationTime = (date?: Date) => {
    return date ? getUnixTime(date) : null;
};
