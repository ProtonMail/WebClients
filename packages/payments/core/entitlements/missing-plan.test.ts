import { buildEntitlementCatalog } from '../../testing/buildEntitlementCatalog';
import { PLANS } from '../constants';
import { getEntitlementsPerPlan } from './entitlement-grants';
import { EntitlementName } from './entitlement-names';
import { checkConditions } from './helpers';
import { createEntitlementResolverForSelection } from './resolver';

/**
 * A plan absent from the catalog is expected, not a defect: the catalog is the backend's list of plans that carry
 * entitlements, so plans without them are legitimately missing, and a cached catalog can lag the live endpoint.
 * These tests pin how that absence degrades, so a future gap stays a known quantity.
 */
describe('a plan missing from the entitlement catalog', () => {
    const missingPlan = PLANS.PASS_LIFETIME;
    const entitlementCatalog = buildEntitlementCatalog({
        [PLANS.MAIL_PRO]: [EntitlementName.Business, EntitlementName.MultiUser],
    });

    it('folds to an empty grant set rather than throwing', () => {
        expect(getEntitlementsPerPlan(entitlementCatalog, { [missingPlan]: 1 })).toEqual([]);
    });

    it('reports every entitlement as not granted, with zero quantities', () => {
        const resolver = createEntitlementResolverForSelection(entitlementCatalog, missingPlan);

        expect(resolver.hasEntitlement(EntitlementName.PassBusiness)).toBe(false);
        expect(resolver.quantityTotal(EntitlementName.MaxSpace)).toBe(0);
        expect(resolver.resolveTotal(EntitlementName.MaxSpace).quantity).toBe(0);
    });

    it('denies the includes-based checks', () => {
        const resolver = createEntitlementResolverForSelection(entitlementCatalog, missingPlan);

        expect(resolver.isB2cMultiUser).toBe(false);
        expect(resolver.isVpnBusiness).toBe(false);
    });

    it('denies an excludes-only condition instead of letting an empty fold exclude everything', () => {
        expect(checkConditions({ includes: [], excludes: [EntitlementName.Business] }, [])).toBe(false);

        const resolver = createEntitlementResolverForSelection(entitlementCatalog, missingPlan);
        expect(resolver.hasMatchingSubscription({ includes: [], excludes: [EntitlementName.Business] })).toBe(false);
    });

    it('denies an anchored condition too, because the anchor cannot be satisfied', () => {
        const resolver = createEntitlementResolverForSelection(entitlementCatalog, missingPlan);

        expect(
            resolver.hasMatchingSubscription({
                includes: [EntitlementName.MultiUser],
                excludes: [EntitlementName.Business],
            })
        ).toBe(false);
    });
});
