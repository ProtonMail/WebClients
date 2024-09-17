import { SelectedPlan } from '@proton/payments';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { PLANS_MAP } from '@proton/testing/data';

import { SUBSCRIPTION_STEPS } from '../..';
import { getAssistantUpsellConfig } from './assistantUpsellConfig';

const baseConfig: any = {
    mode: 'upsell-modal',
    planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS]: 1 },
    step: SUBSCRIPTION_STEPS.CHECKOUT,
    disablePlanSelection: true,
    upsellRef: 'upsellRef',
    metrics: {
        source: 'upsells',
    },
};

describe('getAssistantUpsellConfig', () => {
    it('should return undefined if the user is a sub user', () => {
        const user = {
            isSubUser: true,
        } as unknown as UserModel;
        const selectedPlan = new SelectedPlan({}, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual(undefined);
    });

    it('should return free user config if the user is free without a subscription', () => {
        const user = {
            isPaid: false,
        } as unknown as UserModel;
        const selectedPlan = new SelectedPlan({}, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.MONTHLY,
        });
    });

    it('should return paid config with yearly and monthly cycles if the user is paid with monthly billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const selectedPlan = new SelectedPlan({ [PLANS.MAIL]: 1 }, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.MONTHLY,
        });
    });

    it('should return paid config with only yearly cycle if the user is paid with yearly billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const selectedPlan = new SelectedPlan({ [PLANS.MAIL]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'EUR');

        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.YEARLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.YEARLY,
        });
    });

    it('should return paid config with only two years if the user is paid with two years billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL]: 1 }, PLANS_MAP, CYCLE.TWO_YEARS, 'EUR');

        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    // TODO this will probably not be right
    it('should return paid config if the user is paid with family plan', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;

        const selectedPlan = new SelectedPlan(
            {
                [PLANS.FAMILY]: 1,
            },
            PLANS_MAP,
            CYCLE.TWO_YEARS,
            'EUR'
        );

        const config = getAssistantUpsellConfig('upsellRef', user, false, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.FAMILY]: 1, [ADDON_NAMES.MEMBER_SCRIBE_FAMILY]: 1 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with max members if the user has member but no MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;

        const selectedPlan = new SelectedPlan(
            {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 4,
            },
            PLANS_MAP,
            CYCLE.TWO_YEARS,
            'EUR'
        );

        const config = getAssistantUpsellConfig('upsellRef', user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 5 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with max AI if the user has member and MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;

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

        const config = getAssistantUpsellConfig('upsellRef', user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
        });
    });

    it('should return multi config with all existing if the user has member and MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;

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

        const config = getAssistantUpsellConfig('upsellRef', user, true, selectedPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
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
