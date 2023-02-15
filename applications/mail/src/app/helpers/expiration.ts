import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

const { SCHEDULED, OUTBOX, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;
const CANNOT_SET_EXPIRATION = [SCHEDULED, OUTBOX, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS];

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel, labelID: string) => {
    if (!featureFlagValue) {
        return false;
    }

    if (user.isFree) {
        return false;
    }

    return !CANNOT_SET_EXPIRATION.includes(labelID as MAILBOX_LABEL_IDS);
};
