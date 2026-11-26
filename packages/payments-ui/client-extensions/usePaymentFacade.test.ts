import { act, renderHook, waitFor } from '@testing-library/react';

import { componentWrapper } from '@proton/components/testing/hocs/helpers';
import { withApi } from '@proton/components/testing/with-api';
import { withAuthentication } from '@proton/components/testing/with-authentication';
import { withConfig } from '@proton/components/testing/with-config';
import { withDeprecatedModals } from '@proton/components/testing/with-deprecated-modals';
import { withNotifications } from '@proton/components/testing/with-notifications';
import { withReduxStore } from '@proton/components/testing/with-redux-store';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { MOCK_PAYMENT_STATUS, mockPaymentMethods, mockPaymentStatus } from '@proton/payments/testing/api-endpoints';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { usePaymentFacade } from './usePaymentFacade';

vi.mock('@proton/unleash/useFlag');

it('selects the processor of each offered new method', async () => {
    const enabledFlags = ['SepaPayments', 'SepaPaymentsB2C', 'EnableIdeal'];
    vi.mocked(useFlag).mockImplementation((flag) => enabledFlags.includes(flag));
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
});
