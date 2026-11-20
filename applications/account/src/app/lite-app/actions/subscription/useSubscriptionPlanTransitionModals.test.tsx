import { act, renderHook } from '@testing-library/react';

import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import useSubscriptionPlanTransitionModals from './useSubscriptionPlanTransitionModals';

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account-lite' }) }));

const webMailPlus = buildSubscription(
    { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
    { ID: 'mail-plus' }
);
const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' });

const initializeTransition = async (
    subscription: Subscription,
    multiSubscriptionContext: MultiSubscriptionContext,
    planIDs: PlanIDs
) => {
    const { result } = renderHook(() =>
        useSubscriptionPlanTransitionModals({
            subscription,
            multiSubscriptionContext,
            planIDs,
            cycle: CYCLE.MONTHLY,
            currency: 'CHF',
            plansMap: getTestPlansMap('CHF'),
            onPlusUpgrade: vi.fn(),
        })
    );

    let transition: Awaited<ReturnType<typeof result.current.initializePlanTransition>> | undefined;
    await act(async () => {
        transition = await result.current.initializePlanTransition();
    });

    return transition;
};

describe('useSubscriptionPlanTransitionModals', () => {
    it('keeps a Lumo Plus selection on the Lumo Plus subscription it changes', async () => {
        const transition = await initializeTransition(
            { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] },
            buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
            { [PLANS.LUMO]: 1 }
        );

        expect(transition).toEqual({ proceed: true, planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.MONTHLY });
    });

    it('stops a Pass Plus selection with the plus-to-plus upsell when it replaces the web Mail Plus next to an iOS Lumo Plus', async () => {
        const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, {
            ID: 'ios-lumo-plus',
            Cycle: CYCLE.MONTHLY,
            Currency: 'CHF',
            External: SubscriptionPlatform.iOS,
        });

        const transition = await initializeTransition(
            { ...iosLumoPlus, SecondarySubscriptions: [webMailPlus] },
            buildMultiSubscriptionContext([iosLumoPlus, webMailPlus], false),
            { [PLANS.PASS]: 1 }
        );

        expect(transition).toEqual({ proceed: false });
    });

    it('moves a Lumo Plus selection to the Lumo add-on of the subscription it changes, at that cycle', async () => {
        const twoYearDrivePlus = buildSubscription(
            { planName: PLANS.DRIVE, cycle: CYCLE.TWO_YEARS, currency: 'CHF' },
            { ID: 'drive-plus' }
        );
        const monthlyMailPlusWithLumo = buildSubscription(
            { planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 }, cycle: CYCLE.MONTHLY, currency: 'CHF' },
            { ID: 'mail-plus-with-lumo' }
        );

        const transition = await initializeTransition(
            { ...twoYearDrivePlus, SecondarySubscriptions: [monthlyMailPlusWithLumo] },
            buildMultiSubscriptionContext([twoYearDrivePlus, monthlyMailPlusWithLumo]),
            { [PLANS.LUMO]: 1 }
        );

        expect(transition).toEqual({
            proceed: true,
            planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
            cycle: CYCLE.MONTHLY,
        });
    });

    it('moves a Lumo Plus selection to the Lumo add-on of the only Mail Plus subscription, as before', async () => {
        const transition = await initializeTransition(
            webMailPlus,
            buildMultiSubscriptionContextFromSubscription(webMailPlus),
            {
                [PLANS.LUMO]: 1,
            }
        );

        expect(transition).toEqual({
            proceed: true,
            planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
            cycle: CYCLE.YEARLY,
        });
    });
});
