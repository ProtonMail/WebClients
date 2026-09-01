import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { Audience } from '@proton/shared/lib/interfaces';

import { getAllFeatures, getFeatureDefinitions } from './index';
import { getShortPlan } from './plan';

/**
 * `PlanCardFeatureList` keys its rows on `id`, so every list it can be handed has to
 * carry unique ones. These are the two sources of those lists: a plan column of the
 * comparison table, and a short plan's feature list.
 */
describe('plan card feature ids', () => {
    const plansMap = getPlansMap(getTestPlans('EUR'), 'EUR');
    const allFeatures = getAllFeatures({ plansMap, freePlan: FREE_PLAN });
    const audiences = [Audience.B2C, Audience.B2B, Audience.FAMILY];
    const plans = Object.values(PLANS);

    const getDuplicates = (ids: string[]) => {
        const seen = new Set<string>();
        return ids.filter((id) => !seen.add(id));
    };

    it('are unique within every column of the comparison table', () => {
        const duplicates: string[] = [];
        let columnCount = 0;

        for (const plan of plans) {
            for (const audience of audiences) {
                for (const [group, features] of Object.entries(allFeatures)) {
                    const definitions = getFeatureDefinitions(plan, features, audience);
                    if (!definitions.length) {
                        continue;
                    }
                    columnCount++;
                    getDuplicates(definitions.map(({ id }) => id)).forEach((id) => {
                        duplicates.push(`${plan}/${audience}/${group}: ${id}`);
                    });
                }
            }
        }

        expect(duplicates).toEqual([]);
        // A guard against the matrix silently producing nothing.
        expect(columnCount).toBeGreaterThan(100);
    });

    it('are unique within every short plan', () => {
        const duplicates: string[] = [];
        let planCount = 0;

        for (const plan of plans) {
            if (plan !== PLANS.FREE && !plansMap[plan]) {
                continue;
            }

            const shortPlan = getShortPlan(plan, plansMap, { freePlan: FREE_PLAN });
            if (!shortPlan?.features.length) {
                continue;
            }

            planCount++;
            getDuplicates(shortPlan.features.map(({ id }) => id)).forEach((id) => {
                duplicates.push(`${plan}: ${id}`);
            });
        }

        expect(duplicates).toEqual([]);
        expect(planCount).toBeGreaterThan(10);
    });
});
