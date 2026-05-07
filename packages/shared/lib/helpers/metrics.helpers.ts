import { CYCLE } from '@proton/payments/core/constants';
import type { Cycle } from '@proton/payments/core/interface';

import type { UserModel } from '../interfaces';
import { getUserCreationDate, getUserDaysSinceCreation } from '../user/helpers';

export const getAccountAgeForDimension = (user: UserModel) => {
    const daysSinceCreation = getUserDaysSinceCreation(getUserCreationDate(user));

    if (daysSinceCreation <= 1) {
        return 'one day';
    }

    if (daysSinceCreation <= 7) {
        return 'one week';
    }

    if (daysSinceCreation <= 30) {
        return 'one month';
    }

    if (daysSinceCreation <= 365) {
        return 'one year';
    }

    return 'more';
};

export const getCycleForDimension = (cycle?: Cycle) => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return 'monthly';
        case CYCLE.THREE:
            return 'three months';
        case CYCLE.SIX:
            return 'six months';
        case CYCLE.YEARLY:
            return 'yearly';
        case CYCLE.FIFTEEN:
            return 'fifteen months';
        case CYCLE.EIGHTEEN:
            return 'eighteen months';
        case CYCLE.TWO_YEARS:
            return 'two years';
        case CYCLE.THIRTY:
            return 'thirty months';
        default:
            return 'unknown';
    }
};
