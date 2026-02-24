import { fireEvent, screen, waitFor } from '@testing-library/react';

import {
    defaultSubscriptionCache,
    mockUserVPNServersCountApi,
    organizationDefaultResponse,
    plansDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import {
    type CheckSubscriptionData,
    type Currency,
    FREE_PLAN,
    PAYMENT_METHOD_TYPES,
    PLANS,
    type Plan,
    getPlansMap,
} from '@proton/payments';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Organization } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import {
    addApiMock,
    apiMock,
    applyHOCs,
    renderWithProviders,
    withDeprecatedModals,
    withPaymentContext,
    withReduxStore,
} from '@proton/testing';
import { buildUser } from '@proton/testing/builders';
import { getLongTestPlans } from '@proton/testing/data';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

import type { SubscriptionContainerProps } from './SubscriptionContainer';
import SubscriptionContainer from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';

jest.mock('@proton/components/components/portal/Portal', () => ({
    __esModule: true,
    default: jest.fn(({ children }) => <>{children}</>),
    useUser: jest.fn(() => [{}]),
    useGetUser: jest.fn(() => ({})),
}));

jest.mock('@proton/components/hooks/assistant/useAssistantFeatureEnabled', () => ({
    __esModule: true,
    default: jest.fn(() => ({ paymentsEnabled: false, enabled: false })),
}));

const ContextSubscriptionContainer = applyHOCs(
    withReduxStore({
        user: buildUser(),
    }),
    withDeprecatedModals(),
    withPaymentContext()
)(SubscriptionContainer);

function mockCheckResult(checkData: Partial<SubscriptionEstimation> = {}) {
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

function enableSepaFeatureFlag() {
    const sepaFlag: FeatureFlag = 'SepaPayments';

    const useFlagMock = jest.spyOn(require('@proton/unleash/useFlag'), 'default');
    useFlagMock.mockImplementation((flag) => flag === sepaFlag);
}

async function initialize(props: SubscriptionContainerProps) {
    mockCheckResult();
    enableSepaFeatureFlag();

    const utils = renderWithProviders(<ContextSubscriptionContainer {...props} />);

    await waitFor(() => {
        expect(screen.getByTestId('subscription-amout-due')).toBeInTheDocument();
    });

    return utils;
}

async function waitUntilChecked() {
    await waitFor(() => {
        expect(screen.getByTestId('container-subscription-amout-due')).toBeInTheDocument();
    });

    await wait(0);
}

async function selectPaymentMethod(paymentMethodTypes: PAYMENT_METHOD_TYPES) {
    fireEvent.click(screen.getByTestId(`payment-method-${paymentMethodTypes}`));
}

async function selectCurrency(currency: Currency) {
    await waitFor(() => {
        expect(screen.getByTestId('currency-selector')).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId('currency-selector'));
    fireEvent.click(screen.getByTestId(`currency-option-${currency}`));
}

describe('SubscriptionContainer', () => {
    let props: SubscriptionContainerProps;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUserVPNServersCountApi();

        props = {
            app: 'proton-mail',
            defaultSelectedProductPlans: {
                [Audience.B2C]: PLANS.MAIL,
                [Audience.B2B]: PLANS.MAIL_PRO,
                [Audience.FAMILY]: PLANS.FAMILY,
            },
            metrics: {
                source: 'dashboard',
            },
            render: ({ onSubmit, title, content, footer }) => {
                return (
                    <form onSubmit={onSubmit}>
                        <div>{title}</div>
                        <div>{content}</div>
                        <div>{footer}</div>
                    </form>
                );
            },
            subscription: defaultSubscriptionCache,
            organization: organizationDefaultResponse.Organization as any as Organization,
            plans: plansDefaultResponse.Plans as any as Plan[],
            freePlan: FREE_PLAN,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {
                    Card: true,
                    Cash: true,
                    Bitcoin: true,
                    Apple: true,
                    Paypal: true,
                    Google: true,
                },
            },
        };
    });

    it('should render', () => {
        const { container } = renderWithProviders(<ContextSubscriptionContainer {...props} />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it.skip('should not create payment token if the amount is 0', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { [PLANS.MAIL]: 1 };

        const { container } = renderWithProviders(<ContextSubscriptionContainer {...props} />);

        let form: HTMLFormElement | null = null;
        await waitFor(() => {
            form = container.querySelector('form');
            expect(form).not.toBeEmptyDOMElement();
        });

        if (!form) {
            throw new Error('Form not found');
        }

        await waitFor(() => {});
        fireEvent.submit(form);

        await waitFor(() => {});
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'payments/v5/tokens' }));

        await waitFor(() => {
            expect(apiMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: 'payments/v5/subscription',
                    data: expect.objectContaining({
                        Amount: 0,
                    }),
                })
            );
        });
    });

    it('should handle currency change', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { [PLANS.MAIL]: 1 };
        props.currency = 'CHF';

        await initialize(props);
        await waitUntilChecked();

        expect(screen.getByTestId('currency-selector')).toHaveTextContent('CHF');

        await selectCurrency('USD');
        await waitUntilChecked();

        expect(screen.getByTestId('currency-selector')).toHaveTextContent('USD');
    });

    it('should select EUR when SEPA is selected', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { [PLANS.MAIL_PRO]: 1 };
        props.currency = 'CHF';

        await initialize(props);
        expect(screen.getByTestId('currency-selector')).toHaveTextContent('CHF');

        await selectPaymentMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);
        await waitUntilChecked();

        expect(screen.getByTestId('currency-selector')).toHaveTextContent('EUR');
    });
});
