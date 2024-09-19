import { getTestPlans } from '@proton/testing/data';

import { ADDON_NAMES, PLANS } from '../../lib/constants';
import {
    clearPlanIDs,
    hasPlanIDs,
    planIDsPositiveDifference,
    setQuantity,
    switchPlan,
} from '../../lib/helpers/planIDs';
import { ChargebeeEnabled, type Organization, type User } from '../../lib/interfaces';

const MOCK_ORGANIZATION = {} as Organization;

describe('hasPlanIDs', () => {
    it('should return true if plan IDs are set', () => {
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
                [PLANS.VPN]: 0,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
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
                [ADDON_NAMES.MEMBER_MAIL_PRO]: -1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
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
                    [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
                },
                ADDON_NAMES.MEMBER_MAIL_PRO,
                0
            )
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
        });
        expect(setQuantity({}, ADDON_NAMES.MEMBER_MAIL_PRO, 0)).toEqual({});
        expect(setQuantity({}, ADDON_NAMES.MEMBER_MAIL_PRO, 1)).toEqual({
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
        });
    });
});

describe('clearPlanIDs', () => {
    it('should remove useless key', () => {
        const planIDs = {
            [PLANS.MAIL_PRO]: 1,
            [PLANS.VPN]: 0,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        };
        expect(clearPlanIDs(planIDs)).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        });
    });
});

describe('switchPlan', () => {
    const user = {
        ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED,
    } as User;

    it('should remove previous plan', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const planID = PLANS.VISIONARY;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.VISIONARY]: 1,
        });
    });

    it('should transfer domain addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should transfer member addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should transfer IP addons when switching from vpn biz to bundle pro', () => {
        const planIDs = { [PLANS.VPN_BUSINESS]: 1, [ADDON_NAMES.IP_VPN_BUSINESS]: 5 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: true,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 6, // We expect 1 more than the IP_VPN_BUSINESS amount because one IP is included in that plan
        });
    });

    it('should transfer IP addons when switching from bundle pro to vpn biz', () => {
        const planIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 5 };
        const planID = PLANS.VPN_BUSINESS;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: true,
            })
        ).toEqual({
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
        });
    });

    it('should not transfer addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.MAIL;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.MAIL]: 1,
        });
    });

    it('should transfer addons based on organization usage', () => {
        const planIDs = { [PLANS.ENTERPRISE]: 1 };
        const organization = { UsedAddresses: 16, UsedDomains: 11 } as Organization;
        const planID = PLANS.BUNDLE_PRO;
        expect(
            switchPlan({ planIDs, planID, plans: getTestPlans(), organization, user, showGatewaysForBundlePlan: false })
        ).toEqual({
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

        expect(
            switchPlan({
                planIDs,
                planID: planId,
                plans: getTestPlans(),
                organization,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 6,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 7,
        });
    });

    it('should not transfer scribe addons if user is not chargebee eligible', () => {
        const planIDs = {
            [PLANS.VISIONARY]: 1,
        };

        const planId = PLANS.BUNDLE_PRO_2024;

        const organization = {
            UsedAI: 6,
        } as Organization;

        const user = {
            ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
        } as User;

        expect(
            switchPlan({
                planIDs,
                planID: planId,
                plans: getTestPlans(),
                organization,
                user,
                showGatewaysForBundlePlan: false,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });
    });
});

describe('planIDsPositiveDifference', () => {
    it('should return empty object if plans are undefined', () => {
        expect(planIDsPositiveDifference(null as any, null as any)).toEqual({});
        expect(planIDsPositiveDifference(null as any, {})).toEqual({});
        expect(planIDsPositiveDifference({}, null as any)).toEqual({});

        expect(planIDsPositiveDifference(undefined as any, undefined as any)).toEqual({});
        expect(planIDsPositiveDifference(undefined as any, {})).toEqual({});
        expect(planIDsPositiveDifference({}, undefined as any)).toEqual({});
    });

    it('should return empty object if plans are the same', () => {
        const planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 };
        expect(planIDsPositiveDifference(planIDs, planIDs)).toEqual({});
    });

    it('should return difference if it is positive', () => {
        const planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 };
        const newPlanIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 2 };
        expect(planIDsPositiveDifference(planIDs, newPlanIDs)).toEqual({
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
        });
    });

    it('should NOT return difference if it is negative', () => {
        const planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 2 };
        const newPlanIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 };
        expect(planIDsPositiveDifference(planIDs, newPlanIDs)).toEqual({});
    });
});
