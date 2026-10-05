import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import type { Coupon } from '@proton/payments/core/subscription/interface';
import {
    createMockModel,
    createMockSignupConfiguration,
    createMockSignupParameters,
} from '@proton/payments/testing/signup';
import { Audience } from '@proton/shared/lib/interfaces';

import Step1 from './Step1';
import { SignupMode, UpsellTypes } from './interface';

// Mock PlanCardSelector to simplify testing and provide stable test IDs
jest.mock('./PlanCardSelector', () => ({
    __esModule: true,
    PlanCardSelector: ({ cycle, currency, _plansMap, selectedPlanName }: any) => (
        <div data-testid="plan-card-selector">
            <span>Selected: {selectedPlanName}</span>
            <span>Cycle: {cycle}</span>
            <span>Currency: {currency}</span>
        </div>
    ),
}));

// Mock AccountStepPayment to avoid act() warnings from useMethods hook
jest.mock('./AccountStepPayment', () => ({
    __esModule: true,
    default: () => <div data-testid="account-step-payment-mock">Payment Mock</div>,
}));

const renderStep1 = (overrides?: Partial<React.ComponentProps<typeof Step1>>) => {
    const defaultProps = {
        initialSessionsLength: false,
        signupConfiguration: createMockSignupConfiguration(),
        signupParameters: createMockSignupParameters(),
        isLargeViewport: true,
        measure: jest.fn(),
        onComplete: jest.fn(),
        model: createMockModel(),
        setModel: jest.fn(),
        currentPlan: undefined,
        mode: SignupMode.Default,
        api: jest.fn(<T = any,>() => Promise.resolve({} as T)),
        onTriggerModals: jest.fn(),
        onOpenLogin: jest.fn(),
        onOpenSwitch: jest.fn(),
        onSignOut: async () => {},
        step1Ref: { current: null } as any,
        onChangeCurrency: async () => ({}) as any,
        signupTrial: false,
        telemetryContext: {} as any,
        ...overrides,
    };

    return renderWithProviders(<Step1 {...defaultProps} />, {
        preloadedState: {},
    });
};

describe('Step1 - Offer Banner Tests', () => {
    it('should show DRIVE plan limited time offer with TRYDRIVEPLUS2024 coupon', async () => {
        const driveModel = createMockModel();
        driveModel.subscriptionData.planIDs = { [PLANS.DRIVE]: 1 };
        driveModel.optimistic = {
            ...driveModel.optimistic,
            coupon: COUPON_CODES.TRYDRIVEPLUS2024,
        };
        driveModel.subscriptionData.checkResult.Coupon = {
            Code: COUPON_CODES.TRYDRIVEPLUS2024,
        } as Coupon;

        const driveConfiguration = createMockSignupConfiguration();
        driveConfiguration.product = 'proton-drive';
        driveConfiguration.defaults.plan = PLANS.DRIVE;

        const driveParameters = createMockSignupParameters();

        renderStep1({
            model: driveModel,
            signupConfiguration: driveConfiguration,
            signupParameters: driveParameters,
        });

        await waitFor(() => {
            expect(screen.getByText(/Limited time offer/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/for the 1st month/i)).toBeInTheDocument();
    });

    it('should not show discount banner when hasPlanSelector is false', async () => {
        // Set model.planParameters.defined to true to hide plan selector
        const modelWithoutSelector = createMockModel();
        modelWithoutSelector.planParameters = {
            planIDs: modelWithoutSelector.planParameters!.planIDs,
            plan: modelWithoutSelector.planParameters!.plan!,
            defined: true,
        };

        renderStep1({ model: modelWithoutSelector });

        await waitFor(() => {
            expect(screen.queryByTestId('plan-card-selector')).not.toBeInTheDocument();
            expect(screen.getByText(/Your subscription will automatically renew /)).toBeInTheDocument();
        });

        expect(screen.queryByText(/your.*discount.*has been applied/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/end of year discount/i)).not.toBeInTheDocument();
    });

    it('should not show discount banner during upsell mode', async () => {
        const upsellModel = createMockModel();
        upsellModel.upsell.mode = UpsellTypes.UPSELL;

        renderStep1({ model: upsellModel });

        await waitFor(() => {
            expect(screen.queryByTestId('plan-card-selector')).not.toBeInTheDocument();
            expect(screen.getByText(/Your subscription will automatically renew /)).toBeInTheDocument();
        });

        expect(screen.queryByText(/your.*discount.*has been applied/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/end of year discount/i)).not.toBeInTheDocument();
    });

    it('should not show discount banner when checkout.discountPercent is 0', async () => {
        renderStep1({
            signupTrial: false,
        });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        expect(screen.queryByText(/your.*discount.*has been applied/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/end of year discount/i)).not.toBeInTheDocument();
    });

    it('should not show discount banner during signup trial', async () => {
        const trialModel = createMockModel();
        trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;

        renderStep1({
            model: trialModel,
            signupTrial: true,
        });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        expect(screen.queryByText(/your.*discount.*has been applied/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/end of year discount/i)).not.toBeInTheDocument();
    });
});

describe('Step1 - Basic Mounting', () => {
    it('should mount without crashing', async () => {
        const { container } = renderStep1();

        await waitFor(() => {
            expect(container).toBeTruthy();
        });
    });

    it('should display the plan card selector', async () => {
        renderStep1();

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        const selector = screen.getByTestId('plan-card-selector');
        expect(selector).toHaveTextContent('Selected: pass');
        expect(selector).toHaveTextContent('Cycle: 1');
        expect(selector).toHaveTextContent('Currency: CHF');
    });

    it('should handle yearly cycle configuration and renewal notice accordingly', async () => {
        const yearlyModel = createMockModel();
        yearlyModel.subscriptionData.cycle = CYCLE.YEARLY;
        yearlyModel.subscriptionData.checkResult.Cycle = CYCLE.YEARLY;
        yearlyModel.subscriptionData.checkResult.RenewCycle = CYCLE.YEARLY;

        renderStep1({ model: yearlyModel });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        const selector = screen.getByTestId('plan-card-selector');
        expect(selector).toHaveTextContent('Cycle: 12');
    });

    it('should display renewal notice for paid plans', async () => {
        renderStep1();

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        const renewalNotice = screen.getByText(/Your subscription will automatically renew /);
        expect(renewalNotice).toBeInTheDocument();
    });

    it('should hide renewal notice for free plans', async () => {
        const freeModel = createMockModel();
        freeModel.subscriptionData.planIDs = {};

        renderStep1({ model: freeModel });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        // Renewal notice should NOT be visible for free plans
        expect(screen.queryByText(/Your subscription will automatically renew /)).not.toBeInTheDocument();
    });

    it('should hide renewal notice for trial plans', async () => {
        const trialModel = createMockModel();
        trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;

        renderStep1({ model: trialModel });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        // Renewal notice should NOT be visible for trial plans
        expect(screen.queryByText(/Your subscription will automatically renew /)).not.toBeInTheDocument();
    });

    it('should show monthly cycle in renewal notice', async () => {
        renderStep1();

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        const renewalNotice = screen.getByText(/Your subscription will automatically renew /);

        expect(renewalNotice).toBeInTheDocument();
        expect(renewalNotice).toHaveTextContent('month');
    });

    it('should show yearly cycle in renewal notice', async () => {
        const yearlyModel = createMockModel();
        yearlyModel.subscriptionData.cycle = CYCLE.YEARLY;
        yearlyModel.subscriptionData.checkResult.Cycle = CYCLE.YEARLY;
        yearlyModel.subscriptionData.checkResult.RenewCycle = CYCLE.YEARLY;

        renderStep1({ model: yearlyModel });

        await waitFor(() => {
            expect(screen.getByTestId('plan-card-selector')).toBeInTheDocument();
        });

        const renewalNotice = screen.getByText(/Your subscription will automatically renew /);

        expect(renewalNotice).toBeInTheDocument();
        expect(renewalNotice).toHaveTextContent('12 months');
    });
});

describe('Step1 - paymentless B2B trial', () => {
    const createPaymentlessTrialModel = () => {
        const model = createMockModel();
        model.subscriptionData.planIDs = { [PLANS.PASS_PRO]: 1, [ADDON_NAMES.MEMBER_PASS_PRO]: 2 };
        model.subscriptionData.cycle = CYCLE.YEARLY;
        model.subscriptionData.checkResult = {
            ...model.subscriptionData.checkResult,
            Amount: 10788,
            AmountDue: 0,
            Cycle: CYCLE.YEARLY,
            RenewCycle: CYCLE.YEARLY,
            BaseRenewAmount: 10788,
            SubscriptionMode: SubscriptionMode.Trial,
            requestData: {
                Plans: { [PLANS.PASS_PRO]: 1, [ADDON_NAMES.MEMBER_PASS_PRO]: 2 },
                Currency: 'CHF',
                Cycle: CYCLE.YEARLY,
            },
        };
        model.subscriptionData.trial = true;
        model.planParameters = { planIDs: model.subscriptionData.planIDs, defined: true };
        return model;
    };

    const createB2BConfiguration = () => {
        const configuration = createMockSignupConfiguration();
        configuration.audience = Audience.B2B;
        configuration.audiences = [Audience.B2B];
        configuration.planCards = {
            [Audience.B2B]: [{ plan: PLANS.PASS_PRO, subsection: null, type: 'standard', guarantee: false }],
        };
        configuration.defaults.plan = PLANS.PASS_PRO;
        configuration.defaults.cycle = CYCLE.YEARLY;
        return configuration;
    };

    const createPaymentlessParameters = () => {
        const parameters = createMockSignupParameters();
        parameters.trial = true;
        parameters.cardless = true;
        parameters.preSelectedPlan = PLANS.PASS_PRO;
        return parameters;
    };

    const renderPaymentlessTrial = (overrides?: Partial<React.ComponentProps<typeof Step1>>) =>
        renderStep1({
            model: createPaymentlessTrialModel(),
            signupConfiguration: createB2BConfiguration(),
            signupParameters: createPaymentlessParameters(),
            signupTrial: true,
            ...overrides,
        });

    it('should show the checkout summary instead of hiding the whole payment step', async () => {
        renderPaymentlessTrial();

        await waitFor(() => {
            expect(screen.getByTestId('amount-due')).toBeInTheDocument();
        });

        expect(screen.getByTestId('amount-due')).toHaveTextContent('Amount due now');
        expect(screen.getByTestId('amount-due')).toHaveTextContent('CHF 0');
        expect(screen.getByTestId('base-renew-amount')).toHaveTextContent('Amount due after trial');
        expect(screen.getByTestId('base-renew-amount')).toHaveTextContent('CHF 107.88');
        expect(screen.getByTestId('renewal-notice')).toHaveTextContent(
            /Your trial ends on .+\. Add a payment method whenever you.re ready to keep using all Pass Essentials features\./
        );

        expect(screen.queryByTestId('account-step-payment-mock')).not.toBeInTheDocument();
    });

    it('should show the organization size selector capped at the trial limit', async () => {
        renderPaymentlessTrial();

        await waitFor(() => {
            expect(screen.getByTestId('1member-passpro2024-customizer')).toBeInTheDocument();
        });

        expect(screen.getByText('Organization size')).toBeInTheDocument();
        expect(screen.getByText('Up to 10 users, during the trial period').closest('label')).toBeNull();
        expect(screen.queryByText(/Add Meet|Add Lumo/)).not.toBeInTheDocument();
        expect(screen.getByTestId('1member-passpro2024-customizer')).toHaveValue(3);
        expect(screen.getByTestId('increase-addon-1member-passpro2024')).toBeEnabled();
    });

    it('should leave the organization size to the payment step on a trial that collects a card', async () => {
        const parameters = createPaymentlessParameters();
        parameters.cardless = false;

        renderPaymentlessTrial({ signupParameters: parameters });

        await waitFor(() => {
            expect(screen.getByTestId('account-step-payment-mock')).toBeInTheDocument();
        });

        expect(screen.queryByText('Up to 10 users, during the trial period')).not.toBeInTheDocument();
        expect(screen.queryByTestId('1member-passpro2024-customizer')).not.toBeInTheDocument();
    });

    it('should show the summary skeleton instead of the feature panel while dependencies load', async () => {
        const model = createMockModel();
        model.loadingDependencies = true;

        const configuration = createB2BConfiguration();
        configuration.benefits = <div>The only password manager with</div>;

        renderPaymentlessTrial({ model, signupConfiguration: configuration });

        await waitFor(() => {
            expect(screen.getByTestId('paymentless-trial-summary-skeleton')).toBeInTheDocument();
        });

        expect(screen.queryByText('The only password manager with')).not.toBeInTheDocument();
    });

    it('should not show the offer banner placeholder while dependencies load', async () => {
        const model = createMockModel();
        model.loadingDependencies = true;

        renderPaymentlessTrial({ model });

        await waitFor(() => {
            expect(screen.getByTestId('paymentless-trial-summary-skeleton')).toBeInTheDocument();
        });

        const summarySkeleton = screen.getByTestId('paymentless-trial-summary-skeleton');
        const skeletonsOutsideSummary = screen
            .getAllByTestId('skeleton-loader')
            .filter((skeleton) => !summarySkeleton.contains(skeleton));
        expect(skeletonsOutsideSummary).toEqual([]);
    });

    it('should not show the payment details while dependencies load', async () => {
        const model = createMockModel();
        model.loadingDependencies = true;

        renderPaymentlessTrial({ model });

        await waitFor(() => {
            expect(screen.getByTestId('paymentless-trial-summary-skeleton')).toBeInTheDocument();
        });

        expect(screen.queryByText('Payment details')).not.toBeInTheDocument();
        expect(screen.queryByTestId('account-step-payment-mock')).not.toBeInTheDocument();
    });

    it('should keep the trial mode on the optimistic check result when the organization size changes', async () => {
        const setModel = jest.fn();
        renderPaymentlessTrial({ setModel });

        await waitFor(() => {
            expect(screen.getByTestId('increase-addon-1member-passpro2024')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByTestId('increase-addon-1member-passpro2024'));

        const updater = setModel.mock.calls.at(-1)![0];
        const optimistic = updater(createPaymentlessTrialModel()).optimistic;
        expect(optimistic.planIDs).toEqual({ [PLANS.PASS_PRO]: 1, [ADDON_NAMES.MEMBER_PASS_PRO]: 3 });
        expect(optimistic.checkResult.SubscriptionMode).toBe(SubscriptionMode.Trial);
    });
});
