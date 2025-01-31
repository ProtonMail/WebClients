import { ADDON_NAMES, CYCLE, PLANS, type PlanIDs, SelectedPlan } from '@proton/payments';
import { pick } from '@proton/shared/lib/helpers/object';
import { type AggregatedPricing } from '@proton/shared/lib/helpers/subscription';
import { PLANS_MAP, getLongTestPlans } from '@proton/testing/data';

import {
    clearPlanIDs,
    getPlanFromIDs,
    getPlanNameFromIDs,
    getPricingFromPlanIDs,
    getTotalFromPricing,
    hasPlanIDs,
    planIDsPositiveDifference,
    setQuantity,
    switchPlan,
} from '../../lib/helpers/planIDs';
import {
    ChargebeeEnabled,
    type Organization,
    type PlansMap,
    type SubscriptionCheckResponse,
    type User,
} from '../../lib/interfaces';

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
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
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
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
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
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
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
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 6, // We expect 1 more than the IP_VPN_BUSINESS amount because one IP is included in that plan
        });
    });

    it('should transfer IP addons when switching from vpn biz to bundle pro when no IP addons have been included', () => {
        const planIDs = { [PLANS.VPN_BUSINESS]: 1 };
        const planID = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 1, // 1 IP is included in vpnbiz, so we need to add this
        });
    });

    it('should transfer IP addons when switching from bundle pro to vpn biz', () => {
        const planIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 5 };
        const planID = PLANS.VPN_BUSINESS;
        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
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
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
                user,
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
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization,
                user,
            })
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
                plans: getLongTestPlans(),
                organization,
                user,
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
                plans: getLongTestPlans(),
                organization,
                user,
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });
    });

    it('should transfer lumo addons', () => {
        const planIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 6,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 7,
        };
        const planId = PLANS.MAIL_PRO;

        const organization = {
            UsedLumo: 1,
            MaxLumo: 7,
        } as Organization;

        expect(
            switchPlan({
                planIDs,
                planID: planId,
                plans: getLongTestPlans(),
                organization,
                user,
            })
        ).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 6,
            [ADDON_NAMES.LUMO_MAIL_PRO]: 7,
        });
    });

    it('should not transfer too many lumo addons - Mail Plus', () => {
        const planIDs = {
            [PLANS.VISIONARY]: 1,
        };
        const planID = PLANS.MAIL;

        const organization = {
            UsedLumo: 0,
            MaxLumo: 6,
        } as Organization;

        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization,
                user,
            })
        ).toEqual({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 1,
        });
    });

    it('should not transfer too many lumo addons - Duo', () => {
        const planIDs = {
            [PLANS.VISIONARY]: 1,
        };
        const planID = PLANS.DUO;

        const organization = {
            UsedLumo: 0,
            MaxLumo: 6,
        } as Organization;

        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization,
                user,
            })
        ).toEqual({
            [PLANS.DUO]: 1,
            [ADDON_NAMES.LUMO_DUO]: 2,
        });
    });

    it('should not transfer lumo addons if they are already included in the new plan', () => {
        const planIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1 };
        const planID = PLANS.VISIONARY;
        const organization = {
            UsedLumo: 2,
            MaxLumo: 2,
        } as Organization;

        expect(
            switchPlan({
                planIDs,
                planID,
                plans: getLongTestPlans(),
                organization,
                user,
            })
        ).toEqual({
            [PLANS.VISIONARY]: 1,
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

describe('getPricingFromPlanIDs', () => {
    it('returns the correct pricing for a single plan ID', () => {
        const planIDs: PlanIDs = { pass2023: 1 };
        const plansMap: PlansMap = {
            pass2023: {
                ID: 'id123',
                ParentMetaPlanID: '',
                Type: 1,
                Name: PLANS.PASS,
                Title: 'Pass Plus',
                MaxDomains: 0,
                MaxAddresses: 0,
                MaxCalendars: 0,
                MaxSpace: 0,
                MaxMembers: 0,
                MaxVPN: 0,
                MaxTier: 0,
                Services: 8,
                Features: 0,
                State: 1,
                Pricing: {
                    '1': 499,
                    '12': 1200,
                    '24': 7176,
                },
                PeriodEnd: {
                    '1': 1678452604,
                    '12': 1707569404,
                    '24': 1739191804,
                },
                Currency: 'CHF',
                Quantity: 1,
                Offers: [
                    {
                        Name: 'passlaunch',
                        StartTime: 1684758588,
                        EndTime: 1688110913,
                        Pricing: {
                            '12': 1200,
                        },
                    },
                ],
                Cycle: 1,
                Amount: 499,
            },
        };

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 499,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
                '24': 7176,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
                '24': 7176,
                '30': 0,
            },
            plans: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
                '24': 7176,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);
        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Mail Pro: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.MAIL_PRO]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);
        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Mail Pro: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 7,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.MAIL_PRO, ADDON_NAMES.MEMBER_MAIL_PRO]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 6392,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 6392,
                '3': 0,
                '12': 67104,
                '15': 0,
                '18': 0,
                '24': 124608,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 6392,
                '3': 0,
                '12': 67104,
                '15': 0,
                '18': 0,
                '24': 124608,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Bundle Pro: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.BUNDLE_PRO]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 1299,
            defaultMonthlyPriceWithoutAddons: 1299,
            all: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Bundle Pro: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 7,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 9,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [
            PLANS.BUNDLE_PRO,
            ADDON_NAMES.MEMBER_BUNDLE_PRO,
            ADDON_NAMES.DOMAIN_BUNDLE_PRO,
        ]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 11742,
            defaultMonthlyPriceWithoutAddons: 1299,
            all: {
                '1': 11742,
                '3': 0,
                '12': 120624,
                '15': 0,
                '18': 0,
                '24': 219888,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 10392,
                '3': 0,
                '12': 105504,
                '15': 0,
                '18': 0,
                '24': 191808,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Family', () => {
        const planIDs: PlanIDs = {
            [PLANS.FAMILY]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.FAMILY]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 2999,
            defaultMonthlyPriceWithoutAddons: 2999,
            all: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
                '24': 47976,
                '30': 0,
            },
            // Even though Family Plan does have up to 6 users, we still count as 1 member for price displaying
            // purposes
            membersNumber: 1,
            members: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
                '24': 47976,
                '30': 0,
            },
            plans: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
                '24': 47976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Essentials: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_PRO]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 1798,
            defaultMonthlyPriceWithoutAddons: 1798,
            all: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Essentials: with addons', () => {
        const planIDs: PlanIDs = {
            // be default VPN Pro has 2 members, so overall there's 9 members for the price calculation purposes
            [PLANS.VPN_PRO]: 1,
            [ADDON_NAMES.MEMBER_VPN_PRO]: 7,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_PRO, ADDON_NAMES.MEMBER_VPN_PRO]);

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 8091,
            defaultMonthlyPriceWithoutAddons: 1798,
            all: {
                '1': 8091,
                '3': 0,
                '12': 75492,
                '15': 0,
                '18': 0,
                '24': 129384,
                '30': 0,
            },
            membersNumber: 9,
            members: {
                '1': 8091,
                '3': 0,
                '12': 75492,
                '15': 0,
                '18': 0,
                '24': 129384,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Business: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_BUSINESS]);

        // VPN Business has 2 members and 1 IP by default.
        // monthly: each user currently costs 11.90 and IP 49.99.
        // yearly: (2*9.99 + 39.99) * 12
        // 2 years: (2*8.99 + 35.99) * 24
        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 7379,
            defaultMonthlyPriceWithoutAddons: 7379,
            all: {
                '1': 7379,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 2380,
                '3': 0,
                '12': 23976,
                '15': 0,
                '18': 0,
                '24': 43152,
                '30': 0,
            },
            plans: {
                '1': 7379,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Business: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 7,
            [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [
            PLANS.VPN_BUSINESS,
            ADDON_NAMES.MEMBER_VPN_BUSINESS,
            ADDON_NAMES.IP_VPN_BUSINESS,
        ]);

        // VPN Business has 2 members and 1 IP by default.
        // monthly: each user currently costs 11.90 and IP 49.99.
        // yearly: (2*9.99 + 39.99) * 12
        // 2 years: (2*8.99 + 35.99) * 24
        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 30706,
            defaultMonthlyPriceWithoutAddons: 7379,
            all: {
                '1': 30706,
                '3': 0,
                '12': 299844,
                '15': 0,
                '18': 0,
                '24': 539688,
                '30': 0,
            },
            // Pricing for 9 members
            membersNumber: 9,
            members: {
                '1': 10710,
                '3': 0,
                '12': 107892,
                '15': 0,
                '18': 0,
                '24': 194184,
                '30': 0,
            },
            plans: {
                '1': 7379,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });
});

describe('getTotalFromPricing', () => {
    it('should calculate the prices correctly', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 8596,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 8596,
                '3': 0,
                '12': 83952,
                '15': 0,
                '18': 0,
                '24': 151104,
                '30': 0,
            },
            members: {
                '1': 3597,
                '3': 0,
                '12': 35964,
                '15': 0,
                '18': 0,
                '24': 64728,
                '30': 0,
            },
            membersNumber: 3,
            plans: {
                '1': 7397,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
        };

        expect(getTotalFromPricing(pricing, 1)).toEqual({
            discount: 0,
            discountPercentage: 0,
            discountedTotal: 8596,
            totalPerMonth: 8596,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 1199,
            viewPricePerMonth: 8596,
        });

        expect(getTotalFromPricing(pricing, 12)).toEqual({
            discount: 19200,
            discountPercentage: 19,
            discountedTotal: 83952,
            totalPerMonth: 6996,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 999,
            viewPricePerMonth: 6996,
        });

        expect(getTotalFromPricing(pricing, 24)).toEqual({
            discount: 55200,
            discountPercentage: 27,
            discountedTotal: 151104,
            totalPerMonth: 6296,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 899,
            viewPricePerMonth: 6296,
        });
    });

    it('should calculate the prices correctly from a different monthly price', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 999,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            members: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            plans: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            membersNumber: 1,
        };

        expect(getTotalFromPricing(pricing, 1)).toEqual({
            discount: 0,
            discountPercentage: 0,
            discountedTotal: 899,
            totalPerMonth: 899,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 899,
            viewPricePerMonth: 899,
        });

        expect(getTotalFromPricing(pricing, 12)).toEqual({
            discount: 4800,
            discountPercentage: 40,
            discountedTotal: 7188,
            totalPerMonth: 599,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 599,
            viewPricePerMonth: 599,
        });

        expect(getTotalFromPricing(pricing, 24)).toEqual({
            discount: 12000,
            discountPercentage: 50,
            discountedTotal: 11976,
            totalPerMonth: 499,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 499,
            viewPricePerMonth: 499,
        });
    });

    it('should calculate the prices correctly - Mail Essentials', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_PRO]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'USD');
        expect(getTotalFromPricing(pricing, 12, 'all', [], selectedPlan)).toEqual({
            discount: 1200,
            discountedTotal: 8388,
            perUserPerMonth: 699,
            viewPricePerMonth: 699,
            discountPercentage: 13,
            totalPerMonth: 699,
            totalNoDiscountPerMonth: 799,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with scribe', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 1198,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 1198,
                '3': 0,
                '12': 11976,
                '15': 0,
                '18': 0,
                '24': 22752,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan(
            { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 },
            PLANS_MAP,
            CYCLE.YEARLY,
            'USD'
        );
        expect(getTotalFromPricing(pricing, 12, 'all', [], selectedPlan)).toEqual({
            discount: 2400,
            discountedTotal: 11976,
            perUserPerMonth: 699,
            viewPricePerMonth: 699,
            discountPercentage: 17,
            totalPerMonth: 998,
            totalNoDiscountPerMonth: 1198,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with discount', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_PRO]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'USD');
        expect(
            getTotalFromPricing(
                pricing,
                12,
                'all',
                [
                    {
                        Amount: 799,
                        Currency: 'USD',
                        AmountDue: 0,
                        Proration: 0,
                        CouponDiscount: -200,
                        Gift: 0,
                        Credit: -599,
                        UnusedCredit: 0,
                        Coupon: {
                            Code: 'ONETEST25',
                            Description: 'One-time 25% discount',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 1,
                        SubscriptionMode: 0,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.1,
                                Amount: 45,
                            },
                        ],
                        PeriodEnd: 0,
                    },
                    {
                        Amount: 8388,
                        Currency: 'USD',
                        AmountDue: 0,
                        Proration: 0,
                        CouponDiscount: -2097,
                        Gift: 0,
                        Credit: -6291,
                        UnusedCredit: 0,
                        Coupon: {
                            Code: 'ONETEST25',
                            Description: 'One-time 25% discount',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 12,
                        SubscriptionMode: 0,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.1,
                                Amount: 471,
                            },
                        ],
                        PeriodEnd: 0,
                    },
                ],
                selectedPlan
            )
        ).toEqual({
            discount: 3297,
            discountedTotal: 6291,
            perUserPerMonth: 524.25,
            viewPricePerMonth: 524.25,
            discountPercentage: 34,
            totalPerMonth: 524.25,
            totalNoDiscountPerMonth: 799,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with discount and scribe', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 1198,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 1198,
                '3': 0,
                '12': 11976,
                '15': 0,
                '18': 0,
                '24': 22752,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const cycle = CYCLE.YEARLY;
        const mode = 'all';
        const checkResults: SubscriptionCheckResponse[] = [
            {
                PeriodEnd: 0,
                Amount: 1198,
                Currency: 'USD',
                AmountDue: 0,
                Proration: 0,
                CouponDiscount: -300,
                Gift: 0,
                Credit: -898,
                UnusedCredit: 0,
                Coupon: {
                    Code: 'ONETEST25',
                    Description: 'One-time 25% discount',
                    MaximumRedemptionsPerUser: 1,
                },
                Cycle: 1,
                SubscriptionMode: 0,
                TaxInclusive: 1,
                Taxes: [
                    {
                        Name: 'Mehrwertsteuer (MWST)',
                        Rate: 8.1,
                        Amount: 67,
                    },
                ],
            },
            {
                PeriodEnd: 0,
                Amount: 11976,
                Currency: 'USD',
                AmountDue: 0,
                Proration: 0,
                CouponDiscount: -2994,
                Gift: 0,
                Credit: -8982,
                UnusedCredit: 0,
                Coupon: {
                    Code: 'ONETEST25',
                    Description: 'One-time 25% discount',
                    MaximumRedemptionsPerUser: 1,
                },
                Cycle: 12,
                SubscriptionMode: 0,
                TaxInclusive: 1,
                Taxes: [
                    {
                        Name: 'Mehrwertsteuer (MWST)',
                        Rate: 8.1,
                        Amount: 673,
                    },
                ],
            },
        ];
        const selectedPlan = new SelectedPlan(
            { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 },
            PLANS_MAP,
            cycle,
            'USD'
        );

        expect(getTotalFromPricing(pricing, 12, mode, checkResults, selectedPlan)).toEqual({
            discount: 5394,
            discountPercentage: 38,
            discountedTotal: 8982,
            totalPerMonth: 748.5,
            totalNoDiscountPerMonth: 1198,
            perUserPerMonth: 524.25,
            viewPricePerMonth: 524.25,
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
