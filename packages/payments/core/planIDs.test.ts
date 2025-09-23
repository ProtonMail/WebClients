import type { Organization } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP, getLongTestPlans } from '@proton/testing/data';

import { ADDON_NAMES, PLANS } from './constants';
import type { PlanIDs } from './interface';
import { getPlanNameFromIDs } from './plan/helpers';
import {
    clearPlanIDs,
    getPlanFromIDs,
    hasPlanIDs,
    planIDsPositiveDifference,
    setQuantity,
    switchPlan,
} from './planIDs';
import { SubscriptionPlatform } from './subscription/constants';

const MOCK_ORGANIZATION = {} as Organization;

describe('hasPlanIDs', () => {
    it('should return true if plan IDs are set', () => {
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
                [PLANS.VPN2024]: 0,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            })
        ).toEqual(true);

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
            })
        ).toEqual(true);

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
            })
        ).toEqual(true);

        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: -1,
            })
        ).toEqual(true);

        expect(
            hasPlanIDs({
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 1,
            })
        ).toEqual(true);
    });

    it('should return false if plan IDs are not set', () => {
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: 0,
            })
        ).toEqual(false);
        expect(
            hasPlanIDs({
                [PLANS.MAIL_PRO]: -1,
            })
        ).toEqual(false);
        expect(hasPlanIDs({})).toEqual(false);
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
            [PLANS.VPN2024]: 0,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        };
        expect(clearPlanIDs(planIDs)).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        });
    });
});

describe('switchPlan', () => {
    it('should remove previous plan', () => {
        const currentPlanIDs = { [PLANS.MAIL]: 1 };
        const newPlan = PLANS.VISIONARY;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.VISIONARY]: 1,
        });
    });

    it('should transfer domain addons', () => {
        const currentPlanIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const newPlan = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should transfer member addons', () => {
        const currentPlanIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5 };
        const newPlan = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
        });
    });

    it('should transfer IP addons when switching from vpn biz to bundle pro', () => {
        const currentPlanIDs = { [PLANS.VPN_BUSINESS]: 1, [ADDON_NAMES.IP_VPN_BUSINESS]: 5 };
        const newPlan = PLANS.BUNDLE_PRO_2024;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 6, // We expect 1 more than the IP_VPN_BUSINESS amount because one IP is included in that plan
        });
    });

    it('should transfer IP addons when switching from vpn biz to bundle pro when no IP addons have been included', () => {
        const currentPlanIDs = { [PLANS.VPN_BUSINESS]: 1 };
        const newPlan = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 1, // 1 IP is included in vpnbiz, so we need to add this
        });
    });

    it('should transfer IP addons when switching from bundle pro to vpn biz', () => {
        const currentPlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 5 };
        const newPlan = PLANS.VPN_BUSINESS;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
        });
    });

    it('should not transfer addons', () => {
        const currentPlanIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const newPlan = PLANS.MAIL;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.MAIL]: 1,
        });
    });

    it('should transfer addons based on organization usage', () => {
        const currentPlanIDs = { [PLANS.MAIL_PRO]: 1 };
        const organization = { UsedAddresses: 16, UsedDomains: 11 } as Organization;
        const newPlan = PLANS.BUNDLE_PRO;
        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
        });
    });

    it('should transfer scribe addons', () => {
        const currentPlanIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 6,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 7,
        };
        const newPlan = PLANS.MAIL_PRO;

        const organization = {
            UsedAI: 0,
        } as Organization;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 6,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 7,
        });
    });

    it('should transfer lumo addons', () => {
        const currentPlanIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 6,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 7,
        };
        const newPlan = PLANS.MAIL_PRO;

        const organization = {
            UsedLumo: 1,
            MaxLumo: 7,
        } as Organization;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 6,
            [ADDON_NAMES.LUMO_MAIL_PRO]: 7,
        });
    });

    it('should not transfer too many lumo addons - Mail Plus', () => {
        const currentPlanIDs = {
            [PLANS.VISIONARY]: 1,
        };
        const newPlan = PLANS.MAIL;

        const organization = {
            UsedLumo: 0,
            MaxLumo: 6,
        } as Organization;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 1,
        });
    });

    it('should not transfer too many lumo addons - Duo', () => {
        const currentPlanIDs = {
            [PLANS.VISIONARY]: 1,
        };
        const newPlan = PLANS.DUO;

        const organization = {
            UsedLumo: 0,
            MaxLumo: 6,
        } as Organization;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.DUO]: 1,
            [ADDON_NAMES.LUMO_DUO]: 2,
        });
    });

    it('should not transfer lumo addons if they are already included in the new plan', () => {
        const currentPlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1 };
        const newPlan = PLANS.VISIONARY;
        const organization = {
            UsedLumo: 2,
            MaxLumo: 2,
        } as Organization;

        expect(
            switchPlan({
                currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization,
            })
        ).toEqual({
            [PLANS.VISIONARY]: 1,
        });
    });

    it('should not transfer lumo addons if the user already has lumo on mobile (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(
            switchPlan({
                subscription,
                newPlan: PLANS.MAIL,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            [PLANS.MAIL]: 1,
        });
    });

    it('should not transfer addons if they are excluded', () => {
        const currentPlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO]: 1,
        };

        const newPlan = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['member']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            // [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5, //member addons are excluded
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: 'member',
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            // [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5, //member addons are excluded
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });

        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['ip']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            // [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4, // IP addon is excluded
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: 'ip',
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            // [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4, // IP addon is excluded
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });

        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['domain']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            // [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3, // domain addon is excluded
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: 'domain',
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            // [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3, // domain addon is excluded
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });

        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['lumo']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            // [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2, // lumo addon is excluded
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: 'lumo',
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            // [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2, // lumo addon is excluded
            [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
        });

        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['scribe']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            // [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1, // scribe addon is excluded
        });
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: 'scribe',
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 3,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            // [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1, // scribe addon is excluded
        });

        // exclude all addons
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: new Set(['member', 'ip', 'domain', 'lumo', 'scribe']),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });

        // exclude all addons
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: true,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });

        // exclude all addons
        expect(
            switchPlan({
                currentPlanIDs: currentPlanIDs,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                dontTransferAddons: ['member', 'ip', 'domain', 'lumo', 'scribe'],
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });
    });
});

describe('getPlanNameFromIDs', () => {
    it('should return the correct plan when it exists in planIDs', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanNameFromIDs(planIDs);
        expect(result).toEqual(PLANS.BUNDLE_PRO);
    });

    it('should return undefined when no plan exists in planIDs', () => {
        const planIDs: PlanIDs = {};

        const result = getPlanNameFromIDs(planIDs);
        expect(result).toBeUndefined();
    });

    it('should choose the plan instead of addons', () => {
        const planIDs: PlanIDs = {
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanNameFromIDs(planIDs);
        expect(result).toEqual(PLANS.BUNDLE_PRO);
    });

    it('should return the correct plan name', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_PRO]: 1,
            [ADDON_NAMES.MEMBER_VPN_PRO]: 12,
        };

        // these two checks are equivalent. I wanted to add them for expressiveness and readability
        expect(getPlanNameFromIDs(planIDs)).toEqual('vpnpro2023' as any);
        expect(getPlanNameFromIDs(planIDs)).toEqual(PLANS.VPN_PRO);
    });

    it('should return undefined if there are no plan IDs', () => {
        expect(getPlanNameFromIDs({})).toBeUndefined();
    });
});

describe('getPlanFromIDs', () => {
    it('should return the correct plan when it exists in planIDs', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanFromIDs(planIDs, PLANS_MAP);
        expect(result).toEqual(PLANS_MAP[PLANS.BUNDLE_PRO]);
    });

    it('should return undefined when no plan exists in planIDs', () => {
        const planIDs: PlanIDs = {};

        const result = getPlanFromIDs(planIDs, PLANS_MAP);
        expect(result).toBeUndefined();
    });

    it('should return the plan object even when addons are present', () => {
        const planIDs: PlanIDs = {
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanFromIDs(planIDs, PLANS_MAP);
        expect(result).toEqual(PLANS_MAP[PLANS.BUNDLE_PRO]);
    });

    it('should return the correct plan for VPN Pro with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_PRO]: 1,
            [ADDON_NAMES.MEMBER_VPN_PRO]: 12,
        };

        const result = getPlanFromIDs(planIDs, PLANS_MAP);
        expect(result).toEqual(PLANS_MAP[PLANS.VPN_PRO]);
    });

    it('should return undefined if plansMap is empty', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanFromIDs(planIDs, {});
        expect(result).toBeUndefined();
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
