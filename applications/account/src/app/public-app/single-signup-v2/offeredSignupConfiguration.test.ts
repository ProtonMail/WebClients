import { PLANS } from '@proton/payments/core/constants';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import type { PlanCard, SignupConfiguration } from './interface';
import { getOfferedSignupConfiguration } from './offeredSignupConfiguration';

const card = (plan: PLANS): PlanCard => ({ plan, subsection: null, type: 'standard', guarantee: false });

const nonInteractiveCard: PlanCard = { subsection: null, type: 'standard', guarantee: false, interactive: false };

const audiences = [
    { value: Audience.B2C, locationDescriptor: '/drive/signup', title: 'For individuals', defaultPlan: PLANS.BUNDLE },
    {
        value: Audience.B2B,
        locationDescriptor: '/drive/signup/business',
        title: 'For businesses',
        defaultPlan: PLANS.DRIVE_BUSINESS,
    },
];

const getDriveConfiguration = (audience: Audience.B2C | Audience.B2B) =>
    ({
        audience,
        audiences,
        planCards: {
            [Audience.B2C]: [card(PLANS.FREE), card(PLANS.DRIVE), card(PLANS.BUNDLE), card(PLANS.FAMILY)],
            [Audience.B2B]: [card(PLANS.DRIVE_BUSINESS), card(PLANS.BUNDLE_PRO_2024), nonInteractiveCard],
        },
    }) as SignupConfiguration;

const getPlanNames = (planCards: PlanCard[]) => planCards.map((planCard) => planCard.plan);

const mailPlusAndLumoPlus = buildMultiSubscriptionContext([
    buildSubscription(PLANS.MAIL),
    buildLumoSubscription(PLANS.LUMO),
]);

describe('getOfferedSignupConfiguration', () => {
    it('keeps every card for a visitor without session', () => {
        const configuration = getDriveConfiguration(Audience.B2C);

        expect(getOfferedSignupConfiguration(configuration, undefined)).toBe(configuration);
    });

    it('keeps every card for a user without subscription', () => {
        const offered = getOfferedSignupConfiguration(
            getDriveConfiguration(Audience.B2C),
            buildMultiSubscriptionContext([])
        );

        expect(getPlanNames(offered.planCards[Audience.B2C])).toEqual([
            PLANS.FREE,
            PLANS.DRIVE,
            PLANS.BUNDLE,
            PLANS.FAMILY,
        ]);
        expect(getPlanNames(offered.planCards[Audience.B2B])).toEqual([
            PLANS.DRIVE_BUSINESS,
            PLANS.BUNDLE_PRO_2024,
            undefined,
        ]);
        expect(offered.audiences?.map(({ value }) => value)).toEqual([Audience.B2C, Audience.B2B]);
    });

    it('hides the plans refused next to Mail Plus and Lumo Plus, and keeps Free and Unlimited', () => {
        const offered = getOfferedSignupConfiguration(getDriveConfiguration(Audience.B2C), mailPlusAndLumoPlus);

        expect(getPlanNames(offered.planCards[Audience.B2C])).toEqual([PLANS.FREE, PLANS.BUNDLE]);
        expect(getPlanNames(offered.planCards[Audience.B2B])).toEqual([undefined]);
    });

    it('hides the business tab when none of its plans is offered', () => {
        const offered = getOfferedSignupConfiguration(getDriveConfiguration(Audience.B2C), mailPlusAndLumoPlus);

        expect(offered.audiences?.map(({ value }) => value)).toEqual([Audience.B2C]);
    });

    it('keeps the tab of the page the user is on, even without an offered plan', () => {
        const offered = getOfferedSignupConfiguration(getDriveConfiguration(Audience.B2B), mailPlusAndLumoPlus);

        expect(offered.audiences?.map(({ value }) => value)).toEqual([Audience.B2C, Audience.B2B]);
    });

    it('offers Drive Plus and Family next to a single web Mail Plus subscription, which they replace', () => {
        const offered = getOfferedSignupConfiguration(
            getDriveConfiguration(Audience.B2C),
            buildMultiSubscriptionContext([buildSubscription(PLANS.MAIL)])
        );

        expect(getPlanNames(offered.planCards[Audience.B2C])).toEqual([
            PLANS.FREE,
            PLANS.DRIVE,
            PLANS.BUNDLE,
            PLANS.FAMILY,
        ]);
    });
});
