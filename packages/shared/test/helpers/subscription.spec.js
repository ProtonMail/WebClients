import { getPlanIDs, removeService, hasLifetime, switchPlan, clearPlanIDs } from '../../lib/helpers/subscription';
import { PLAN_SERVICES, PLANS, ADDON_NAMES } from '../../lib/constants';

const MOCK_PLANS = [
    {
        Name: PLANS.PLUS,
        ID: PLANS.PLUS,
        Services: PLAN_SERVICES.MAIL,
        MaxDomains: 1,
        MaxAddresses: 5,
        MaxSpace: 5368709120,
        MaxMembers: 1,
    },
    {
        Name: PLANS.PROFESSIONAL,
        ID: PLANS.PROFESSIONAL,
        Services: PLAN_SERVICES.MAIL,
        MaxDomains: 2,
        MaxAddresses: 10,
        MaxSpace: 5368709120,
        MaxMembers: 1,
    },
    {
        Name: PLANS.VISIONARY,
        ID: PLANS.VISIONARY,
        Services: PLAN_SERVICES.VPN + PLAN_SERVICES.MAIL,
        MaxDomains: 10,
        MaxAddresses: 50,
        MaxSpace: 21474836480,
        MaxMembers: 6,
        MaxVPN: 10,
    },
    { Name: PLANS.VPNBASIC, ID: PLANS.VPNBASIC, Services: PLAN_SERVICES.VPN, MaxVPN: 2 },
    { Name: PLANS.VPNPLUS, ID: PLANS.VPNPLUS, Services: PLAN_SERVICES.VPN, MaxVPN: 5 },
    { Name: ADDON_NAMES.ADDRESS, ID: ADDON_NAMES.ADDRESS, Services: PLAN_SERVICES.MAIL, MaxAddresses: 5 },
    { Name: ADDON_NAMES.DOMAIN, ID: ADDON_NAMES.DOMAIN, Services: PLAN_SERVICES.MAIL, MaxDomains: 1 },
    {
        Name: ADDON_NAMES.MEMBER,
        ID: ADDON_NAMES.MEMBER,
        Services: PLAN_SERVICES.MAIL,
        MaxMembers: 1,
        MaxSpace: 5368709120,
        MaxAddresses: 5,
    },
    { Name: ADDON_NAMES.SPACE, ID: ADDON_NAMES.SPACE, Services: PLAN_SERVICES.MAIL, MaxSpace: 1073741824 },
    { Name: ADDON_NAMES.VPN, ID: ADDON_NAMES.VPN, Services: PLAN_SERVICES.VPN, MaxVPN: 1 },
];

describe('getPlanIDs', () => {
    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                Plans: [
                    { ID: 'a', Quantity: 1 },
                    { ID: 'a', Quantity: 1 },
                    { ID: 'b', Quantity: 3 },
                ],
            })
        ).toEqual({
            a: 2,
            b: 3,
        });
    });
});

describe('removeService', () => {
    it('should remove visionary', () => {
        expect(removeService({ visionary: 1 }, MOCK_PLANS, PLAN_SERVICES.VPN)).toEqual({});
    });

    it('should keep mail', () => {
        expect(removeService({ plus: 1 }, MOCK_PLANS, PLAN_SERVICES.VPN)).toEqual({ plus: 1 });
    });

    it('should remove mail', () => {
        expect(removeService({ plus: 1 }, MOCK_PLANS, PLAN_SERVICES.MAIL)).toEqual({});
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'LIFETIME' })).toBe(true);
    });

    it('should not have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'PANDA' })).toBe(false);
    });
});

describe('clearPlanIDs', () => {
    it('should remove useless key', () => {
        const planIDs = {
            [PLANS.PROFESSIONAL]: 1,
            [PLANS.VPNPLUS]: 0,
            [ADDON_NAMES.VPN]: 3,
        };
        expect(clearPlanIDs(planIDs)).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [ADDON_NAMES.VPN]: 3,
        });
    });
});

describe('switchPlan', () => {
    it('should remove same service when switching plans', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const organization = {};
        expect(clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service, organization }))).toEqual({
            [PLANS.PROFESSIONAL]: 1,
        });
    });

    it('should add correct domain add-on', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const organization = {
            UsedDomains: 4,
        };
        expect(clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service, organization }))).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [ADDON_NAMES.DOMAIN]: 2,
        });
    });

    it('should add correct member add-on', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const organization = {
            UsedAddresses: 11,
        };
        expect(clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service, organization }))).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [ADDON_NAMES.MEMBER]: 1,
        });
    });
});
