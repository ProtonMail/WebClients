import { getTestPlans } from '@proton/testing/data';

import { ADDON_NAMES, PLANS } from '../../lib/constants';
import { clearPlanIDs, hasPlanIDs, setQuantity, switchPlan } from '../../lib/helpers/planIDs';
import { Organization } from '../../lib/interfaces';

const MOCK_ORGANIZATION = {} as Organization;

describe('hasPlanIDs', () => {
    it('should return true if plan IDs are set', () => {
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
                [PLANS.VPN]: 0,
                [ADDON_NAMES.VPN]: 3,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.VPN]: -1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [ADDON_NAMES.VPN]: 1,
            })
        ).toBeTrue();
    });

    it('should return false if plan IDs are not set', () => {
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 0,
            })
        ).toBeFalse();
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: -1,
            })
        ).toBeFalse();
        expect(hasPlanIDs({})).toBeFalse();
    });
});

describe('setQuantity', () => {
    it('should set plan id quantity', () => {
        expect(
            setQuantity(
                {
                    [PLANS.MAIL_PRO]: 1,
                },
                PLANS.MAIL_PRO,
                0
            )
        ).toEqual({});
        expect(
            setQuantity(
                {
                    [PLANS.MAIL_PRO]: 1,
                    [ADDON_NAMES.ADDRESS]: 1,
                },
                ADDON_NAMES.ADDRESS,
                0
            )
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
        });
        expect(setQuantity({}, ADDON_NAMES.ADDRESS, 0)).toEqual({});
        expect(setQuantity({}, ADDON_NAMES.ADDRESS, 1)).toEqual({
            [ADDON_NAMES.ADDRESS]: 1,
        });
    });
});

describe('clearPlanIDs', () => {
    it('should remove useless key', () => {
        const planIDs = {
            [PLANS.MAIL_PRO]: 1,
            [PLANS.VPN]: 0,
            [ADDON_NAMES.VPN]: 3,
        };
        expect(clearPlanIDs(planIDs)).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.VPN]: 3,
        });
    });
});

describe('switchPlan', () => {
    it('should remove previous plan', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const planID = PLANS.VISIONARY;
        expect(switchPlan({ planIDs, planID, plans: getTestPlans(), organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.VISIONARY]: 1,
        });
    });

    it('should transfer domain addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(switchPlan({ planIDs, planID, plans: getTestPlans(), organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should transfer member addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(switchPlan({ planIDs, planID, plans: getTestPlans(), organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should not transfer addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.MAIL;
        expect(switchPlan({ planIDs, planID, plans: getTestPlans(), organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.MAIL]: 1,
        });
    });

    it('should transfer addons based on organization usage', () => {
        const planIDs = { [PLANS.ENTERPRISE]: 1 };
        const organization = { UsedAddresses: 16, UsedDomains: 11 } as Organization;
        const planID = PLANS.BUNDLE_PRO;
        expect(switchPlan({ planIDs, planID, plans: getTestPlans(), organization })).toEqual({
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
        });
    });

    it('should transfer scribe addons', () => {
        const planIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 6,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 7,
        };
        const planId = PLANS.MAIL_PRO;

        const organization = {
            UsedAI: 0,
        } as Organization;

        expect(switchPlan({ planIDs, planID: planId, plans: getTestPlans(), organization })).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 6,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 7,
        });
    });
});
