import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

const CANNOT_SET_EXPIRATION = [MAILBOX_LABEL_IDS.SCHEDULED];

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel, labelID: string) => {
    if (!featureFlagValue) {
        return false;
    }

    if (user.isFree) {
        return false;
    }

    return !CANNOT_SET_EXPIRATION.includes(labelID as MAILBOX_LABEL_IDS);
};
