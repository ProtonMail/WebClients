import { ADDON_NAMES, CYCLE, PLANS, SelectedPlan } from '@proton/payments';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { PLANS_MAP } from '@proton/testing/data';

import { getAssistantUpsellConfigPlanAndCycle } from './assistantUpsellConfig';

const baseConfig: any = {
    planIDs: { [PLANS.MAIL_BUSINESS]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 1 },
};

const getUser = (diff: Partial<UserModel>) => {
    return {
        isSelf: true,
        accessType: AccessType.Self,
        ...diff,
    } as UserModel;
};

describe('getAssistantUpsellConfig', () => {
    it('should return undefined if the user is a sub user', () => {
        const user = getUser({
            isSelf: false,
            accessType: AccessType.AdminAccess,
        });
        const selectedPlan = new SelectedPlan({}, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        const config = getAssistantUpsellConfigPlanAndCycle(user, false, selectedPlan);

        expect(config).toEqual(undefined);
    });

    it('should return paid config with yearly and monthly cycles if the user is paid with monthly billing', () => {
        const user = getUser({
            isPaid: true,
        });
        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_BUSINESS]: 1 }, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const config = getAssistantUpsellConfigPlanAndCycle(user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.MONTHLY,
        });
    });

    it('should return paid config with only yearly cycle if the user is paid with yearly billing', () => {
        const user = getUser({
            isPaid: true,
        });
        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_BUSINESS]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'EUR');

        const config = getAssistantUpsellConfigPlanAndCycle(user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.YEARLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.YEARLY,
        });
    });

    it('should return paid config with only two years if the user is paid with two years billing', () => {
        const user = getUser({
            isPaid: true,
        });

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_BUSINESS]: 1 }, PLANS_MAP, CYCLE.TWO_YEARS, 'EUR');

        const config = getAssistantUpsellConfigPlanAndCycle(user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.TWO_YEARS,
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with max members if the user has member but no MaxAI', () => {
        const user = getUser({
            isPaid: true,
        });

        const selectedPlan = new SelectedPlan(
            {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 4,
            },
            PLANS_MAP,
            CYCLE.TWO_YEARS,
            'EUR'
        );

        const config = getAssistantUpsellConfigPlanAndCycle(user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 5 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with max AI if the user has member and MaxAI', () => {
        const user = getUser({
            isPaid: true,
        });

        const selectedPlan = new SelectedPlan(
            {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 4,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
            },
            PLANS_MAP,
            CYCLE.TWO_YEARS,
            'EUR'
        );

        const config = getAssistantUpsellConfigPlanAndCycle(user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with all existing if the user has member and MaxAI', () => {
        const user = getUser({
            isPaid: true,
        });

        const selectedPlan = new SelectedPlan(
            {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 2,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 4,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
            },
            PLANS_MAP,
            CYCLE.TWO_YEARS,
            'EUR'
        );

        const config = getAssistantUpsellConfigPlanAndCycle(user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.TWO_YEARS,
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 4,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 2,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
            },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });
});
