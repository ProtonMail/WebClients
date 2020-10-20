import { BLACK_FRIDAY, CYCLE, PLANS } from '../../constants';

const {
    PLAN: { PLUS, VPN_PLUS }
} = PLANS;

function offers(Currency, alternative) {
    if (alternative) {
        return [{ plans: [PLUS, VPN_PLUS] }].map(({ plans, Cycle = CYCLE.TWO_YEARS }) => ({
            plans,
            Cycle,
            Currency
        }));
    }

    // Standard BF2020
    return [
        { plans: [PLUS], Cycle: CYCLE.YEARLY },
        { plans: [PLUS, VPN_PLUS], mostPopular: true },
        { plans: [PLUS, VPN_PLUS], Cycle: CYCLE.YEARLY }
    ].map(({ plans, Cycle = CYCLE.TWO_YEARS, mostPopular }) => ({
        plans,
        mostPopular,
        Cycle,
        Currency,
        CouponCode: BLACK_FRIDAY.COUPON_CODE
    }));
}

export default offers;
