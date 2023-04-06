import { getUnixTime } from 'date-fns';

import { UserModel } from '@proton/shared/lib/interfaces';
import { isFrozenExpiration } from '@proton/shared/lib/mail/messages';

import { MessageState } from '../logic/messages/messagesTypes';
import { isAllowedAutoDeleteLabelID } from './autoDelete';

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel, messageState?: MessageState) => {
    const hasFrozenExpiration = isFrozenExpiration(messageState?.data);
    const { LabelIDs = [] } = messageState?.data || {};

    if (hasFrozenExpiration) {
        return false;
    }

    if (!featureFlagValue) {
        return false;
    }

    if (user.isFree) {
        return false;
    }

    if (!LabelIDs.length || LabelIDs.some((labelID) => isAllowedAutoDeleteLabelID(labelID))) {
        return false;
    }

    return true;
};

export const getExpirationTime = (date?: Date) => {
    return date ? getUnixTime(date) : null;
};
