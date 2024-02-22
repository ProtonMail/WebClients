import { ADDON_NAMES, PLANS, PLAN_NAMES, PLAN_SERVICES, PLAN_TYPES } from '../../lib/constants';
import { clearPlanIDs, getHasPlanType, hasPlanIDs, setQuantity, switchPlan } from '../../lib/helpers/planIDs';
import { Organization, Plan } from '../../lib/interfaces';

const MOCK_PLANS = [
    {
        Title: PLAN_NAMES[PLANS.MAIL],
        ID: PLANS.MAIL,
        Name: PLANS.MAIL,
        Services: PLAN_SERVICES.MAIL,
        Type: PLAN_TYPES.PLAN,
        MaxDomains: 1,
        MaxAddresses: 10,
        MaxCalendars: 25,
        MaxSpace: 16106127360,
        MaxMembers: 1,
        MaxVPN: 0,
        MaxTier: 0,
        Features: 1,
        State: 1,
        Pricing: {
            1: 499,
            12: 4788,
            24: 8376,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        Title: PLAN_NAMES[PLANS.MAIL_PRO],
        ID: PLANS.MAIL_PRO,
        Name: PLANS.MAIL_PRO,
        Services: PLAN_SERVICES.MAIL,
        Type: PLAN_TYPES.PLAN,
        MaxDomains: 3,
        MaxAddresses: 10,
        MaxCalendars: 25,
        MaxSpace: 16106127360,
        MaxMembers: 1,
        MaxVPN: 0,
        MaxTier: 0,
        Features: 1,
        State: 1,
        Pricing: {
            1: 799,
            12: 8388,
            24: 15576,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: PLANS.NEW_VISIONARY,
        Name: PLANS.NEW_VISIONARY,
        Type: PLAN_TYPES.PLAN,
        Title: PLAN_NAMES[PLANS.NEW_VISIONARY],
        MaxDomains: 10,
        MaxAddresses: 100,
        MaxCalendars: 120,
        MaxSpace: 3298534883328,
        MaxMembers: 6,
        MaxVPN: 60,
        MaxTier: 2,
        Services: 7,
        Features: 1,
        State: 0,
        Pricing: {
            1: 2999,
            12: 28788,
            24: 47976,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: PLANS.VPN,
        Name: PLANS.VPN,
        Type: PLAN_TYPES.PLAN,
        Title: PLAN_NAMES[PLANS.VPN],
        MaxDomains: 0,
        MaxAddresses: 0,
        MaxCalendars: 0,
        MaxSpace: 0,
        MaxMembers: 0,
        MaxVPN: 10,
        MaxTier: 2,
        Services: 4,
        Features: 0,
        State: 1,
        Pricing: {
            1: 999,
            12: 7188,
            24: 11976,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: PLANS.BUNDLE,
        Name: PLANS.BUNDLE,
        Type: PLAN_TYPES.PLAN,
        Title: PLAN_NAMES[PLANS.BUNDLE],
        MaxDomains: 3,
        MaxAddresses: 15,
        MaxCalendars: 25,
        MaxSpace: 536870912000,
        MaxMembers: 1,
        MaxVPN: 10,
        MaxTier: 2,
        Services: 7,
        Features: 1,
        State: 1,
        Pricing: {
            1: 1199,
            12: 11988,
            24: 19176,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: PLANS.BUNDLE_PRO,
        Name: PLANS.BUNDLE_PRO,
        Type: PLAN_TYPES.PLAN,
        Title: PLAN_NAMES[PLANS.BUNDLE_PRO],
        MaxDomains: 10,
        MaxAddresses: 15,
        MaxCalendars: 25,
        MaxSpace: 536870912000,
        MaxMembers: 1,
        MaxVPN: 10,
        MaxTier: 2,
        Services: 7,
        Features: 1,
        State: 1,
        Pricing: {
            1: 1299,
            12: 13188,
            24: 23976,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
        Amount: 1299,
    },
    {
        ID: PLANS.ENTERPRISE,
        Type: PLAN_TYPES.PLAN,
        Name: PLANS.ENTERPRISE,
        Title: PLAN_NAMES[PLANS.ENTERPRISE],
        MaxDomains: 10,
        MaxAddresses: 15,
        MaxCalendars: 25,
        MaxSpace: 1099511627776,
        MaxMembers: 1,
        MaxVPN: 10,
        MaxTier: 2,
        Services: 7,
        Features: 1,
        State: 1,
        Pricing: {
            1: 1599,
            12: 16788,
            24: 31176,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: ADDON_NAMES.DOMAIN_BUNDLE_PRO,
        Type: PLAN_TYPES.ADDON,
        Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO,
        Title: '+1 Domain for Business',
        MaxDomains: 1,
        MaxAddresses: 0,
        MaxCalendars: 0,
        MaxSpace: 0,
        MaxMembers: 0,
        MaxVPN: 0,
        MaxTier: 0,
        Services: 7,
        Features: 0,
        State: 1,
        Pricing: {
            1: 150,
            12: 1680,
            24: 3120,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: ADDON_NAMES.MEMBER_MAIL_PRO,
        Type: PLAN_TYPES.ADDON,
        Name: ADDON_NAMES.MEMBER_MAIL_PRO,
        Title: '+1 User',
        MaxDomains: 0,
        MaxAddresses: 10,
        MaxCalendars: 25,
        MaxSpace: 16106127360,
        MaxMembers: 1,
        MaxVPN: 0,
        MaxTier: 0,
        Services: 1,
        Features: 0,
        State: 1,
        Pricing: {
            1: 799,
            12: 8388,
            24: 15576,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: ADDON_NAMES.MEMBER_BUNDLE_PRO,
        Type: PLAN_TYPES.ADDON,
        Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
        Title: '+1 User for Business',
        MaxDomains: 0,
        MaxAddresses: 15,
        MaxCalendars: 25,
        MaxSpace: 536870912000,
        MaxMembers: 1,
        MaxVPN: 10,
        MaxTier: 0,
        Services: 7,
        Features: 0,
        State: 1,
        Pricing: {
            1: 1299,
            12: 13188,
            24: 23976,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: ADDON_NAMES.DOMAIN_ENTERPRISE,
        Type: PLAN_TYPES.ADDON,
        Name: ADDON_NAMES.DOMAIN_ENTERPRISE,
        Title: '+1 Domain for Enterprise',
        MaxDomains: 1,
        MaxAddresses: 0,
        MaxCalendars: 0,
        MaxSpace: 0,
        MaxMembers: 0,
        MaxVPN: 0,
        MaxTier: 0,
        Services: 7,
        Features: 0,
        State: 1,
        Pricing: {
            1: 1599,
            12: 16788,
            24: 31176,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
    {
        ID: ADDON_NAMES.MEMBER_ENTERPRISE,
        Type: 0,
        Name: ADDON_NAMES.MEMBER_ENTERPRISE,
        Title: '+1 User for Enterprise',
        MaxDomains: 0,
        MaxAddresses: 15,
        MaxCalendars: 25,
        MaxSpace: 1099511627776,
        MaxMembers: 1,
        MaxVPN: 10,
        MaxTier: 0,
        Services: 7,
        Features: 0,
        State: 1,
        Pricing: {
            1: 1599,
            12: 16788,
            24: 31176,
        },
        Currency: 'EUR',
        Quantity: 1,
        Cycle: 1,
    },
] as Plan[];

const MOCK_ORGANIZATION = {} as Organization;

describe('hasPlanType', () => {
    it('should return true if plan type is set', () => {
        expect(getHasPlanType({ [PLANS.MAIL_PRO]: 1 }, MOCK_PLANS, PLANS.MAIL_PRO)).toBeTrue();
        expect(getHasPlanType({ [PLANS.MAIL]: 1, [PLANS.MAIL_PRO]: 1 }, MOCK_PLANS, PLANS.MAIL_PRO)).toBeTrue();
        expect(
            getHasPlanType(
                { [PLANS.NEW_VISIONARY]: 1, [PLANS.MAIL]: 1, [PLANS.MAIL_PRO]: 1 },
                MOCK_PLANS,
                PLANS.NEW_VISIONARY
            )
        ).toBeTrue();
    });
    it('should not return true if plan type is not set', () => {
        expect(getHasPlanType({ [PLANS.MAIL_PRO]: 0 }, MOCK_PLANS, PLANS.MAIL_PRO)).toBeFalse();
        expect(getHasPlanType({ [PLANS.MAIL]: 1 }, MOCK_PLANS, PLANS.MAIL_PRO)).toBeFalse();
        expect(getHasPlanType({ [PLANS.MAIL]: 1, [PLANS.MAIL_PRO]: 1 }, MOCK_PLANS, PLANS.NEW_VISIONARY)).toBeFalse();
    });
});

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
        const planID = PLANS.NEW_VISIONARY;
        expect(switchPlan({ planIDs, planID, plans: MOCK_PLANS, organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.NEW_VISIONARY]: 1,
        });
    });

    it('should transfer domain addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.ENTERPRISE;
        expect(switchPlan({ planIDs, planID, plans: MOCK_PLANS, organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.ENTERPRISE]: 1,
            [ADDON_NAMES.DOMAIN_ENTERPRISE]: 5,
        });
    });

    it('should transfer member addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5 };
        const planID = PLANS.ENTERPRISE;
        expect(switchPlan({ planIDs, planID, plans: MOCK_PLANS, organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.ENTERPRISE]: 1,
            [ADDON_NAMES.MEMBER_ENTERPRISE]: 5,
        });
    });

    it('should not transfer addons', () => {
        const planIDs = { [PLANS.BUNDLE_PRO]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5 };
        const planID = PLANS.MAIL;
        expect(switchPlan({ planIDs, planID, plans: MOCK_PLANS, organization: MOCK_ORGANIZATION })).toEqual({
            [PLANS.MAIL]: 1,
        });
    });

    it('should transfer addons based on organization usage', () => {
        const planIDs = { [PLANS.ENTERPRISE]: 1 };
        const organization = { UsedAddresses: 16, UsedDomains: 11 } as Organization;
        const planID = PLANS.BUNDLE_PRO;
        expect(switchPlan({ planIDs, planID, plans: MOCK_PLANS, organization })).toEqual({
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
        });
    });
});
