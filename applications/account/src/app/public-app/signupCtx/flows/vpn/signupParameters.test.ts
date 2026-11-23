import { PLANS } from '@proton/payments/core/constants';

import { getVpnSignupParameters } from './signupParameters';

const getPreSelectedPlan = (plan: string) =>
    getVpnSignupParameters('/signup', new URLSearchParams({ plan, cycle: '12' })).preSelectedPlan;

describe('getVpnSignupParameters', () => {
    it.each([PLANS.DUO, PLANS.FAMILY, PLANS.BUNDLE, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE])(
        'keeps the %s plan of the link',
        (plan) => {
            expect(getPreSelectedPlan(plan)).toBe(plan);
        }
    );

    it('drops a plan the VPN signup does not sell', () => {
        expect(getPreSelectedPlan(PLANS.MAIL)).toBe(undefined);
    });
});
