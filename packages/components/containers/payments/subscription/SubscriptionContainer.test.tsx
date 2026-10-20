import { fireEvent, screen, waitFor } from '@testing-library/react';

import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { CYCLE, DEFAULT_PAYMENT_VENDOR_STATES, PAYMENT_METHOD_TYPES, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { GUARD_ERROR_CODES } from '@proton/payments/core/subscription/guard';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import { addApiMock, apiMock } from '@proton/test-api/api';

import {
    defaultSubscriptionCache,
    organizationDefaultResponse,
    plansDefaultResponse,
} from '../../../hooks/helpers/tests/index';
import { renderWithProviders } from '../../../testing/renderWithProviders';
import {
    ContextSubscriptionContainer,
    enableSepaFeatureFlag,
    initializeCheckout as initialize,
    mockCheckResult,
} from '../../../testing/subscriptionContainer';
import type { SubscriptionContainerProps } from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';

jest.mock('@proton/atoms/Portal/Portal', () => ({
    __esModule: true,
    Portal: jest.fn(({ children }) => <>{children}</>),
}));

jest.mock('../../../hooks/assistant/useAssistantFeatureEnabled', () => ({
    __esModule: true,
    default: jest.fn(() => ({ paymentsEnabled: false, enabled: false })),
}));

jest.mock('@proton/unleash/proxy', () => ({
    useFlagsStatus: jest.fn(() => ({ flagsReady: true })),
}));

jest.mock('@proton/unleash/useVariant', () => ({
    useVariant: jest.fn(() => ({ name: 'disabled' })),
}));

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

        props = {
            app: 'proton-mail',
            defaultSelectedProductPlans: {
                [Audience.B2C]: PLANS.MAIL,
                [Audience.B2B]: PLANS.MAIL_PRO,
                [Audience.FAMILY]: PLANS.FAMILY,
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
                VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
            },
            initialBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            entitlementCatalog: buildEntitlementCatalog(),
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

    it('should keep "Close" button when applying an invalid coupon on an already-subscribed plan', async () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = planIDs;
        props.cycle = CYCLE.YEARLY;
        // Subscription matches the selected plan+cycle, so the check should be forbidden
        props.subscription = buildSubscription({
            planName: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            currency: 'CHF',
        });

        // Mock the API to throw an invalid coupon error when called.
        // The initial check() is forbidden (same plan+cycle, no coupon) and won't call the API.
        // Only when a coupon is applied will the API be called.
        addApiMock(
            'payments/v5/subscription/check',
            () => {
                throw { data: { Code: 800_003, Error: 'Invalid coupon' } };
            },
            'post'
        );
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        // Wait for the initial render — button should show "Close" because plan is already subscribed
        await waitFor(() => {
            expect(screen.getByText('Close')).toBeInTheDocument();
        });

        // Expand gift code section and apply an invalid coupon
        fireEvent.click(screen.getByTestId('add-gift-code'));
        const giftInput = screen.getByTestId('gift-code-input');
        fireEvent.change(giftInput, { target: { value: 'INVALIDCOUPON' } });
        fireEvent.click(screen.getByTestId('apply-gift-code'));

        // Wait for the check to complete, then verify the button still shows "Close"
        await waitFor(() => {
            expect(screen.getByText('Close')).toBeInTheDocument();
        });

        // Should NOT have changed to "Confirm" or "Pay"
        expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
        expect(screen.queryByText(/Pay .* now/)).not.toBeInTheDocument();
    });
});

describe('SubscriptionContainer subscription guards', () => {
    let props: SubscriptionContainerProps;

    beforeEach(() => {
        jest.clearAllMocks();

        props = {
            app: 'proton-mail',
            defaultSelectedProductPlans: {
                [Audience.B2C]: PLANS.MAIL,
                [Audience.B2B]: PLANS.MAIL_PRO,
                [Audience.FAMILY]: PLANS.FAMILY,
            },
            render: ({ onSubmit, title, content, footer }) => (
                <form onSubmit={onSubmit}>
                    <div>{title}</div>
                    <div>{content}</div>
                    <div>{footer}</div>
                </form>
            ),
            subscription: buildSubscription({
                planName: PLANS.DRIVE,
                cycle: CYCLE.YEARLY,
                currency: 'CHF',
            }),
            organization: organizationDefaultResponse.Organization as any as Organization,
            plans: plansDefaultResponse.Plans as any as Plan[],
            freePlan: FREE_PLAN,
            entitlementCatalog: buildEntitlementCatalog(),
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
            },
            initialBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
            currency: 'CHF',
            skipPlanTransitionChecks: true,
            parent: 'subscription-modal',
        };
    });

    it('does not send ValidateGuards on mount while browsing plan selection', async () => {
        props.step = SUBSCRIPTION_STEPS.PLAN_SELECTION;
        props.planIDs = { [PLANS.MAIL]: 1 };

        mockCheckResult();
        enableSepaFeatureFlag();
        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await wait(100);

        expect(apiMock).not.toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'payments/v5/subscription/check',
                data: expect.objectContaining({ ValidateGuards: true }),
            })
        );
    });

    it('sends ValidateGuards once when checkout selection settles', async () => {
        await initialize(props);

        await waitFor(() => {
            const guardChecks = apiMock.mock.calls.filter(
                ([request]) => request.url === 'payments/v5/subscription/check' && request.data?.ValidateGuards === true
            );
            expect(guardChecks).toHaveLength(1);
        });
    });

    it('shows guard failure near the CTA, keeps pricing visible, and disables Continue', async () => {
        mockCheckResult({
            GuardResult: 'raw backend message',
            GuardResultCode: GUARD_ERROR_CODES.TOO_LITTLE_SPACE,
        });
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(screen.getByTestId('subscription-amout-due')).toBeInTheDocument();
            expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        });

        expect(screen.getByTestId('price')).toBeInTheDocument();
        expect(screen.getByTestId('billed-cycle-text')).toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeDisabled();
        expect(screen.queryByText('raw backend message')).not.toBeInTheDocument();
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    });

    it('clears guard feedback when the re-validated cycle check succeeds', async () => {
        let resolveSecondCheck: (value: SubscriptionEstimation) => void;
        const secondCheckPromise = new Promise<SubscriptionEstimation>((resolve) => {
            resolveSecondCheck = resolve;
        });
        let guardedCheckCount = 0;

        addApiMock(
            'payments/v5/subscription/check',
            ({ data }: { data: CheckSubscriptionData }) => {
                const result = getOptimisticCheckResult({
                    planIDs: data.Plans,
                    cycle: data.Cycle,
                    currency: data.Currency,
                    plansMap: getPlansMap(getLongTestPlans(), data.Currency, false),
                });

                const response = {
                    ...result,
                    AmountDue: result.Amount,
                };

                if (data.ValidateGuards) {
                    guardedCheckCount += 1;

                    if (guardedCheckCount === 1) {
                        return {
                            ...response,
                            GuardResult: 'raw',
                            GuardResultCode: GUARD_ERROR_CODES.TOO_LITTLE_SPACE,
                        };
                    }

                    return secondCheckPromise;
                }

                return response;
            },
            'post'
        );
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId(`cycle-${CYCLE.MONTHLY}`).querySelector('button')!);

        await waitFor(() => {
            expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('confirm')).toBeEnabled();
        });

        await waitFor(() => {
            expect(
                apiMock.mock.calls.filter(
                    ([request]) =>
                        request.url === 'payments/v5/subscription/check' && request.data?.ValidateGuards === true
                ).length
            ).toBe(2);
        });

        resolveSecondCheck!({
            ...getOptimisticCheckResult({
                planIDs: props.planIDs!,
                cycle: CYCLE.MONTHLY,
                currency: 'CHF',
                plansMap: getPlansMap(getLongTestPlans(), 'CHF', false),
            }),
            AmountDue: 999,
            Coupon: null,
            SubscriptionMode: 0 as any,
            BaseRenewAmount: null,
            RenewCycle: null,
            requestData: {
                Plans: props.planIDs!,
                Currency: 'CHF',
                Cycle: CYCLE.MONTHLY,
            },
            GuardResult: [],
        });

        await waitFor(() => {
            expect(screen.getByTestId('confirm')).toBeEnabled();
        });
        expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
    });

    it('keeps Continue enabled after a check error and does not claim the purchase is allowed', async () => {
        addApiMock(
            'payments/v5/subscription/check',
            () => {
                throw { data: { Code: 2011, Error: 'Temporary failure' } };
            },
            'post'
        );
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(screen.getByTestId('confirm')).toBeEnabled();
        });

        expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
    });

    it('sends ValidateGuards: false when only currency changes', async () => {
        await initialize(props);

        await waitFor(() => {
            expect(screen.getByTestId('container-subscription-amout-due')).toBeInTheDocument();
        });

        const guardChecksBefore = apiMock.mock.calls.filter(
            ([request]) => request.url === 'payments/v5/subscription/check' && request.data?.ValidateGuards === true
        ).length;

        await waitFor(() => {
            expect(screen.getByTestId('currency-selector')).toBeEnabled();
        });
        fireEvent.click(screen.getByTestId('currency-selector'));
        fireEvent.click(screen.getByTestId('currency-option-USD'));

        await waitFor(() => {
            expect(screen.getByTestId('container-subscription-amout-due')).toBeInTheDocument();
        });

        const guardChecksAfter = apiMock.mock.calls.filter(
            ([request]) => request.url === 'payments/v5/subscription/check' && request.data?.ValidateGuards === true
        ).length;

        expect(guardChecksAfter).toBe(guardChecksBefore);
    });

    it('keeps the guard verdict when a passive re-check returns no guard result', async () => {
        addApiMock(
            'payments/v5/subscription/check',
            ({ data }: { data: CheckSubscriptionData }) => {
                const result = getOptimisticCheckResult({
                    planIDs: data.Plans,
                    cycle: data.Cycle,
                    currency: data.Currency,
                    plansMap: getPlansMap(getLongTestPlans(), data.Currency, false),
                });

                const response = {
                    ...result,
                    AmountDue: result.Amount,
                };

                // Only validating checks get a guard verdict; passive checks answer without guard fields.
                if (data.ValidateGuards) {
                    return {
                        ...response,
                        GuardResult: 'raw',
                        GuardResultCode: GUARD_ERROR_CODES.TOO_LITTLE_SPACE,
                    };
                }

                return response;
            },
            'post'
        );
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        });
        expect(screen.getByTestId('confirm')).toBeDisabled();

        fireEvent.click(screen.getByTestId('currency-selector'));
        fireEvent.click(screen.getByTestId('currency-option-USD'));

        await waitFor(() => {
            expect(
                apiMock.mock.calls.some(
                    ([request]) =>
                        request.url === 'payments/v5/subscription/check' &&
                        request.data?.Currency === 'USD' &&
                        request.data?.ValidateGuards === false
                )
            ).toBe(true);
        });
        // The selector re-renders from the same state update that commits the new check result,
        // so once it shows USD the passive response has definitively landed.
        await waitFor(() => {
            expect(screen.getByTestId('currency-selector')).toHaveTextContent('USD');
        });

        expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        expect(screen.getByTestId('confirm')).toBeDisabled();
    });

    it('clears guard feedback when reverting to the current subscription', async () => {
        props.subscription = buildSubscription({
            planName: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            currency: 'CHF',
        });
        props.planIDs = { [PLANS.DRIVE]: 1 };
        props.disablePlanSelection = false;

        addApiMock(
            'payments/v5/subscription/check',
            ({ data }: { data: CheckSubscriptionData }) => {
                const result = getOptimisticCheckResult({
                    planIDs: data.Plans,
                    cycle: data.Cycle,
                    currency: data.Currency,
                    plansMap: getPlansMap(getLongTestPlans(), data.Currency, false),
                });

                const response = {
                    ...result,
                    AmountDue: result.Amount,
                };

                if (data.ValidateGuards) {
                    return {
                        ...response,
                        GuardResult: 'raw',
                        GuardResultCode: GUARD_ERROR_CODES.TOO_LITTLE_SPACE,
                    };
                }

                return response;
            },
            'post'
        );
        enableSepaFeatureFlag();

        renderWithProviders(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(screen.getByText(/enough storage for your account/i)).toBeInTheDocument();
        });
        expect(screen.getByTestId('confirm')).toBeDisabled();

        fireEvent.click(screen.getByText('Back'));

        await waitFor(() => {
            expect(screen.getByTestId('b2c-plan')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId(`select-${PLANS.MAIL}`));

        await waitFor(() => {
            expect(screen.getByTestId('subscription-checkout')).toBeInTheDocument();
            expect(screen.queryByText(/enough storage for your account/i)).not.toBeInTheDocument();
        });
    });
});
