import { Audience } from '@proton/shared/lib/interfaces';

import { getIsB2BAudienceFromPlan } from '../../plan/helpers';
import type { MaybeFreeSubscription } from '../interface';
import { hasDuo, hasFamily, hasPassFamily } from './plan-matching';

export const getIsB2BAudienceFromSubscription = (subscription: MaybeFreeSubscription) => {
    return !!subscription?.Plans?.some(({ Name }) => getIsB2BAudienceFromPlan(Name));
};

const getIsFamilyAudienceFromSubscription = (subscription: MaybeFreeSubscription) => {
    return hasDuo(subscription) || hasFamily(subscription) || hasPassFamily(subscription);
};

export const getAudienceFromSubscription = (subscription: MaybeFreeSubscription): Audience => {
    if (getIsB2BAudienceFromSubscription(subscription)) {
        return Audience.B2B;
    } else if (getIsFamilyAudienceFromSubscription(subscription)) {
        return Audience.FAMILY;
    } else {
        return Audience.B2C;
    }
};
