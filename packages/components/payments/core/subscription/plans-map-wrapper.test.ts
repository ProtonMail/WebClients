import { PLANS } from '@proton/shared/lib/constants';
import { type Plan } from '@proton/shared/lib/interfaces';

import { getPlan } from './plans-map-wrapper';

describe('getPlan', () => {
    it('should return matching currency', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'BRL',
            } as Plan,
        ];

        const plan = getPlan(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'BRL',
        });
    });

    it('should respect currency fallback', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            } as Plan,
        ];

        const plan = getPlan(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'USD',
        });
    });

    it('should return any currency if fallback currency does not exist', () => {
        const prefferedCurrency = 'BRL';

        const plans: Plan[] = [
            {
                Name: PLANS.MAIL,
                Currency: 'CHF',
            } as Plan,
            {
                Name: PLANS.MAIL,
                Currency: 'EUR',
            } as Plan,
        ];

        const plan = getPlan(plans, PLANS.MAIL, prefferedCurrency);
        expect(plan).toEqual({
            Name: PLANS.MAIL,
            Currency: 'CHF',
        });
    });
});
