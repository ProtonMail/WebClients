import { getPlanIDs, removeService, hasLifetime } from '../../lib/helpers/subscription';
import { PLAN_SERVICES } from '../../lib/constants';

describe('getPlanIDs', () => {
    it('should handle an empty parameter and return an empty Array', () => {
        expect(getPlanIDs()).toBeDefined();
        expect(getPlanIDs()).toEqual({});
    });

    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                Plans: [
                    { ID: 'a', Quantity: 1 },
                    { ID: 'a', Quantity: 1 },
                    { ID: 'b', Quantity: 3 }
                ]
            })
        ).toEqual({
            a: 2,
            b: 3
        });
    });
});

const PLANS = [
    { ID: 'visionary', Services: PLAN_SERVICES.VPN + PLAN_SERVICES.MAIL },
    { ID: 'vpnplus', Services: PLAN_SERVICES.VPN },
    { ID: 'plus', Services: PLAN_SERVICES.MAIL }
];

describe('removeService', () => {
    it('should remove visionary', () => {
        expect(removeService({ visionary: 1 }, PLANS, PLAN_SERVICES.VPN)).toEqual({});
    });

    it('should keep mail', () => {
        expect(removeService({ plus: 1 }, PLANS, PLAN_SERVICES.VPN)).toEqual({ plus: 1 });
    });

    it('should remove mail', () => {
        expect(removeService({ plus: 1 }, PLANS, PLAN_SERVICES.MAIL)).toEqual({});
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'LIFETIME' })).toBe(true);
    });

    it('should not have LIFETIME', () => {
        expect(hasLifetime()).toBe(false);
        expect(hasLifetime({ CouponCode: 'PANDA' })).toBe(false);
    });
});
