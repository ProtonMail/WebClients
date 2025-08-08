import { PLANS } from '@proton/payments';
import { Audience } from '@proton/shared/lib/interfaces';
import { getLongTestPlans } from '@proton/testing/data';

import type { PlanCard } from './PlanCardSelector';
import { getAccessiblePlans } from './helper';

describe('getAccessiblePlans', () => {
    const mockPlanCards = {
        [Audience.B2C]: [
            {
                plan: PLANS.MAIL,
                subsection: null,
                type: 'standard',
                guarantee: true,
            },
            {
                plan: PLANS.VPN2024,
                subsection: null,
                type: 'best',
                guarantee: true,
            },
        ] as PlanCard[],
        [Audience.B2B]: [
            {
                plan: PLANS.MAIL_PRO,
                subsection: null,
                type: 'standard',
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: null,
                type: 'best',
                guarantee: true,
            },
        ] as PlanCard[],
    };

    const allPlans = getLongTestPlans();

    it('should return accessible B2C plans', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
        });

        expect(result.length).toBe(8); // 2 for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });

    it('should return accessible B2B plans', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2B,
            plans: allPlans,
        });

        expect(result.length).toBe(8); // 2 for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL_PRO} - USD`,
                `${PLANS.BUNDLE_PRO_2024} - USD`,
                `${PLANS.MAIL_PRO} - CHF`,
                `${PLANS.BUNDLE_PRO_2024} - CHF`,
                `${PLANS.MAIL_PRO} - EUR`,
                `${PLANS.BUNDLE_PRO_2024} - EUR`,
                `${PLANS.MAIL_PRO} - BRL`,
                `${PLANS.BUNDLE_PRO_2024} - BRL`,
            ])
        );
    });

    it('should return empty array for invalid audience', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            // @ts-expect-error
            audience: 'INVALID_AUDIENCE',
            plans: allPlans,
        });

        expect(result).toEqual([]);
    });

    it('should return only plans that exist in allPlans', () => {
        const limitedPlans = allPlans.filter((plan) => plan.Name === PLANS.MAIL);
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: limitedPlans,
        });

        expect(result.length).toBe(4); // 1 for each of 4 regional currencies
        expect(result[0].Name).toBe(PLANS.MAIL);
    });

    it('should handle empty planCards', () => {
        const emptyPlanCards = {
            [Audience.B2C]: [] as PlanCard[],
            [Audience.B2B]: [] as PlanCard[],
        };

        const result = getAccessiblePlans({
            planCards: emptyPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
        });
        expect(result).toEqual([]);
    });

    it('should include param plan when it exists in plans', () => {
        const paramPlanName = PLANS.VISIONARY;
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        // Should include original plans plus the param plan
        expect(result.length).toBe(12); // 3 plans (2 original + 1 param) for each of 4 regional currencies

        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.VISIONARY} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.VISIONARY} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.VISIONARY} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
                `${PLANS.VISIONARY} - BRL`,
            ])
        );
    });

    it('should not duplicate plans if param plan is already in accessible plans', () => {
        const paramPlanName = PLANS.MAIL;
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        expect(result.length).toBe(8); // Still 2 plans for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });

    it('should ignore param plan when it does not exist in plans', () => {
        const paramPlanName = 'NON_EXISTENT_PLAN';
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        expect(result.length).toBe(8); // Still 2 plans for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });
});
