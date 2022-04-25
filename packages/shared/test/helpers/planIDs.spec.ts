import { clearPlanIDs, getHasPlanType, hasPlanIDs, setQuantity, switchPlan } from '../../lib/helpers/planIDs';
import { ADDON_NAMES, PLAN_SERVICES, PLANS } from '../../lib/constants';
import { Plan } from '../../lib/interfaces';

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
    { Name: PLANS.VPNPLUS, ID: PLANS.VPNPLUS, Services: PLAN_SERVICES.VPN, MaxVPN: 10 },
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

describe('hasPlanType', () => {
    it('should return true if plan type is set', () => {
        expect(getHasPlanType({ [PLANS.PROFESSIONAL]: 1 }, MOCK_PLANS, PLANS.PROFESSIONAL)).toBeTrue();
        expect(getHasPlanType({ [PLANS.PLUS]: 1, [PLANS.PROFESSIONAL]: 1 }, MOCK_PLANS, PLANS.PROFESSIONAL)).toBeTrue();
        expect(
            getHasPlanType(
                { [PLANS.VISIONARY]: 1, [PLANS.PLUS]: 1, [PLANS.PROFESSIONAL]: 1 },
                MOCK_PLANS,
                PLANS.VISIONARY
            )
        ).toBeTrue();
    });
    it('should not return true if plan type is not set', () => {
        expect(getHasPlanType({ [PLANS.PROFESSIONAL]: 0 }, MOCK_PLANS, PLANS.PROFESSIONAL)).toBeFalse();
        expect(getHasPlanType({ [PLANS.PLUS]: 1 }, MOCK_PLANS, PLANS.PROFESSIONAL)).toBeFalse();
        expect(getHasPlanType({ [PLANS.PLUS]: 1, [PLANS.PROFESSIONAL]: 1 }, MOCK_PLANS, PLANS.VISIONARY)).toBeFalse();
    });
});

describe('hasPlanIDs', () => {
    it('should return true if plan IDs are set', () => {
        expect(
            hasPlanIDs({
                [PLANS.PROFESSIONAL]: 1,
                [PLANS.VPNPLUS]: 0,
                [ADDON_NAMES.VPN]: 3,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.PROFESSIONAL]: 1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.PROFESSIONAL]: 1,
            })
        ).toBeTrue();

        expect(
            hasPlanIDs({
                [PLANS.PROFESSIONAL]: 1,
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
                [PLANS.PROFESSIONAL]: 0,
            })
        ).toBeFalse();
        expect(
            hasPlanIDs({
                [PLANS.PROFESSIONAL]: -1,
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
                    [PLANS.PROFESSIONAL]: 1,
                },
                PLANS.PROFESSIONAL,
                0
            )
        ).toEqual({});
        expect(
            setQuantity(
                {
                    [PLANS.PROFESSIONAL]: 1,
                    [ADDON_NAMES.ADDRESS]: 1,
                },
                ADDON_NAMES.ADDRESS,
                0
            )
        ).toEqual({
            [PLANS.PROFESSIONAL]: 1,
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
    it('should remove previous plan', () => {
        const planIDs = { [PLANS.VISIONARY]: 1 };
        const planID = PLANS.NEW_VISIONARY;
        expect(switchPlan({ planIDs, planID })).toEqual({
            [PLANS.NEW_VISIONARY]: 1,
        });
    });

    it('should transfer addons', () => {
        const planIDs = { [PLANS.PROFESSIONAL]: 1, [ADDON_NAMES.DOMAIN]: 5 };
        const planID = PLANS.BUNDLE_PRO;
        expect(switchPlan({ planIDs, planID })).toEqual({
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 5,
        });
    });

    it('should transfer member addons', () => {
        const planIDs = { [PLANS.PROFESSIONAL]: 1, [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5 };
        const planID = PLANS.BUNDLE_PRO;
        expect(switchPlan({ planIDs, planID })).toEqual({
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5,
        });
    });

    it('should not transfer addons', () => {
        const planIDs = { [PLANS.PROFESSIONAL]: 1, [ADDON_NAMES.DOMAIN]: 5 };
        const planID = PLANS.MAIL;
        expect(switchPlan({ planIDs, planID })).toEqual({
            [PLANS.MAIL]: 1,
        });
    });
});
