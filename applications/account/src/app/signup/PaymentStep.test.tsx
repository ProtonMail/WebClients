import { act, render } from '@testing-library/react';

import type { PaymentMethodStatus } from '@proton/payments';
import { CYCLE, DEFAULT_TAX_BILLING_ADDRESS, PLANS, PLAN_TYPES } from '@proton/payments';
import { SubscriptionMode } from '@proton/shared/lib/interfaces';
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

import type { Props } from './PaymentStep';
import PaymentStep from './PaymentStep';

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

jest.mock('@proton/components/payments/client-extensions/data-utils', () => ({
    __esModule: true,
    useCachedUser: jest.fn().mockReturnValue(buildUser()),
}));

jest.mock('@proton/components/payments/client-extensions/useChargebeeKillSwitch', () => ({
    useChargebeeKillSwitch: jest.fn().mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) }),
}));

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
                SubscriptionMode: SubscriptionMode.Regular,
            },
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
        currencySignupParam: undefined,
        paymentStatus: {
            CountryCode: DEFAULT_TAX_BILLING_ADDRESS.CountryCode,
            State: DEFAULT_TAX_BILLING_ADDRESS.State,
            VendorStates: {
                Card: true,
                Paypal: true,
                Apple: true,
                Cash: true,
                Bitcoin: true,
            },
        },
    };

    window.ResizeObserver =
        window.ResizeObserver ||
        jest.fn().mockImplementation(() => ({
            disconnect: jest.fn(),
            observe: jest.fn(),
            unobserve: jest.fn(),
        }));
});

jest.mock('@proton/components/hooks/useElementRect');
jest.mock('@proton/account/plans/hooks', () => ({
    __esModule: true,
    useGetPlans: jest.fn(),
}));

jest.mock('@proton/account/paymentStatus/hooks', () => ({
    __esModule: true,
    usePaymentStatus: jest.fn(),
    useGetPaymentStatus: jest.fn().mockReturnValue(() => ({
        CountryCode: 'US',
        State: 'CA',
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
        },
    })),
}));

it('should render', async () => {
    let container;
    await act(async () => {
        const rendered = render(<PaymentStepContext {...props} />);
        container = rendered.container;
    });
    expect(container).not.toBeEmptyDOMElement();
});
