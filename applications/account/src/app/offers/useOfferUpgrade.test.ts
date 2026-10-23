import { renderHook } from '@testing-library/react';

import { useSubscriptionModalRaw } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import type { CtaUpgradeParams } from '@proton/offers-delivery/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { CYCLE, PLANS } from '@proton/shared/lib/payments/constants';

import { useOfferUpgrade } from './useOfferUpgrade';

jest.mock('@proton/components/containers/payments/subscription/subscriptionModalContext');

const mockUseSubscriptionModalRaw = jest.mocked(useSubscriptionModalRaw);

const upgradeParams = (overrides: Partial<CtaUpgradeParams> = {}): CtaUpgradeParams => ({
    plan: PLANS.MAIL,
    cycle: CYCLE.YEARLY,
    coupon: 'SUMMER',
    disableCycleSelector: true,
    disablePlanSelector: true,
    ...overrides,
});

describe('useOfferUpgrade', () => {
    const openSubscriptionModal = jest.fn();

    beforeEach(() => {
        openSubscriptionModal.mockReset();
        mockUseSubscriptionModalRaw.mockReturnValue(openSubscriptionModal);
    });

    const upgrade = (cta: CtaUpgradeParams | null) => {
        const { result } = renderHook(() => useOfferUpgrade());
        result.current(cta);
    };

    it('opens checkout with every cta param when a plan is set', () => {
        upgrade(upgradeParams());

        expect(openSubscriptionModal).toHaveBeenCalledWith({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            coupon: 'SUMMER',
            disableCycleSelector: true,
            disablePlanSelection: true,
        });
    });

    it('opens plan selection when the cta carries no plan', () => {
        upgrade(upgradeParams({ plan: undefined }));

        expect(openSubscriptionModal).toHaveBeenCalledWith({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: undefined,
            cycle: CYCLE.YEARLY,
            coupon: 'SUMMER',
            disableCycleSelector: true,
            disablePlanSelection: true,
        });
    });

    it('opens plan selection when the cta has no params', () => {
        upgrade(null);

        expect(openSubscriptionModal).toHaveBeenCalledWith({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: undefined,
            cycle: undefined,
            coupon: undefined,
            disableCycleSelector: undefined,
            disablePlanSelection: undefined,
        });
    });
});
