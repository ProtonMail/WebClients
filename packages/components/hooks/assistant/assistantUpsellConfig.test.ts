import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import {
    OrganizationWithSettings,
    SubscriptionModel,
    SubscriptionPlan,
    UserModel,
} from '@proton/shared/lib/interfaces';

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
        const currentPlan = undefined;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual(undefined);
    });

    it('should return free user config if the user is free without a subscription', () => {
        const user = {
            isPaid: false,
        } as unknown as UserModel;
        const currentPlan = undefined;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual({
            ...baseConfig,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.MONTHLY,
            withB2CAddons: true,
        });
    });

    it('should return paid config with yearly and monthly cycles if the user is paid with monthly billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL,
            Cycle: CYCLE.MONTHLY,
        } as unknown as SubscriptionPlan;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.MONTHLY,
            withB2CAddons: true,
        });
    });

    it('should return paid config with only yearly cycle if the user is paid with yearly billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL,
            Cycle: CYCLE.YEARLY,
        } as unknown as SubscriptionPlan;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.YEARLY,
            maximumCycle: CYCLE.YEARLY,
            minimumCycle: CYCLE.YEARLY,
            withB2CAddons: true,
        });
    });

    it('should return paid config with only two years if the user is paid with two years billing', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL,
            Cycle: CYCLE.TWO_YEARS,
        } as unknown as SubscriptionPlan;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
            withB2CAddons: true,
        });
    });

    // TODO this will probably not be right
    it('should return paid config if the user is paid with family plan', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.FAMILY,
            Cycle: CYCLE.TWO_YEARS,
        } as unknown as SubscriptionPlan;
        const config = getAssistantUpsellConfig('upsellRef', user, false, currentPlan);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.FAMILY]: 1, [ADDON_NAMES.MEMBER_SCRIBE_FAMILY]: 1 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
            withB2CAddons: true,
        });
    });

    it('should return multi config with max members if the user has member but no MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL_PRO,
            Cycle: CYCLE.TWO_YEARS,
        } as unknown as SubscriptionPlan;
        const subscription = {
            Plans: [
                { Name: PLANS.MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
            ],
        } as unknown as SubscriptionModel;
        const organization = {
            MaxMembers: 4,
            MaxAI: 0,
        } as unknown as OrganizationWithSettings;
        const config = getAssistantUpsellConfig('upsellRef', user, true, currentPlan, subscription, organization);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 4 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
            withB2CAddons: true,
        });
    });

    it('should return multi config with max AI if the user has member and MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL_PRO,
            Cycle: CYCLE.TWO_YEARS,
        } as unknown as SubscriptionPlan;
        const subscription = {
            Plans: [
                { Name: PLANS.MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, Quantity: 1 },
            ],
        } as unknown as SubscriptionModel;
        const organization = {
            MaxMembers: 4,
            MaxAI: 2,
        } as unknown as OrganizationWithSettings;
        const config = getAssistantUpsellConfig('upsellRef', user, true, currentPlan, subscription, organization);

        expect(config).toEqual({
            ...baseConfig,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 4, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2 },
            maximumCycle: CYCLE.TWO_YEARS,
            minimumCycle: CYCLE.TWO_YEARS,
            withB2CAddons: true,
        });
    });

    it('should return multi config with all existing if the user has member and MaxAI', () => {
        const user = {
            isPaid: true,
        } as unknown as UserModel;
        const currentPlan = {
            Name: PLANS.MAIL_PRO,
            Cycle: CYCLE.TWO_YEARS,
        } as unknown as SubscriptionPlan;
        const subscription = {
            Plans: [
                { Name: PLANS.MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.IP_VPN_BUSINESS, Quantity: 1 },
                { Name: ADDON_NAMES.IP_VPN_BUSINESS, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, Quantity: 1 },
                { Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, Quantity: 1 },
            ],
        } as unknown as SubscriptionModel;
        const organization = {
            MaxMembers: 4,
            MaxAI: 2,
        } as unknown as OrganizationWithSettings;
        const config = getAssistantUpsellConfig('upsellRef', user, true, currentPlan, subscription, organization);

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
            withB2CAddons: true,
        });
    });
});
