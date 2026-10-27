import { screen, waitFor } from '@testing-library/react';

import { withPaymentContext } from '@proton/payments-ui/testing/with-payment-context';
import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock } from '@proton/test-api/api';
import type { FeatureFlag } from '@proton/unleash/Flags';

import type { SubscriptionContainerProps } from '../containers/payments/subscription/SubscriptionContainer';
import SubscriptionContainer from '../containers/payments/subscription/SubscriptionContainer';
import { applyHOCs } from './hocs/helpers';
import { renderWithProviders } from './renderWithProviders';
import { withDeprecatedModals } from './with-deprecated-modals';
import { withReduxStore } from './with-redux-store';

export const ContextSubscriptionContainer = applyHOCs(
    withReduxStore({
        user: buildUser(),
    }),
    withDeprecatedModals(),
    withPaymentContext()
)(SubscriptionContainer);

export function enableSepaFeatureFlag() {
    const sepaFlag: FeatureFlag = 'SepaPayments';

    const useFlagMock = jest.spyOn(require('@proton/unleash/useFlag'), 'useFlag');
    useFlagMock.mockImplementation((flag) => flag === sepaFlag);
}

export function mockCheckResult(checkData: Record<string, unknown> = {}) {
    addApiMock(
        'payments/v5/subscription/check',
        ({ data }: { data: CheckSubscriptionData }) => {
            const result = getOptimisticCheckResult({
                planIDs: data.Plans,
                cycle: data.Cycle,
                currency: data.Currency,
                plansMap: getPlansMap(getLongTestPlans(), data.Currency, false),
            });

            return {
                ...result,
                // getOptimisticCheckResult sets AmountDue to 0 for tax-exclusive mode;
                // tests need a non-zero AmountDue so that payment method selectors render.
                AmountDue: result.Amount,
                ...checkData,
            };
        },
        'post'
    );
}

export async function initializeCheckout(props: SubscriptionContainerProps) {
    mockCheckResult();
    enableSepaFeatureFlag();

    const utils = renderWithProviders(<ContextSubscriptionContainer {...props} />);

    await waitFor(() => {
        expect(screen.getByTestId('subscription-amout-due')).toBeInTheDocument();
    });

    return utils;
}
