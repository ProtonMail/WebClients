import { BLACK_FRIDAY, PLANS_TYPE, PAID_MEMBER_ROLE, CYCLE, PLANS } from '../../constants';

const { TWO_YEARS } = CYCLE;

const {
    PLAN: { PLUS, VPN_PLUS, VPN_BASIC, PROFESSIONAL, VISIONARY }
} = PLANS;

// "Plus Plus" offer with coupon. PLUS + VPN_PLUS + COUPON with 2 years cycle
const PLUS_VPNPLUS_COUPON = {
    offers: [{ name: PLUS }, { name: VPN_PLUS }],
    coupon: BLACK_FRIDAY.COUPON_CODE,
    cycle: BLACK_FRIDAY.CYCLE
};

/**
 * Transform all plans into an addons map and a plans map.
 * @param {Array} plans
 * @returns {{plans: {}, addons: {}}}
 */
const transformPlans = (plans = []) =>
    plans.reduce(
        (acc, cur) => {
            const { Name, Type } = cur;
            if (Type === PLANS_TYPE.ADDON) {
                acc.addons[Name] = cur;
            }
            if (Type === PLANS_TYPE.PLAN) {
                acc.plans[Name] = cur;
            }
            return acc;
        },
        { plans: {}, addons: {} }
    );

/**
 * Returns an array of offers with plans.
 * @param {Object} plans
 * @param {Object} addons
 * @returns {Array}
 */
const getPlanOffers = (plans, addons) => {
    const numberOfPlans = Object.keys(plans).length;
    const numberOfAddons = Object.keys(addons).length;

    /**
     * Type 5C: ProtonMail Custom (plus or professional), and possibly a ProtonVPN subscription.
     * Offers:
     *  - Same plan with same addons (2 years)
     */
    if ((plans[PLUS] || plans[PROFESSIONAL]) && numberOfAddons > 0) {
        return [
            {
                offers: [
                    ...Object.keys(plans).map((name) => ({ name })),
                    ...Object.keys(addons).map((name) => ({ name, quantity: addons[name].Quantity }))
                ],
                cycle: CYCLE.TWO_YEARS
            }
        ];
    }

    /**
     * Type 1B: (Free) No ProtonMail and no ProtonVPN subscription
     * Offers:
     *  - Plus Mail (2 for 1)
     *  - Plus Plus (2 for 1)
     */
    if (!numberOfPlans) {
        return [
            {
                offers: [{ name: PLUS }],
                coupon: BLACK_FRIDAY.COUPON_CODE,
                cycle: BLACK_FRIDAY.CYCLE
            },
            PLUS_VPNPLUS_COUPON
        ];
    }

    /**
     * Type 2: No ProtonMail, with ProtonVPN Basic subscription
     * Offers:
     *  - Basic VPN (2 years)
     *  - Plus VPN (2 for 1)
     */
    if (plans[VPN_BASIC] && numberOfPlans === 1) {
        return [
            {
                offers: [{ name: VPN_BASIC }],
                cycle: TWO_YEARS
            },
            {
                offers: [{ name: VPN_PLUS }],
                coupon: BLACK_FRIDAY.COUPON_CODE,
                cycle: BLACK_FRIDAY.CYCLE
            }
        ];
    }

    /**
     * Type 3: No ProtonMail, with ProtonVPN Plus subscription
     * Offers:
     *  - Plus VPN (2 years)
     *  - Plus Plus (2 for 1)
     */
    if (plans[VPN_PLUS] && numberOfPlans === 1) {
        return [
            {
                offers: [{ name: VPN_PLUS }],
                cycle: TWO_YEARS
            },
            {
                offers: [{ name: PLUS }, { name: VPN_PLUS }],
                cycle: TWO_YEARS
            }
        ];
    }

    /**
     * Type 6: Only ProtonMail Plus subscription
     * Offers:
     *  - Plus Mail (2 years)
     *  - Plus Plus (2 for 1)
     */
    if (plans[PLUS] && numberOfPlans === 1) {
        return [
            {
                offers: [{ name: PLUS }],
                cycle: TWO_YEARS
            },
            PLUS_VPNPLUS_COUPON
        ];
    }

    /**
     * Type 4A: ProtonMail Plus and ProtonVPN Basic subscription
     * Offers:
     *  - Plus Plus (2 for 1)
     */
    if (plans[PLUS] && plans[VPN_BASIC]) {
        return [PLUS_VPNPLUS_COUPON];
    }

    /**
     * Type 4B: ProtonMail Plus and ProtonVPN Plus subscription
     * Offers:
     *  - Plus Plus (2 years)
     */
    if (plans[PLUS] && plans[VPN_PLUS]) {
        return [
            {
                offers: [{ name: PLUS }, { name: VPN_PLUS }],
                cycle: TWO_YEARS
            }
        ];
    }

    /**
     * Type 5A: ProtonMail Visionary
     * Offers:
     *  - Visionary (2 years)
     */
    if (plans[VISIONARY]) {
        return [
            {
                offers: [{ name: VISIONARY }],
                cycle: TWO_YEARS
            }
        ];
    }

    /**
     * Type 5B: ProtonMail Professional, and possibly a ProtonVPN subscription.
     * Offers:
     *  - Same plans (2 years)
     */
    if (plans[PROFESSIONAL]) {
        return [
            {
                offers: [...Object.keys(plans).map((name) => ({ name }))],
                cycle: TWO_YEARS
            }
        ];
    }

    return [];
};

/**
 * Get the offers given the current subscription and user.
 * @param {Object} Subscription
 * @param {Object} User
 * @returns {Array}
 */
export default ({ CouponCode, Cycle, Plans: CurrentPlans = [] }, { Role, subuser }) => {
    const isLifetime = CouponCode === 'LIFETIME';
    const isTwoYears = Cycle === TWO_YEARS;
    const isMember = Role === PAID_MEMBER_ROLE;
    const isSubuser = !!subuser;

    if (isLifetime || isMember || isSubuser || isTwoYears) {
        return [];
    }

    const { plans, addons } = transformPlans(CurrentPlans);
    return getPlanOffers(plans, addons);
};
