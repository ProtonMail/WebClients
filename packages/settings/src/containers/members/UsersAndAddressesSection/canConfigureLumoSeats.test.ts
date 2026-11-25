import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { canConfigureLumoSeats } from './canConfigureLumoSeats';

describe('canConfigureLumoSeats', () => {
    const passBasic = buildSubscription(PLANS.PASS_BASIC);
    const passProfessional = buildSubscription(PLANS.PASS_BUSINESS);

    it('is false for Pass Basic, which has no Lumo add-on', () => {
        expect(canConfigureLumoSeats({ maxLumo: 0, subscriptions: [passBasic] })).toBe(false);
    });

    it('is true for a plan with a Lumo add-on', () => {
        expect(canConfigureLumoSeats({ maxLumo: 0, subscriptions: [passProfessional] })).toBe(true);
    });

    it('is true when another subscription can add Lumo seats', () => {
        expect(canConfigureLumoSeats({ maxLumo: 0, subscriptions: [passBasic, passProfessional] })).toBe(true);
    });

    it('is true when the organization already has Lumo seats', () => {
        expect(canConfigureLumoSeats({ maxLumo: 2, subscriptions: [passBasic] })).toBe(true);
    });

    it('is true without a readable subscription (free organization or no access to billing)', () => {
        expect(canConfigureLumoSeats({ maxLumo: 0, subscriptions: [] })).toBe(true);
        expect(canConfigureLumoSeats({ maxLumo: 0 })).toBe(true);
    });
});
