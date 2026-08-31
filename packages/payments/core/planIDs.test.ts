import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { PLANS_MAP, getLongTestPlans } from '@proton/payments/testing/data-plans';
import type { Organization } from '@proton/shared/lib/interfaces';

import { ADDON_NAMES, ADDON_PREFIXES, PLANS } from './constants';
import type { PlanIDs } from './interface';
import { getPlanNameFromIDs } from './plan/helpers';
import {
    clearPlanIDs,
    getAddonsFromIDs,
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
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 1, // vpn biz has 2 members, bundle pro has 1 member, so we add an addon to match the difference
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
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 1, // vpn biz has 2 members, bundle pro has 1 member, so we add an addon to match the difference
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

    // The member transfer takes Math.max across five org-usage resource terms (space/addresses/VPN/
    // members/calendars). Each case below pushes ONE term so it dominates, switching mailpro -> bundlepro
    // (same plan MaxMembers, so the plan-baseline term is 0). Target member addon 1member-bundlepro2022
    // grants: MaxSpace 1 TiB, MaxVPN 10, MaxCalendars 25, MaxMembers 1.
    describe('member addon transfer — organization usage terms', () => {
        const TIB = 1024 ** 4;
        const transferToBundlePro = (organization: Organization) =>
            switchPlan({
                currentPlanIDs: { [PLANS.MAIL_PRO]: 1 },
                newPlan: PLANS.BUNDLE_PRO,
                plans: getLongTestPlans(),
                organization,
            });

        it('sizes members by used space (UsedSpace, single member)', () => {
            // diff = 4 TiB used − 1 TiB plan = 3 TiB; ceil(3 TiB / 1 TiB addon) = 3
            expect(transferToBundlePro({ UsedMembers: 1, UsedSpace: 4 * TIB } as Organization)).toEqual({
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 3,
            });
        });

        it('sizes members by assigned space when there are multiple members (AssignedSpace)', () => {
            // UsedMembers > 1 ⇒ impl reads AssignedSpace. diff = 3 TiB − 1 TiB = 2 TiB ⇒ 2 (dominates the
            // members term of 1 from UsedMembers=2).
            expect(transferToBundlePro({ UsedMembers: 2, AssignedSpace: 3 * TIB } as Organization)).toEqual({
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
            });
        });

        it('sizes members by used VPN connections (UsedVPN)', () => {
            // diff = 45 − 10 = 35; ceil(35 / 10) = 4
            expect(transferToBundlePro({ UsedVPN: 45 } as Organization)).toEqual({
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 4,
            });
        });

        it('sizes members by used calendars (UsedCalendars)', () => {
            // diff = 130 − 25 = 105; ceil(105 / 25) = 5
            expect(transferToBundlePro({ UsedCalendars: 130 } as Organization)).toEqual({
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5,
            });
        });

        it('sizes members by used members (UsedMembers)', () => {
            // diff = 7 − 1 = 6; ceil(6 / 1) = 6
            expect(transferToBundlePro({ UsedMembers: 7 } as Organization)).toEqual({
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 6,
            });
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
                dontTransferAddons: new Set([ADDON_PREFIXES.MEMBER]),
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
                dontTransferAddons: ADDON_PREFIXES.MEMBER,
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
                dontTransferAddons: new Set([ADDON_PREFIXES.IP]),
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
                dontTransferAddons: ADDON_PREFIXES.IP,
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
                dontTransferAddons: new Set([ADDON_PREFIXES.DOMAIN]),
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
                dontTransferAddons: ADDON_PREFIXES.DOMAIN,
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
                dontTransferAddons: new Set([ADDON_PREFIXES.LUMO]),
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
                dontTransferAddons: ADDON_PREFIXES.LUMO,
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
                dontTransferAddons: new Set([ADDON_PREFIXES.SCRIBE]),
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
                dontTransferAddons: ADDON_PREFIXES.SCRIBE,
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
                dontTransferAddons: new Set([
                    ADDON_PREFIXES.MEMBER,
                    ADDON_PREFIXES.IP,
                    ADDON_PREFIXES.DOMAIN,
                    ADDON_PREFIXES.LUMO,
                    ADDON_PREFIXES.SCRIBE,
                ]),
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
                dontTransferAddons: [
                    ADDON_PREFIXES.MEMBER,
                    ADDON_PREFIXES.IP,
                    ADDON_PREFIXES.DOMAIN,
                    ADDON_PREFIXES.LUMO,
                    ADDON_PREFIXES.SCRIBE,
                ],
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
        });
    });

    it('should not transfer scribe addon when lumo is already transferred', () => {
        expect(
            switchPlan({
                subscription: buildSubscription({
                    [PLANS.LUMO_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_LUMO_BUSINESS]: 1,
                }),
                newPlan: PLANS.BUNDLE_PRO_2024,
                organization: {
                    ...MOCK_ORGANIZATION,
                    UsedMembers: 1,
                    AssignedSpace: 2671771648,
                    UsedSpace: 0,
                    UsedAddresses: 0,
                    UsedVPN: 0,
                    UsedCalendars: 0,
                    UsedDomains: 0,
                    UsedAI: 1,
                    MaxLumo: 2,
                },
                plans: getLongTestPlans(),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
        });
    });

    it('should transfer from Scribe to Lumo addons', () => {
        expect(
            switchPlan({
                subscription: buildSubscription({
                    [PLANS.MAIL_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 2,
                }),
                newPlan: PLANS.LUMO_BUSINESS,
                organization: {
                    ...MOCK_ORGANIZATION,
                    UsedAI: 2,
                },
                plans: getLongTestPlans(),
            })
        ).toEqual({
            [PLANS.LUMO_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_LUMO_BUSINESS]: 1,
        });
    });

    it('should transfer the new addons', () => {
        expect(
            switchPlan({
                subscription: buildSubscription(PLANS.FAMILY),
                newPlanIDs: {
                    [PLANS.BUNDLE_PRO_2024]: 1,
                    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1,
                },
                organization: {
                    ...MOCK_ORGANIZATION,
                    UsedAI: 1,
                },
                plans: getLongTestPlans(),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            // because Family has 6 members. Bundle pro has 1 member + 5 member addons.
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1,
        });

        expect(
            switchPlan({
                subscription: buildSubscription(PLANS.FAMILY),
                newPlanIDs: {
                    [PLANS.BUNDLE_PRO_2024]: 1,
                    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1,
                },
                organization: {
                    ...MOCK_ORGANIZATION,
                    UsedAI: 2,
                },
                plans: getLongTestPlans(),
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            // because Family has 6 members. Bundle pro has 1 member + 5 member addons.
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 5,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
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

    it('should correctly transfer members from VPN_BUSINESS to vpnpassbiz2025', () => {
        const subscription = buildSubscription({
            // total 5 members: 2 in the plan + 3 in the addons
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 3,
        });

        const newPlan = PLANS.VPN_PASS_BUNDLE_BUSINESS;
        expect(
            switchPlan({
                subscription,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            // total 5 members: 1 in the plan + 4 in the addons
            [PLANS.VPN_PASS_BUNDLE_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS]: 4,
            [ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS]: 1,
        });
    });

    it('should correctly transfer members from VPN_BUSINESS to bundlepro2024', () => {
        const subscription = buildSubscription({
            // total 5 members: 2 in the plan + 3 in the addons
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 3,
        });

        const newPlan = PLANS.BUNDLE_PRO_2024;
        expect(
            switchPlan({
                subscription,
                newPlan,
                plans: getLongTestPlans(),
                organization: MOCK_ORGANIZATION,
            })
        ).toEqual({
            // total 5 members: 1 in the plan + 4 in the addons
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 4,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 1,
        });
    });
});

describe('getAddonsFromIDs', () => {
    it('should return the correct addons from planIDs', () => {
        const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 1 };
        const result = getAddonsFromIDs(planIDs);
        expect(result).toEqual({ [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 1 });
    });

    it('should return empty object if there are no addons', () => {
        const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1 };
        const result = getAddonsFromIDs(planIDs);
        expect(result).toEqual({});
    });
});
