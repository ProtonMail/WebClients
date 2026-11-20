import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';

import { getVpnCoupon, getVpnPlanToCheck, getVpnPlansToCheck } from './pricing';

const promotion = COUPON_CODES.TECHRADARVPNPASS;
const bundle = { [PLANS.VPN_PASS_BUNDLE]: 1 };
const vpn = { [PLANS.VPN2024]: 1 };

describe('getVpnCoupon', () => {
    it('keeps the promotion coupon for the VPN+Pass bundle on 12 months', () => {
        expect(getVpnCoupon({ planIDs: bundle, cycle: CYCLE.YEARLY, currency: 'USD', coupon: promotion })).toBe(
            promotion
        );
    });

    it('drops the promotion coupon for any other selection', () => {
        expect(getVpnCoupon({ planIDs: vpn, cycle: CYCLE.YEARLY, currency: 'USD', coupon: promotion })).toBe(undefined);
        expect(getVpnCoupon({ planIDs: bundle, cycle: CYCLE.MONTHLY, currency: 'USD', coupon: promotion })).toBe(
            undefined
        );
    });

    it('keeps the promotion coupon in a regional currency, where the promotion is off', () => {
        expect(getVpnCoupon({ planIDs: vpn, cycle: CYCLE.YEARLY, currency: 'BRL', coupon: promotion })).toBe(promotion);
    });

    it('keeps any other coupon', () => {
        expect(getVpnCoupon({ planIDs: vpn, cycle: CYCLE.MONTHLY, currency: 'USD', coupon: 'GIFT10' })).toBe('GIFT10');
    });
});

describe('getVpnPlanToCheck', () => {
    it('adds the automatic coupon when there is none', () => {
        expect(getVpnPlanToCheck({ planIDs: vpn, cycle: CYCLE.YEARLY, currency: 'CHF', coupon: undefined })).toEqual(
            expect.objectContaining({ coupon: COUPON_CODES.VPN_INTRO_2025 })
        );
    });

    it('checks a selection the promotion does not cover with its automatic coupon', () => {
        expect(getVpnPlanToCheck({ planIDs: vpn, cycle: CYCLE.YEARLY, currency: 'CHF', coupon: promotion })).toEqual(
            expect.objectContaining({ coupon: COUPON_CODES.VPN_INTRO_2025 })
        );
    });
});

describe('getVpnPlansToCheck', () => {
    it('checks the selection, VPN Plus and the VPN+Pass bundle on every cycle', () => {
        const plans = getVpnPlansToCheck({
            planIDs: { [PLANS.VPN_PRO]: 1 },
            cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
            currency: 'CHF',
            coupon: undefined,
        });

        expect(plans.map(({ planIDs, cycle }) => [Object.keys(planIDs)[0], cycle])).toEqual([
            [PLANS.VPN_PRO, CYCLE.MONTHLY],
            [PLANS.VPN_PRO, CYCLE.YEARLY],
            [PLANS.VPN2024, CYCLE.MONTHLY],
            [PLANS.VPN2024, CYCLE.YEARLY],
            [PLANS.VPN_PASS_BUNDLE, CYCLE.MONTHLY],
            [PLANS.VPN_PASS_BUNDLE, CYCLE.YEARLY],
        ]);
    });

    it('does not check VPN Plus twice when it is the selection', () => {
        const plans = getVpnPlansToCheck({ planIDs: vpn, cycles: [CYCLE.YEARLY], currency: 'CHF', coupon: undefined });

        expect(plans.map(({ planIDs }) => Object.keys(planIDs)[0])).toEqual([PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE]);
    });
});
