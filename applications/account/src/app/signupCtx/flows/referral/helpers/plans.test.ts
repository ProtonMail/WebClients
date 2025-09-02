import { PLANS } from '@proton/payments';

import { autoRenewingPlans } from './plans';

describe('autoRenewingPlans', () => {
    it('should contain have two plans', () => {
        expect(autoRenewingPlans).toHaveLength(2);
    });

    it('should include VPN2024', () => {
        expect(autoRenewingPlans).toContain(PLANS.VPN2024);
    });

    it('should include BUNDLE', () => {
        expect(autoRenewingPlans).toContain(PLANS.BUNDLE);
    });
});

describe('plansRequiringPaymentToken', () => {
    it('should contain have two plans', () => {
        expect(autoRenewingPlans).toHaveLength(2);
    });

    it('should include VPN2024', () => {
        expect(autoRenewingPlans).toContain(PLANS.VPN2024);
    });

    it('should include BUNDLE', () => {
        expect(autoRenewingPlans).toContain(PLANS.BUNDLE);
    });
});
