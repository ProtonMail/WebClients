import { ADDON_NAMES, CYCLE, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan, makePricing } from './test-helpers';

const bundleProPlan = makePlan({
    Name: PLANS.BUNDLE_PRO,
    Title: 'Business',
    MaxMembers: 1,
    Pricing: makePricing(1299, 13188, 23976),
    DefaultPricing: makePricing(1299, 13188, 23976),
});

const bundleProMember = makeAddon({
    Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
    MaxMembers: 1,
    Pricing: makePricing(1299, 13188, 23976),
    DefaultPricing: makePricing(1299, 13188, 23976),
});

const bundleProDomain = makeAddon({
    Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO,
    MaxDomains: 1,
    Pricing: makePricing(150, 1680, 3120),
    DefaultPricing: makePricing(150, 1680, 3120),
});

describe('createAddonItem', () => {
    it('should include addon items with correct pricing', () => {
        const plansMap: PlansMap = {
            [PLANS.BUNDLE_PRO]: bundleProPlan,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: bundleProMember,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: bundleProDomain,
        };
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680, // plan + 1 domain addon yearly
            AmountDue: 13188 + 1680,
            Cycle: CYCLE.YEARLY,
        });

        const result = getHeadlessCheckout({
            planIDs: {
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
            },
            plansMap,
            checkResult,
            app,
        });

        const addonsItem = result.getItem('addons');
        expect(addonsItem.addons.length).toBeGreaterThan(0);
        expect(addonsItem.visible).toBe(true);

        const domainAddon = addonsItem.addons.find((a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO);
        expect(domainAddon).toBeDefined();
        expect(domainAddon!.pricePerOnePerMonth).toBe(1680 / CYCLE.YEARLY);
    });
});
