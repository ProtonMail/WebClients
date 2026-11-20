import { render, waitFor } from '@testing-library/react';

import { useMultiSubscriptionContext } from '@proton/payments-hooks/react-extensions/useMultiSubscriptionContext';
import { usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import type { Model } from '@proton/payments-ui/containers/payments/subscription/SubscriptionContainer';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { buildMultiSubscriptionContextFromSubscription } from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';

import SubscriptionCheckout from './SubscriptionCheckout';

vi.mock('@proton/account/appName', () => ({ useAppName: () => 'proton-account-lite' }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account-lite' }) }));
vi.mock('@proton/app-context/useSilentApi', () => ({ useSilentApi: () => vi.fn() }));
vi.mock('@proton/payments-hooks/react-extensions/useMultiSubscriptionContext', () => ({
    useMultiSubscriptionContext: vi.fn(),
}));
vi.mock('@proton/payments-hooks/ui/context/paymentsContext', () => ({ usePayments: vi.fn() }));
vi.mock('@proton/payments-ui/ui/context/PaymentContext', () => ({
    PaymentsContextProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@proton/components/containers/payments/subscription/CalendarDowngradeModal', () => ({
    __esModule: true,
    default: () => null,
}));
vi.mock('./useSubscriptionCheckout', () => ({
    __esModule: true,
    default: () => ({
        shouldDisableCurrencySelection: false,
        availableCurrencies: [],
        paymentFacade: { methods: { savedMethods: [] } },
        subscribing: false,
        calendarDowngradeModal: () => null,
        cancelSubscriptionModals: null,
    }),
}));
vi.mock('./sections/SubscriptionCheckoutPlanSection', () => ({ __esModule: true, default: () => null }));
vi.mock('./sections/SubscriptionCheckoutBillingCycleSection', () => ({ __esModule: true, default: () => null }));
vi.mock('./sections/SubscriptionCheckoutAddonSection', () => ({ __esModule: true, default: () => null }));
vi.mock('./sections/SubscriptionCheckoutPaymentSection', () => ({ __esModule: true, default: () => null }));

type PaymentsValue = ReturnType<typeof usePayments>;

describe('SubscriptionCheckout', () => {
    it('checks the Lumo add-on of the Mail Plus subscription at its cycle when a Mail Plus user opens a Lumo Plus link', async () => {
        const yearlyMailPlus = buildSubscription(
            { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { ID: 'mail-plus' }
        );
        const initialize = vi.fn().mockResolvedValue(undefined);
        vi.mocked(usePayments).mockReturnValue({
            initialize,
            plansMap: getTestPlansMap('CHF'),
            selectNewPlan: vi.fn(),
        } as unknown as PaymentsValue);
        vi.mocked(useMultiSubscriptionContext).mockReturnValue(
            buildMultiSubscriptionContextFromSubscription(yearlyMailPlus)
        );
        const checkoutModel = {
            planIDs: { [PLANS.LUMO]: 1 },
            cycle: CYCLE.MONTHLY,
            currency: 'CHF',
        } as Model;

        render(
            <SubscriptionCheckout
                onStepChange={vi.fn()}
                checkoutModel={checkoutModel}
                onSubscribed={vi.fn()}
                onUnsubscribed={vi.fn()}
                onClose={vi.fn()}
                subscription={yearlyMailPlus}
                disablePlanSelection={false}
            />
        );

        await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
        expect(initialize.mock.calls[0][0].planToCheck).toEqual({
            coupon: undefined,
            cycle: CYCLE.YEARLY,
            planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
        });
    });
});
