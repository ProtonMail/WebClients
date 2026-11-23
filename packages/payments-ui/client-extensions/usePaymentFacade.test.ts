import { act, renderHook, waitFor } from '@testing-library/react';

import { componentWrapper } from '@proton/components/testing/hocs/helpers';
import { withApi } from '@proton/components/testing/vitest/with-api';
import { withDeprecatedModals } from '@proton/components/testing/vitest/with-deprecated-modals';
import { withReduxStore } from '@proton/components/testing/vitest/with-redux-store';
import { withAuthentication } from '@proton/components/testing/with-authentication';
import { withConfig } from '@proton/components/testing/with-config';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import {
    MOCK_PAYMENT_STATUS,
    mockPaymentMethods,
    mockPaymentStatus,
} from '@proton/payments/testing/vitest/api-endpoints';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { usePaymentFacade } from './usePaymentFacade';

vi.mock('@proton/unleash/useFlag');

it.each([false, true])(
    'selects the processor of each offered new method when PaymentProcessorsRefactor is %s',
    async (refactoredProcessors) => {
        const enabledFlags = ['SepaPayments', 'SepaPaymentsB2C', 'EnableIdeal'];
        vi.mocked(useFlag).mockImplementation((flag) =>
            flag === 'PaymentProcessorsRefactor' ? refactoredProcessors : enabledFlags.includes(flag)
        );
        mockPaymentStatus();
        mockPaymentMethods().noSaved();

        const { result } = renderHook(
            () =>
                usePaymentFacade({
                    amount: 5000,
                    currency: 'EUR',
                    flow: 'subscription',
                    onChargeable: vi.fn(),
                    paymentStatus: { ...MOCK_PAYMENT_STATUS, CountryCode: 'NL' },
                    billingAddress: { CountryCode: 'NL' },
                    product: APPS.PROTONACCOUNT,
                    telemetryContext: 'other',
                }),
            {
                wrapper: componentWrapper(
                    withConfig(),
                    withReduxStore(),
                    withNotifications(),
                    withApi(),
                    withDeprecatedModals(),
                    withAuthentication()
                ),
            }
        );

        await waitFor(() => expect(result.current.methods.loading).toBe(false));

        const processorTypeByMethod = Object.fromEntries(
            result.current.methods.newMethods.map(({ type }) => {
                act(() => {
                    result.current.methods.selectMethod(type);
                });
                return [type, result.current.selectedProcessor?.meta.type];
            })
        );

        expect(processorTypeByMethod).toStrictEqual({
            [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: 'chargebee-card',
            [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: 'chargebee-paypal',
            [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
            [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
            [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: 'chargebee-bitcoin',
            [PAYMENT_METHOD_TYPES.CASH]: undefined,
        });
    }
);
