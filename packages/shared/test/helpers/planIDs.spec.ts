import { removeService, switchPlan, clearPlanIDs } from '../../lib/helpers/planIDs';
import { PLAN_SERVICES, PLANS, ADDON_NAMES } from '../../lib/constants';
import { Organization, Plan } from '../../lib/interfaces';

const MOCK_PLANS = [
    {
        Name: PLANS.PLUS,
        ID: PLANS.PLUS,
        Services: PLAN_SERVICES.MAIL,
        MaxDomains: 1,
        MaxAddresses: 5,
        MaxSpace: 5368709120,
        MaxMembers: 1,
        MaxVPN: 0,
    },
    {
        Name: PLANS.PROFESSIONAL,
        ID: PLANS.PROFESSIONAL,
        Services: PLAN_SERVICES.MAIL,
        MaxDomains: 2,
        MaxAddresses: 10,
        MaxSpace: 5368709120,
        MaxMembers: 1,
        MaxVPN: 0,
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
] as Plan[];

describe('removeService', () => {
    it('should remove visionary', () => {
        expect(clearPlanIDs(removeService({ visionary: 1 }, MOCK_PLANS, PLAN_SERVICES.VPN))).toEqual({});
    });

    it('should keep mail', () => {
        expect(clearPlanIDs(removeService({ plus: 1 }, MOCK_PLANS, PLAN_SERVICES.VPN))).toEqual({ plus: 1 });
    });

    it('should remove mail', () => {
        expect(clearPlanIDs(removeService({ plus: 1 }, MOCK_PLANS, PLAN_SERVICES.MAIL))).toEqual({});
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
        expect(clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service }))).toEqual({
            [PLANS.PROFESSIONAL]: 1,
        });
    });

    it('should remove Visionary plan', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = undefined;
        const service = PLAN_SERVICES.MAIL;
        expect(clearPlanIDs(switchPlan({ planIDs, planID, plans: MOCK_PLANS, service }))).toEqual({});
    });

    it('should add correct domain add-on', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const organization = {
            UsedDomains: 4,
        } as Organization;
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
        } as Organization;
        expect(clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service, organization }))).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [ADDON_NAMES.MEMBER]: 1,
        });
    });

    it('should convert active VPN connections when switching from Visionary to Professional', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const organization = {
            UsedVPN: 11,
        } as Organization;
        const result = clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service, organization }));
        expect(result).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [PLANS.VPNPLUS]: 1,
            [ADDON_NAMES.VPN]: 6,
        });
    });

    it('should keep ProtonVPN Plus if already selected when selecting ProtonMail Professional', () => {
        const planIDs = { [PLANS.VPNPLUS]: 1 };
        const planID = PLANS.PROFESSIONAL;
        const service = PLAN_SERVICES.MAIL;
        const result = clearPlanIDs(switchPlan({ planIDs, plans: MOCK_PLANS, planID, service }));
        expect(result).toEqual({
            [PLANS.PROFESSIONAL]: 1,
            [PLANS.VPNPLUS]: 1,
        });
    });
});
