import { isWithinInterval } from 'date-fns';

import { PlanIDs } from '@proton/shared/lib/interfaces';

import { BLACK_FRIDAY, COUPON_CODES, CYCLE, PLANS } from '../constants';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.START, end: BLACK_FRIDAY.END });
};

export const isCyberMonday = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.CYBER_START, end: BLACK_FRIDAY.CYBER_END });
};

export const canUpsellToVPNPassBundle = (planIDs: PlanIDs, cycle: CYCLE, couponCode?: string) => {
    if (
        planIDs[PLANS.VPN] &&
        [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(cycle) &&
        couponCode === COUPON_CODES.BLACK_FRIDAY_2023
    ) {
        return true;
    }
    return false;
};
