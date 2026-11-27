import React, { useState } from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getReadableTime } from '@proton/components/components/time/Time';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { GUARD_ERROR_CODES } from '@proton/payments/core/subscription/guard';
import type { Coupon } from '@proton/payments/core/subscription/interface';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import {
    createMockModel,
    createMockSignupConfiguration,
    createMockSignupParameters,
} from '@proton/payments/testing/signup';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import { SignupType } from '../signup/interfaces';
import type { SignupProvisioning } from '../signup/orgProvisioning';
import { ProvisioningPaymentMethod, getProvisionedDeal } from '../signup/orgProvisioning';
import Step1 from './Step1';
import { SignupMode, UpsellTypes } from './interface';

// Mock PlanCardSelector to simplify testing and provide stable test IDs
vi.mock('./PlanCardSelector', () => ({
    __esModule: true,
    PlanCardSelector: ({ cycle, currency, _plansMap, selectedPlanName, onSelect }: any) => (
        <div data-testid="plan-card-selector">
            <span>Selected: {selectedPlanName}</span>
            <span>Cycle: {cycle}</span>
            <span>Currency: {currency}</span>
            <button data-testid="select-vpn" onClick={() => onSelect({ [PLANS.VPN2024]: 1 }, PLANS.VPN2024)}>
                select vpn
            </button>
            <button data-testid="select-lumo" onClick={() => onSelect({ [PLANS.LUMO]: 1 }, PLANS.LUMO)}>
                select lumo
            </button>
            <button
                data-testid="select-pass-business"
                onClick={() => onSelect({ [PLANS.PASS_BUSINESS]: 1 }, PLANS.PASS_BUSINESS)}
            >
                select pass business
            </button>
        </div>
    ),
}));

// Mock AccountStepPayment to avoid act() warnings from useMethods hook.
// The banner reads the guard like the real component does: from the optimistic-aware options.checkResult.
vi.mock('./AccountStepPayment', async () => {
    const { GuardBanner } = await vi.importActual<any>('@proton/payments-hooks/ui/components/GuardBanner');
    return {
        __esModule: true,
        default: ({ handleOptimistic, options, renewalNotice }: any) => {
            return (
                <div data-testid="account-step-payment-mock">
                    Payment Mock
                    {renewalNotice}
                    <button data-testid="change-cycle" onClick={() => handleOptimistic({ cycle: CYCLE.YEARLY })}>
                        change cycle
                    </button>
                    <button
                        data-testid="change-addons"
                        onClick={() => handleOptimistic({ planIDs: { [PLANS.VPN2024]: 2 } })}
                    >
                        change addons
                    </button>
                    <span data-testid="check-result-amount">{options.checkResult.AmountDue}</span>
                    <GuardBanner errors={options.checkResult.GuardResult ?? []} telemetry={undefined} />
                </div>
            );
        },
    };
});

const getStep1Props = (overrides?: Partial<React.ComponentProps<typeof Step1>>) => ({
    initialSessionsLength: false,
    signInPath: '/switch',
    signupConfiguration: createMockSignupConfiguration(),
    signupParameters: createMockSignupParameters(),
    isLargeViewport: true,
    measure: vi.fn(),
    onComplete: vi.fn(),
    model: createMockModel(),
    setModel: vi.fn(),
    mode: SignupMode.Default,
    api: vi.fn(<T = any,>() => Promise.resolve({} as T)) as any,
    onTriggerModals: vi.fn(),
    onOpenLogin: vi.fn(),
    onOpenSwitch: vi.fn(),
    onSignOut: async () => {},
    step1Ref: { current: null } as any,
    onChangeCurrency: async () => ({}) as any,
    signupTrial: false,
    telemetryContext: {} as any,
    ...overrides,
});

const renderStep1 = (overrides?: Partial<React.ComponentProps<typeof Step1>>) =>
    renderWithProviders(<Step1 {...getStep1Props(overrides)} />, {
        preloadedState: {},
    });

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

    it.each([
        { cycle: CYCLE.MONTHLY, banner: null },
        { cycle: CYCLE.YEARLY, banner: '36% discount' },
    ])(
        'should price the minimum of users while checking a plan that has one (cycle $cycle)',
        async ({ cycle, banner }) => {
            const pendingCheckApi = vi.fn((query: any) =>
                query.url === 'payments/v5/subscription/check' ? new Promise(() => {}) : Promise.resolve({})
            );
            const StatefulStep1 = () => {
                const [model, setModel] = useState(() => {
                    const initialModel = createMockModel();
                    initialModel.subscriptionData.cycle = cycle;
                    initialModel.subscriptionData.checkResult.Cycle = cycle;
                    return initialModel;
                });
                return <Step1 {...getStep1Props({ model, setModel: setModel as any, api: pendingCheckApi as any })} />;
            };
            renderWithProviders(<StatefulStep1 />, { preloadedState: {} });

            await userEvent.click(await screen.findByTestId('select-pass-business'));

            expect(await screen.findByText(`Selected: ${PLANS.PASS_BUSINESS}`)).toBeInTheDocument();
            expect(screen.queryByText(/% discount/)?.textContent?.trim() ?? null).toBe(banner);
        }
    );
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

    it('dates the scheduled plan from the Lumo Plus subscription the selection changes, not from Mail Plus', async () => {
        const mailPlusPeriodEnd = 1825000000;
        const lumoPlusPeriodEnd = 1796000000;
        const webMailPlus = buildSubscription(
            { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' },
            { ID: 'mail-plus', PeriodEnd: mailPlusPeriodEnd }
        );
        const webLumoPlus = buildLumoSubscription(PLANS.LUMO, {
            ID: 'lumo-plus',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: lumoPlusPeriodEnd,
        });
        const model = createMockModel();
        model.subscriptionData.planIDs = { [PLANS.LUMO]: 1 };
        model.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedLater;
        model.session = {
            subscription: { ...webMailPlus, SecondarySubscriptions: [webLumoPlus] },
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
            state: { payable: true },
            resumedSessionResult: { UID: 'uid', User: { ID: 'user', Currency: 'CHF' } },
        };

        renderStep1({ model });

        expect(
            await screen.findByText(
                new RegExp(
                    `Your scheduled plan starts on ${getReadableTime({ value: lumoPlusPeriodEnd, format: 'PPP' })}`
                )
            )
        ).toBeInTheDocument();
        expect(
            screen.queryByText(new RegExp(getReadableTime({ value: mailPlusPeriodEnd, format: 'PPP' })))
        ).not.toBeInTheDocument();
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
        expect(screen.getByTestId('renewal-notice').textContent).toMatch(
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
        const setModel = vi.fn();
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

describe('Step1 - Pass Basic organization size', () => {
    const createPassBasicModel = (members = 0) => {
        const model = createMockModel();
        const planIDs = { [PLANS.PASS_BASIC]: 1, ...(members && { [ADDON_NAMES.MEMBER_PASS_BASIC]: members }) };
        model.subscriptionData.planIDs = planIDs;
        model.subscriptionData.cycle = CYCLE.YEARLY;
        model.subscriptionData.checkResult = {
            ...model.subscriptionData.checkResult,
            Amount: 0,
            AmountDue: 0,
            Cycle: CYCLE.YEARLY,
            requestData: { Plans: planIDs, Currency: 'CHF', Cycle: CYCLE.YEARLY },
        };
        model.planParameters = { planIDs, defined: true };
        return model;
    };

    const createB2BConfiguration = () => {
        const configuration = createMockSignupConfiguration();
        configuration.audience = Audience.B2B;
        configuration.audiences = [Audience.B2B];
        configuration.planCards = {
            [Audience.B2B]: [{ plan: PLANS.PASS_BASIC, subsection: null, type: 'standard', guarantee: false }],
        };
        configuration.defaults.plan = PLANS.PASS_BUSINESS;
        configuration.defaults.cycle = CYCLE.YEARLY;
        return configuration;
    };

    const renderPassBasic = (overrides?: Partial<React.ComponentProps<typeof Step1>>) =>
        renderStep1({
            model: createPassBasicModel(),
            signupConfiguration: createB2BConfiguration(),
            ...overrides,
        });

    it('should show the organization size selector without the trial limit', async () => {
        renderPassBasic();

        await waitFor(() => {
            expect(screen.getByTestId('1member-passbasic2026-customizer')).toBeInTheDocument();
        });

        expect(screen.getByText('Organization size')).toBeInTheDocument();
        expect(screen.queryByText(/during the trial period/)).not.toBeInTheDocument();
        expect(screen.getByTestId('1member-passbasic2026-customizer')).toHaveValue(1);
        expect(screen.getByTestId('increase-addon-1member-passbasic2026')).toBeEnabled();
        expect(screen.queryByTestId('account-step-payment-mock')).not.toBeInTheDocument();
    });

    it('should cap the organization size at the Pass Basic limit of 30 users', async () => {
        renderPassBasic({ model: createPassBasicModel(29) });

        await waitFor(() => {
            expect(screen.getByTestId('1member-passbasic2026-customizer')).toHaveValue(30);
        });

        expect(screen.getByTestId('increase-addon-1member-passbasic2026')).toBeDisabled();
    });

    it('should add member addons to the plan when the organization size changes', async () => {
        const setModel = vi.fn();
        renderPassBasic({ setModel });

        await waitFor(() => {
            expect(screen.getByTestId('increase-addon-1member-passbasic2026')).toBeInTheDocument();
        });

        await userEvent.click(screen.getByTestId('increase-addon-1member-passbasic2026'));

        const updater = setModel.mock.calls.at(-1)![0];
        expect(updater(createPassBasicModel()).optimistic.planIDs).toEqual({
            [PLANS.PASS_BASIC]: 1,
            [ADDON_NAMES.MEMBER_PASS_BASIC]: 1,
        });
    });

    it('should not show the organization size selector for the free plan', async () => {
        const model = createMockModel();
        model.subscriptionData.planIDs = {};
        model.planParameters = { planIDs: {}, defined: true };

        renderStep1({ model });

        await waitFor(() => {
            expect(screen.getByText(/Create your Proton Account|Create your Proton account/i)).toBeInTheDocument();
        });

        expect(screen.queryByText('Organization size')).not.toBeInTheDocument();
    });
});

describe('Step1 - subscription guards', () => {
    const CHECK_URL = 'payments/v5/subscription/check';
    const STORAGE_COPY = /doesn’t include enough storage/i;
    const blocked = {
        GuardResult: 'Your plan doesn’t include enough storage.',
        GuardResultCode: GUARD_ERROR_CODES.TOO_LITTLE_SPACE,
    };

    type CheckRequest = {
        data: any;
        resolve: (extra?: Record<string, unknown>) => void;
        reject: (error: unknown) => void;
    };

    const renderSignedInStep1 = (
        subscription = buildSubscription(PLANS.BUNDLE),
        multiSubscriptionContext = buildMultiSubscriptionContextFromSubscription(subscription)
    ) => {
        const requests: CheckRequest[] = [];
        const api = vi.fn((query: any) => {
            if (query.url !== CHECK_URL) {
                return Promise.resolve({});
            }
            return new Promise((resolve, reject) => {
                requests.push({
                    data: query.data,
                    resolve: (extra) =>
                        resolve({
                            Amount: 1234,
                            AmountDue: 1234,
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: query.data.Cycle,
                            Currency: query.data.Currency,
                            TaxMode: 'TaxIncluded',
                            Taxes: [],
                            SubscriptionMode: 0,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: 0,
                            ...extra,
                        }),
                    reject,
                });
            });
        });

        const SignedInStep1 = () => {
            const [model, setModel] = useState(() => ({
                ...createMockModel(),
                session: {
                    subscription,
                    multiSubscriptionContext,
                    state: { payable: true },
                    resumedSessionResult: { UID: 'uid', User: { ID: 'user', Currency: 'USD' } },
                },
            }));
            return (
                <Step1
                    initialSessionsLength={false}
                    signInPath="/switch"
                    signupConfiguration={createMockSignupConfiguration()}
                    signupParameters={createMockSignupParameters()}
                    isLargeViewport
                    measure={vi.fn()}
                    onComplete={vi.fn()}
                    model={model}
                    setModel={setModel as any}
                    mode={SignupMode.Default}
                    api={api as any}
                    onTriggerModals={vi.fn()}
                    onOpenLogin={vi.fn()}
                    onOpenSwitch={vi.fn()}
                    onSignOut={async () => {}}
                    step1Ref={{ current: null } as any}
                    onChangeCurrency={async () => ({}) as any}
                    signupTrial={false}
                    telemetryContext={{} as any}
                />
            );
        };

        renderWithProviders(<SignedInStep1 />, { preloadedState: {} });

        const nextRequest = async (index: number) => {
            await waitFor(() => expect(requests.length).toBeGreaterThan(index));
            return requests[index];
        };

        return { requests, nextRequest };
    };

    /**
     * Regression for P2-2735: the getSubscriptionPrices arguments are going to be deduplicated across the signup
     * Step1s. Pins the full check payload Step1 sends for a selection and for a cycle change.
     */
    it('sends the full check payload for a selected plan', async () => {
        const { nextRequest } = renderSignedInStep1();

        await userEvent.click(await screen.findByTestId('select-vpn'));

        expect((await nextRequest(0)).data).toEqual({
            Plans: { [PLANS.VPN2024]: 1 },
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            ValidateBillingAddress: true,
            BillingAddress: { State: '', CountryCode: 'CH' },
            ValidateGuards: true,
            Codes: [],
        });
    });

    it('sends the payload with the new cycle and its auto coupon when the cycle changes', async () => {
        const { nextRequest } = renderSignedInStep1();
        await userEvent.click(await screen.findByTestId('select-vpn'));
        await act(async () => (await nextRequest(0)).resolve());

        await userEvent.click(screen.getByTestId('change-cycle'));

        expect((await nextRequest(1)).data).toEqual({
            Plans: { [PLANS.VPN2024]: 1 },
            Currency: 'CHF',
            Cycle: CYCLE.YEARLY,
            ValidateBillingAddress: true,
            BillingAddress: { State: '', CountryCode: 'CH' },
            ValidateGuards: true,
            CouponCode: COUPON_CODES.VPN_INTRO_2025,
            Codes: [COUPON_CODES.VPN_INTRO_2025],
        });
    });

    it('does not ask to validate guards when the selected Lumo Plus runs next to Mail Plus yearly', async () => {
        const webMailPlus = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
        const { nextRequest } = renderSignedInStep1(webMailPlus, buildMultiSubscriptionContext([webMailPlus]));

        await userEvent.click(await screen.findByTestId('select-lumo'));

        const { data } = await nextRequest(0);
        expect(data).toMatchObject({ Plans: { [PLANS.LUMO]: 1 }, Cycle: CYCLE.MONTHLY });
        expect(data).not.toHaveProperty('ValidateGuards');
    });

    it('sends no check request while the user has not selected anything', async () => {
        const { requests } = renderSignedInStep1();

        await screen.findByTestId('select-vpn');

        expect(requests).toHaveLength(0);
    });

    it('sends ValidateGuards:true exactly once for a settled selection', async () => {
        const { requests, nextRequest } = renderSignedInStep1();

        await userEvent.click(await screen.findByTestId('select-vpn'));
        const request = await nextRequest(0);

        expect(request.data).toMatchObject({ Plans: { [PLANS.VPN2024]: 1 }, ValidateGuards: true });
        await act(async () => request.resolve());
        expect(requests).toHaveLength(1);
    });

    it('shows the guard warning and keeps the check result when the result is blocked', async () => {
        const { nextRequest } = renderSignedInStep1();

        await userEvent.click(await screen.findByTestId('select-vpn'));
        await act(async () => (await nextRequest(0)).resolve(blocked));

        expect(await screen.findByText(STORAGE_COPY)).toBeInTheDocument();
        expect(screen.getByTestId('check-result-amount')).toHaveTextContent('1234');
    });

    it('shows no warning when the result is allowed', async () => {
        const { nextRequest } = renderSignedInStep1();

        await userEvent.click(await screen.findByTestId('select-vpn'));
        await act(async () => (await nextRequest(0)).resolve());

        await waitFor(() => expect(screen.getByTestId('check-result-amount')).toHaveTextContent('1234'));
        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
    });

    it.each([
        ['billing cycle', 'change-cycle'],
        ['addon count', 'change-addons'],
    ])('clears the stale warning synchronously and re-checks when the %s changes', async (_, buttonTestId) => {
        const { requests, nextRequest } = renderSignedInStep1();
        await userEvent.click(await screen.findByTestId('select-vpn'));
        await act(async () => (await nextRequest(0)).resolve(blocked));
        expect(await screen.findByText(STORAGE_COPY)).toBeInTheDocument();

        await userEvent.click(screen.getByTestId(buttonTestId));

        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
        const request = await nextRequest(1);
        expect(request.data.ValidateGuards).toBe(true);
        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
        await act(async () => request.resolve());
        expect(requests).toHaveLength(2);
        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
    });

    it('only displays the result of the latest selection when responses arrive out of order', async () => {
        const { nextRequest } = renderSignedInStep1();
        await userEvent.click(await screen.findByTestId('select-vpn'));
        const first = await nextRequest(0);
        await userEvent.click(screen.getByTestId('change-cycle'));
        const second = await nextRequest(1);

        await act(async () => second.resolve());
        await act(async () => first.resolve(blocked));

        await waitFor(() => expect(screen.getByTestId('check-result-amount')).toHaveTextContent('1234'));
        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
    });

    it('recovers from a failed check: no warning, no "allowed" copy, retry works', async () => {
        const { nextRequest } = renderSignedInStep1();
        await userEvent.click(await screen.findByTestId('select-vpn'));
        await act(async () => (await nextRequest(0)).reject(new Error('timeout')));

        expect(screen.queryByText(STORAGE_COPY)).not.toBeInTheDocument();
        expect(screen.queryByText(/allowed/i)).not.toBeInTheDocument();

        await userEvent.click(screen.getByTestId('select-vpn'));
        const retry = await nextRequest(1);
        expect(retry.data.ValidateGuards).toBe(true);
        await act(async () => retry.resolve(blocked));

        expect(await screen.findByText(STORAGE_COPY)).toBeInTheDocument();
    });
});

describe('Step1 - provisioned signup', () => {
    const provisioning: SignupProvisioning = {
        OrganizationName: 'Acme',
        AdminDisplayName: 'Jane Doe',
        AdminEmail: 'jane@acme.com',
        BillingAddress: { CountryCode: 'CH', State: null, ZipCode: '8000', FirstName: 'Jane', LastName: 'Doe' },
        InvoiceEmail: 'billing@acme.com',
        Taxable: true,
        PaymentMethod: ProvisioningPaymentMethod.BankTransfer,
        PaymentTermsDays: 30,
    };

    it('should sign up with the locked admin email instead of a Proton address', async () => {
        const signupConfiguration = createMockSignupConfiguration();
        signupConfiguration.signupTypes = [SignupType.Proton];
        const signupParameters = createMockSignupParameters();
        signupParameters.mode = SignupMode.Invite;
        signupParameters.invite = { type: 'provisioning', data: { token: 'token' } };

        renderStep1({
            model: {
                ...createMockModel(),
                provisionedDeal: getProvisionedDeal({ token: 'token', provisioning, urlParams: {} }),
            },
            signupConfiguration,
            signupParameters,
            mode: SignupMode.Invite,
        });

        const email = await screen.findByDisplayValue('jane@acme.com');
        expect(email).toHaveAttribute('readonly');
        expect(document.querySelector('#username')).not.toBeInTheDocument();
    });

    it("should prefer the link's email over the lookup's admin email", async () => {
        const signupParameters = createMockSignupParameters();
        signupParameters.mode = SignupMode.Invite;
        signupParameters.invite = { type: 'provisioning', data: { token: 'token' } };
        signupParameters.email = 'admin@acme.com';

        renderStep1({
            model: {
                ...createMockModel(),
                provisionedDeal: getProvisionedDeal({ token: 'token', provisioning, urlParams: {} }),
            },
            signupParameters,
            mode: SignupMode.Invite,
        });

        expect(await screen.findByDisplayValue('admin@acme.com')).toHaveAttribute('readonly');
    });
});
