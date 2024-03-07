import { RenderResult, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/components/containers/payments/TaxCountrySelector';
import * as paymentsDataUtilsModule from '@proton/components/payments/client-extensions/data-utils';
import { PAYMENT_TOKEN_STATUS, PaymentMethodStatus } from '@proton/components/payments/core';
import { CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import {
    addApiMock,
    applyHOCs,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withDeprecatedModals,
    withNotifications,
} from '@proton/testing';
import { buildUser } from '@proton/testing/builders';
import noop from '@proton/utils/noop';

import PaymentStep, { Props } from './PaymentStep';

let paymentMethodStatus: PaymentMethodStatus;
beforeEach(() => {
    jest.clearAllMocks();

    paymentMethodStatus = {
        Card: true,
        Paypal: true,
        Apple: true,
        Cash: true,
        Bitcoin: true,
    };

    addApiMock('payments/v4/status', () => paymentMethodStatus);
    addApiMock('payments/v5/status', () => paymentMethodStatus);
});

const PaymentStepContext = applyHOCs(
    withApi(),
    withConfig(),
    withDeprecatedModals(),
    withAuthentication(),
    withNotifications(),
    withCache()
)(PaymentStep);

jest.spyOn(paymentsDataUtilsModule, 'useCachedUser').mockReturnValue(buildUser());

let props: Props;

beforeEach(() => {
    const plans: Props['plans'] = [
        {
            ID: '1',
            ParentMetaPlanID: '',
            Type: PLAN_TYPES.PLAN,
            Cycle: CYCLE.MONTHLY,
            Name: PLANS.BUNDLE,
            Title: 'ProtonMail Plus',
            Currency: 'USD',
            Amount: 1099,
            MaxDomains: 10,
            MaxAddresses: 10,
            MaxSpace: 5368709120,
            MaxCalendars: 10,
            MaxMembers: 10,
            MaxVPN: 10,
            MaxTier: 3,
            Services: 1,
            Features: 1,
            Quantity: 1,
            Pricing: {
                [CYCLE.MONTHLY]: 1099,
                [CYCLE.YEARLY]: 1099 * 12,
                [CYCLE.TWO_YEARS]: 1099 * 24,
            },
            PeriodEnd: {
                '1': 1678452604,
                '12': 1707569404,
                '24': 1739191804,
            },
            State: 1,
            Offers: [],
        },
    ];

    props = {
        api: noop as any,
        subscriptionData: {
            currency: 'USD',
            cycle: CYCLE.MONTHLY,
            minimumCycle: CYCLE.MONTHLY,
            skipUpsell: false,
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            checkResult: {
                Amount: 1099,
                AmountDue: 1099,
                CouponDiscount: 0,
                Coupon: null,
                UnusedCredit: 0,
                Credit: 0,
                Currency: 'USD',
                Cycle: CYCLE.MONTHLY,
                Gift: 0,
                PeriodEnd: 1622505600,
            },
            payment: undefined,
            billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
        },
        plans,
        onPay: jest.fn(),
        onChangePlanIDs: jest.fn(),
        onChangeCurrency: jest.fn(),
        onChangeCycle: jest.fn(),
        plan: plans[0],
        planName: plans[0].Name,
        onChangeBillingAddress: jest.fn(),
    };
});

jest.mock('@proton/components/hooks/useElementRect');
it('should render', async () => {
    let container;
    await act(async () => {
        const rendered = render(<PaymentStepContext {...props} />);
        container = rendered.container;
    });
    expect(container).not.toBeEmptyDOMElement();
});

it('should call onPay with the new token', async () => {
    addApiMock('payments/v4/tokens', () => ({
        Token: 'token123',
        Code: 1000,
        Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
    }));

    let findByTestId!: RenderResult['findByTestId'];
    let findByText!: RenderResult['findByText'];
    await act(async () => {
        const rendered = render(<PaymentStepContext {...props} />);
        findByTestId = rendered.findByTestId;
        findByText = rendered.findByText;
    });

    const payButton = await findByText(/Pay /);

    expect(payButton).toBeDefined();
    expect(payButton).toHaveTextContent('Pay');

    const ccNumber = await findByTestId('ccnumber');
    const cvc = await findByTestId('cvc');
    const exp = await findByTestId('exp');
    const postalCode = await findByTestId('postalCode');

    await act(async () => {
        await userEvent.type(ccNumber, '4242424242424242');
        await userEvent.type(cvc, '123');
        await userEvent.type(exp, '1230'); // stands for 12/30, i.e. December 2030
        await userEvent.type(postalCode, '12345');

        await userEvent.click(payButton);
    });

    expect(props.onPay).toHaveBeenCalledWith(
        {
            Details: {
                Token: 'token123',
            },
            Type: 'token',
            paymentsVersion: 'v4',
        },
        'cc'
    );
});
