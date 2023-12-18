import { isWithinInterval } from 'date-fns';

import { BLACK_FRIDAY, CYCLE, PLANS } from '../constants';
import { getHas2023OfferCoupon } from '../helpers/subscription';
import { PlanIDs } from '../interfaces';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.START, end: BLACK_FRIDAY.END });
};

export const isCyberMonday = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.CYBER_START, end: BLACK_FRIDAY.CYBER_END });
};

export const canUpsellToVPNPassBundle = (planIDs: PlanIDs, cycle: CYCLE, couponCode?: string) => {
    if (planIDs[PLANS.VPN] && [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(cycle) && getHas2023OfferCoupon(couponCode)) {
        return true;
    }
    return false;
};
