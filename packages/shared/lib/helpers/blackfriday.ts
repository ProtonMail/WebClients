import { isWithinInterval } from 'date-fns';

import { PLANS, type PlanIDs } from '@proton/payments';

import { BLACK_FRIDAY, CYCLE } from '../constants';
import { getHas2024OfferCoupon } from '../helpers/subscription';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.START, end: BLACK_FRIDAY.END });
};

export const isCyberMonday = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.CYBER_START, end: BLACK_FRIDAY.CYBER_END });
};

export const canUpsellToVPNPassBundle = (planIDs: PlanIDs, cycle: CYCLE, couponCode?: string) => {
    if (planIDs[PLANS.VPN] && [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(cycle) && getHas2024OfferCoupon(couponCode)) {
        return true;
    }
    return false;
};
