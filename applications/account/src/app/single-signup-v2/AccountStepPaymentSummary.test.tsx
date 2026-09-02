import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionMode, TaxMode } from '@proton/payments/core/subscription/constants';
import type { Coupon } from '@proton/payments/core/subscription/interface';
import { createMockModel, mockPlans } from '@proton/payments/testing/signup';
import { APPS } from '@proton/shared/lib/constants';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import AccountStepPaymentSummary from './AccountStepPaymentSummary';
import type { SignupModelV2 } from './interface';

const porkbunCouponConfig = { coupons: [COUPON_CODES.PORKBUN], hidden: true };

const getRowText = (label: string | RegExp) => {
    const el = screen.getByText(label);
    const row = el.closest('div') as HTMLElement;
    return row.textContent ?? '';
};

const renderAccountStepPaymentSummary = (
    modelOverrides: Partial<SignupModelV2> = {},
    propsOverrides: Partial<React.ComponentProps<typeof AccountStepPaymentSummary>> = {},
    selectedPlanOverride?: React.ComponentProps<typeof AccountStepPaymentSummary>['selectedPlan'] | null,
    optionsCheckResultOverride?: any
) => {
    const model = { ...createMockModel(), ...modelOverrides };
    const selectedPlan = (
        selectedPlanOverride === undefined ? mockPlans.find((p) => p.Name === PLANS.PASS) : selectedPlanOverride
    ) as React.ComponentProps<typeof AccountStepPaymentSummary>['selectedPlan'];

    const optionsCheckResult = optionsCheckResultOverride ?? model.subscriptionData.checkResult;

    return renderWithProviders(
        <AccountStepPaymentSummary
            model={model}
            options={{
                planIDs: model.subscriptionData.planIDs,
                cycle: model.subscriptionData.cycle,
                currency: model.subscriptionData.currency,
                checkResult: optionsCheckResult,
                billingAddress: model.subscriptionData.billingAddress,
            }}
            selectedPlan={selectedPlan}
            loadingPaymentDetails={propsOverrides?.loadingPaymentDetails ?? false}
            showRenewalNotice={propsOverrides?.showRenewalNotice ?? true}
            app={propsOverrides?.app ?? APPS.PROTONPASS}
            couponConfig={propsOverrides?.couponConfig}
        />,
        {
            preloadedState: {},
        }
    );
};

describe('AccountStepPaymentSummary - Regression Tests', () => {
    describe('Basic Rendering', () => {
        it('should render the plan summary with correct price for regular subscription', async () => {
            renderAccountStepPaymentSummary();

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Proton Pass/i)).toBeInTheDocument();
            expect(screen.getByText(/Total for 1 month/i)).toBeInTheDocument();
        });

        it('should show price breakdown section with billing cycle', async () => {
            renderAccountStepPaymentSummary();

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getAllByText(/1 month/i).length).toBeGreaterThan(0);
        });

        it('should return null when summaryPlan is undefined', async () => {
            const { container } = renderAccountStepPaymentSummary(
                {},
                {},
                null as unknown as React.ComponentProps<typeof AccountStepPaymentSummary>['selectedPlan']
            );

            expect(container.firstChild).toBeNull();
        });
    });

    describe('Trial Mode', () => {
        it('should show trial-specific content with "Amount due after trial"', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            trialModel.subscriptionData.checkResult.AmountDue = 0;

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/amount due after trial/i)).toBeInTheDocument();
            expect(screen.getByText(/amount due now/i)).toBeInTheDocument();
        });

        it('should hide full plan amount for tax inclusive trials', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            trialModel.subscriptionData.checkResult.AmountDue = 0;
            trialModel.subscriptionData.checkResult.TaxMode = TaxMode.INCLUSIVE as any;
            trialModel.subscriptionData.checkResult.Taxes = [
                {
                    Name: 'VAT',
                    Rate: 8,
                    Amount: 40,
                    inclusive: TaxMode.INCLUSIVE,
                },
            ] as any;

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/Total for 1 month/i)).not.toBeInTheDocument();
            expect(screen.getByText(/amount due now/i)).toBeInTheDocument();
        });

        it('should keep the full plan amount for tax exclusive trials (extended checkout)', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            trialModel.subscriptionData.checkResult.AmountDue = 0;
            trialModel.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            trialModel.subscriptionData.checkResult.Taxes = [{ Amount: 40, Rate: 8.1, Name: 'VAT' }];

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText('Subtotal for 1 month')).toBeInTheDocument();
            expect(screen.queryByText('Total for 1 month')).not.toBeInTheDocument();
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByText(/amount due after trial/i)).toBeInTheDocument();
        });

        it('should show "Amount due now" for trials with zero payment', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            trialModel.subscriptionData.checkResult.AmountDue = 0;

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/amount due now/i)).toBeInTheDocument();
        });

        it('should show the renewable amount as the "Amount due after trial" price', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            trialModel.subscriptionData.checkResult.AmountDue = 951;
            trialModel.subscriptionData.checkResult.BaseRenewAmount = 957;

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(document.body.textContent).toContain('9.57');
        });
    });

    describe('Discounts and Coupons', () => {
        it('should display BF offer discount with special pricing', async () => {
            const bfModel = createMockModel();

            bfModel.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.BLACK_FRIDAY_2025,
            } as Coupon;
            bfModel.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(bfModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Total for 1 month/i)).toBeInTheDocument();
        });

        it('should collapse a BF offer with a non-zero discount into a single discounted total', async () => {
            const bfModel = createMockModel();

            bfModel.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.BLACK_FRIDAY_2025,
            } as Coupon;
            bfModel.subscriptionData.checkResult.Amount = 987;
            bfModel.subscriptionData.checkResult.AmountDue = 940;
            bfModel.subscriptionData.checkResult.CouponDiscount = 763;

            renderAccountStepPaymentSummary(bfModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            // BF offers behave like a hidden coupon: no Discount row ...
            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
            // ... and no dedicated Amount due block.
            expect(screen.queryByText(/amount due/i)).not.toBeInTheDocument();
            // The single total line shows the discounted amount (Amount - CouponDiscount = 9.87 - 7.63).
            expect(document.body.textContent).toContain('2.24');
        });

        it('should hide discount display for Porkbun coupon', async () => {
            const porkbunModel = createMockModel();

            porkbunModel.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.PORKBUN,
            } as Coupon;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
            expect(screen.getByText(/total for 1 month/i)).toBeInTheDocument();
        });

        it('should hide discount amount when couponConfig.hidden is true', async () => {
            renderAccountStepPaymentSummary(
                {},
                {
                    couponConfig: { coupons: [], hidden: true },
                }
            );

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Total for/i)).toBeInTheDocument();
        });

        it('should collapse a hidden TEST25 coupon with a non-zero discount into a single total', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Coupon = { Code: 'TEST25' } as Coupon;
            model.subscriptionData.checkResult.Amount = 1000;
            model.subscriptionData.checkResult.AmountDue = 950;
            model.subscriptionData.checkResult.CouponDiscount = 250;

            renderAccountStepPaymentSummary(model, {
                couponConfig: { coupons: ['TEST25'], hidden: true },
            });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/^Discount$/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/amount due/i)).not.toBeInTheDocument();
            expect(document.body.textContent).toContain('7.50');
        });

        it('should show tax breakdown but hide discount when couponConfig.hidden is true with tax exclusive pricing', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Coupon = { Code: 'TEST25' } as Coupon;
            model.subscriptionData.checkResult.Amount = 1000;
            model.subscriptionData.checkResult.AmountDue = 825;
            model.subscriptionData.checkResult.CouponDiscount = 250;
            model.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            model.subscriptionData.checkResult.Taxes = [{ Amount: 75, Rate: 8.1, Name: 'VAT' }];

            renderAccountStepPaymentSummary(model, {
                couponConfig: { coupons: ['TEST25'], hidden: true },
            });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/^Discount$/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(document.body.textContent).toContain('8.25');
        });

        it('should show discount line with the discount value when coupon is present and not hidden', async () => {
            const modelWithCoupon = createMockModel();

            modelWithCoupon.subscriptionData.checkResult.Coupon = {
                Code: 'SAVE20',
            } as Coupon;
            modelWithCoupon.subscriptionData.checkResult.CouponDiscount = 785;

            renderAccountStepPaymentSummary(modelWithCoupon);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(getRowText(/^Discount$/)).toContain('Discount');
            expect(document.body.textContent).toContain('7.85');
        });
    });

    describe('Porkbun coupon (legacy behavior)', () => {
        const b2bPlan = () => mockPlans.find((p) => p.Name === PLANS.PASS_BUSINESS)!;

        const createPorkbunModel = () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.PORKBUN,
            } as Coupon;

            return model;
        };

        it('should collapse Porkbun pricing into a single total for tax-inclusive B2B checkout', async () => {
            const porkbunModel = createPorkbunModel();

            porkbunModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            porkbunModel.subscriptionData.cycle = CYCLE.YEARLY;
            porkbunModel.subscriptionData.checkResult.Cycle = CYCLE.YEARLY;
            porkbunModel.subscriptionData.checkResult.Amount = 15588;
            porkbunModel.subscriptionData.checkResult.AmountDue = 15588;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 0;
            porkbunModel.subscriptionData.checkResult.TaxMode = TaxMode.INCLUSIVE;
            porkbunModel.subscriptionData.checkResult.Taxes = [{ Amount: 1167, Rate: 8.1, Name: 'VAT' }];

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig }, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByTestId('plan-amount')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('amount-due')).toHaveLength(1);
            expect(screen.getByTestId('amount-due').textContent).toMatch(/Total for 12 months/i);
            expect(screen.queryByTestId('coupon')).not.toBeInTheDocument();
        });

        it('should force an Amount due row for B2C Porkbun checkout (hideDiscount)', async () => {
            const porkbunModel = createPorkbunModel();

            porkbunModel.subscriptionData.checkResult.CouponDiscount = 0;
            porkbunModel.subscriptionData.checkResult.AmountDue = 647;

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByTestId('plan-amount')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('amount-due')).toHaveLength(1);
            expect(screen.getByTestId('amount-due').textContent).toMatch(/Total for 1 month/i);
        });

        it('should force a single total row for B2B Porkbun checkout (hideDiscount)', async () => {
            const porkbunModel = createPorkbunModel();

            porkbunModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            porkbunModel.subscriptionData.checkResult.Amount = 723;
            porkbunModel.subscriptionData.checkResult.AmountDue = 647;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 0;
            porkbunModel.subscriptionData.checkResult.BaseRenewAmount = 677;

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig }, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByTestId('plan-amount')).not.toBeInTheDocument();
            expect(screen.getAllByTestId('amount-due')).toHaveLength(1);
            expect(screen.getByTestId('amount-due').textContent).toMatch(/Total for 1 month/i);
        });

        it('should hide the discount line when Porkbun has a non-zero CouponDiscount', async () => {
            const porkbunModel = createPorkbunModel();

            porkbunModel.subscriptionData.checkResult.Amount = 1000;
            porkbunModel.subscriptionData.checkResult.AmountDue = 750;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 250;

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByTestId('coupon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('plan-amount')).not.toBeInTheDocument();
            expect(screen.getByTestId('amount-due').textContent).toMatch(/Total for 1 month/i);
        });

        it('should show discounted member pricing for B2B Porkbun checkout', async () => {
            const porkbunModel = createPorkbunModel();

            porkbunModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            porkbunModel.subscriptionData.checkResult.Amount = 723;
            porkbunModel.subscriptionData.checkResult.AmountDue = 647;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 76;
            porkbunModel.subscriptionData.checkResult.BaseRenewAmount = 677;

            const checkout = getCheckoutUi({
                planIDs: porkbunModel.subscriptionData.planIDs,
                plansMap: porkbunModel.plansMap,
                checkResult: porkbunModel.subscriptionData.checkResult,
            });

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig }, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(checkout.withDiscountMembersPerMonth).toBeLessThan(checkout.membersPerMonth);

            const discountedMemberPrice = getSimplePriceString(
                porkbunModel.subscriptionData.currency,
                checkout.withDiscountMembersPerMonth
            );
            const fullMemberPrice = getSimplePriceString(
                porkbunModel.subscriptionData.currency,
                checkout.membersPerMonth
            );

            expect(screen.getByTestId('members').textContent).toContain(discountedMemberPrice);
            expect(screen.getByTestId('members').textContent).not.toContain(fullMemberPrice);
        });
    });

    describe('Proration and Credits', () => {
        it('should display proration line when proration value is positive', async () => {
            const prorationModel = createMockModel();

            prorationModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;
            prorationModel.subscriptionData.checkResult.Proration = 787;

            renderAccountStepPaymentSummary(prorationModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(getRowText(/Proration/)).toContain('Proration');
            expect(getRowText(/Proration/)).toContain('Balance from your previous subscription');
            expect(document.body.textContent).toContain('7.87');
        });

        it('should display negative proration as credit', async () => {
            const creditModel = createMockModel();

            creditModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;
            creditModel.subscriptionData.checkResult.Proration = -773;

            renderAccountStepPaymentSummary(creditModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(getRowText(/Proration/)).toContain('Credit for the unused portion');
            expect(document.body.textContent).toContain('7.73');
        });

        it('should render the proration line for a non-zero proration in Regular mode', async () => {
            const prorationModel = createMockModel();

            prorationModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;
            prorationModel.subscriptionData.checkResult.Proration = 613;

            renderAccountStepPaymentSummary(prorationModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(getRowText(/Proration/)).toContain('Balance from your previous subscription');
            expect(document.body.textContent).toContain('6.13');
        });

        it('should display credits line when credit value is non-zero', async () => {
            const creditsModel = createMockModel();

            creditsModel.subscriptionData.checkResult.Credit = 761;

            renderAccountStepPaymentSummary(creditsModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(document.body.textContent).toContain('Credits');
            expect(document.body.textContent).toContain('7.61');
        });

        it('should show "Amount due" section when proration exists', async () => {
            const prorationModel = createMockModel();

            prorationModel.subscriptionData.checkResult.Proration = 757;

            renderAccountStepPaymentSummary(prorationModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
        });

        it('should show "Amount due" section when credits exist', async () => {
            const creditsModel = createMockModel();

            creditsModel.subscriptionData.checkResult.Credit = 751;

            renderAccountStepPaymentSummary(creditsModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
        });
    });

    describe('Tax Handling', () => {
        it('should show exclusive tax breakdown when TaxMode is EXCLUSIVE', async () => {
            const taxModel = createMockModel();

            taxModel.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            taxModel.subscriptionData.checkResult.AmountDue = 743;
            taxModel.subscriptionData.checkResult.Taxes = [{ Amount: 739, Rate: 8.1, Name: 'VAT' }];

            renderAccountStepPaymentSummary(taxModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByText(/Tax 8.1%/i)).toBeInTheDocument();
            expect(screen.getByTestId('taxAmount').textContent).toContain('7.39');
        });

        it('should aggregate multiple taxes into a plural "Taxes" label', async () => {
            const multiTaxModel = createMockModel();

            multiTaxModel.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            multiTaxModel.subscriptionData.checkResult.AmountDue = 990;

            const taxes = [
                { Amount: 991, Rate: 992, Name: 'VAT' },
                { Amount: 998, Rate: 996, Name: 'City tax' },
            ];

            multiTaxModel.subscriptionData.checkResult.Taxes = taxes;

            renderAccountStepPaymentSummary(multiTaxModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const totalRate = taxes.reduce((acc: number, t: { Rate: number }) => acc + t.Rate, 0);
            const totalAmount = taxes.reduce((acc: number, t: { Amount: number }) => acc + t.Amount, 0);
            const formattedAmount = (totalAmount / 100).toFixed(2);

            expect(screen.getByText(`Taxes ${totalRate}%`)).toBeInTheDocument();
            expect(screen.getByTestId('taxAmount').textContent).toContain(formattedAmount);
        });

        it('should render the inclusive VAT breakdown row when there is no separate amount due', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Proration = 0;
            model.subscriptionData.checkResult.Credit = 0;
            model.subscriptionData.checkResult.CouponDiscount = 0;
            model.subscriptionData.checkResult.AmountDue = 995;
            model.subscriptionData.checkResult.TaxMode = TaxMode.INCLUSIVE;

            const singleTaxRate = 973;

            model.subscriptionData.checkResult.Taxes = [{ Amount: 974, Rate: singleTaxRate, Name: 'VAT' }];

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const taxEl = screen.getByTestId('tax');

            expect(screen.queryByText(/amount due/i)).not.toBeInTheDocument();
            expect(taxEl).toBeInTheDocument();
            expect(taxEl.textContent).toContain(`Including ${singleTaxRate}% tax`);
        });

        it('should show VAT inclusive text when TaxMode is INCLUSIVE', async () => {
            const trialModel = createMockModel();

            trialModel.subscriptionData.checkResult.TaxMode = TaxMode.INCLUSIVE;
            trialModel.subscriptionData.checkResult.Taxes = [
                {
                    Name: 'VAT',
                    Rate: 733,
                    Amount: 727,
                },
            ] as any;

            renderAccountStepPaymentSummary(trialModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const taxElement = screen.getByTestId('tax');

            expect(taxElement).toBeInTheDocument();
            expect(screen.getByText(/Including 733% tax/i)).toBeInTheDocument();
        });

        it('should show VAT reverse charge text for B2B with VAT number', async () => {
            const b2bModel = createMockModel();
            b2bModel.subscriptionData.billingAddress.CountryCode = 'DE';
            b2bModel.subscriptionData.vatNumber = 'DE123456789';
            b2bModel.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            b2bModel.subscriptionData.checkResult.Taxes = [];

            renderAccountStepPaymentSummary(b2bModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/VAT reverse charge mechanism applies/i)).toBeInTheDocument();
        });

        it('should render the reverse charge row above the amount due divider when showAmountDue is true', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            model.subscriptionData.checkResult.Taxes = [];
            model.subscriptionData.checkResult.Credit = 544;

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const reverseCharge = screen.getByText(/VAT reverse charge mechanism applies/i);
            const amountDue = screen.getByText(/amount due/i);

            expect(reverseCharge.compareDocumentPosition(amountDue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(document.querySelectorAll('hr').length).toBe(1);
        });

        it('should render the inclusive VAT text below the amount due row when showAmountDue is true', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.TaxMode = TaxMode.INCLUSIVE;
            model.subscriptionData.checkResult.Taxes = [{ Amount: 707, Rate: 800, Name: 'VAT' }];
            model.subscriptionData.checkResult.Credit = 545;

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const taxEl = screen.getByTestId('tax');
            const amountDue = screen.getByText(/amount due/i);

            expect(taxEl).toBeInTheDocument();
            expect(amountDue.compareDocumentPosition(taxEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('should not show reverse charge when TaxMode is undefined', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.TaxMode = undefined;
            model.subscriptionData.checkResult.Taxes = [];
            model.subscriptionData.checkResult.Credit = 0;
            model.subscriptionData.checkResult.Proration = 0;
            model.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/VAT reverse charge mechanism applies/i)).not.toBeInTheDocument();
        });

        it('should not render a divider before "Amount due" when the breakdown is empty', async () => {
            const model = createMockModel();
            model.subscriptionData.checkResult.Credit = 0;
            model.subscriptionData.checkResult.Proration = 0;
            model.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(model, { couponConfig: { coupons: [], hidden: true } });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Total for/i)).toBeInTheDocument();
            expect(document.querySelectorAll('hr').length).toBe(0);
        });

        it('should render reverse charge together with the trial summary', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Trial;
            model.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            model.subscriptionData.checkResult.Taxes = [];

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/VAT reverse charge mechanism applies/i)).toBeInTheDocument();
            expect(screen.getByText(/Amount due now/i)).toBeInTheDocument();
            expect(screen.getByText(/Amount due after trial/i)).toBeInTheDocument();
        });

        it('should show proration and reverse charge together when upgrading under reverse charge', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;
            model.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            model.subscriptionData.checkResult.Taxes = [];
            model.subscriptionData.checkResult.Proration = 613;
            model.subscriptionData.checkResult.AmountDue = 812;

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByTestId('plan-amount')).toBeInTheDocument();
            expect(getRowText(/Proration/)).toContain('Balance from your previous subscription');
            expect(screen.getByText(/VAT reverse charge mechanism applies/i)).toBeInTheDocument();
            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
            expect(document.body.textContent).toContain('6.13');
        });
    });

    describe('Loading States', () => {
        it('should show skeleton loader when model.loadingDependencies is true', async () => {
            const loadingModel = createMockModel();

            loadingModel.loadingDependencies = true;

            renderAccountStepPaymentSummary(loadingModel);

            expect(await screen.findByText(/loading/i)).toBeInTheDocument();
        });

        it('should show loading accessibility text when loading', async () => {
            renderAccountStepPaymentSummary({}, { loadingPaymentDetails: true });

            expect(await screen.findByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe('Asterisk Position Logic', () => {
        it('should show asterisk next to final amount for regular subscriptions', async () => {
            renderAccountStepPaymentSummary(
                {},
                {
                    showRenewalNotice: true,
                }
            );

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/total for 1 month/i)).toBeInTheDocument();
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should show asterisk next to full price for custom billings', async () => {
            const customBillingModel = createMockModel();

            customBillingModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.CustomBillings;

            renderAccountStepPaymentSummary(customBillingModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/total for/i)).toBeInTheDocument();
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should show asterisk next to full price when proration exists with regular mode', async () => {
            const prorationModel = createMockModel();

            prorationModel.subscriptionData.checkResult.Proration = 719;
            prorationModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;

            renderAccountStepPaymentSummary(prorationModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
            expect(screen.getByText('*')).toBeInTheDocument();
        });
    });

    describe('B2B Plans', () => {
        const b2bPlan = () => mockPlans.find((p) => p.Name === PLANS.PASS_BUSINESS)!;

        it('should handle B2B plan rendering correctly', async () => {
            const b2bModel = createMockModel();

            b2bModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            b2bModel.subscriptionData.checkResult.Amount = 701;
            b2bModel.subscriptionData.checkResult.AmountDue = 709;
            b2bModel.subscriptionData.checkResult.BaseRenewAmount = 711;

            renderAccountStepPaymentSummary(b2bModel, {}, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Pass Professional/i)).toBeInTheDocument();
            expect(screen.getByText(/1 user/i)).toBeInTheDocument();
        });

        it('should display members with discount for B2B when hideDiscount is true', async () => {
            const porkbunModel = createMockModel();

            porkbunModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            porkbunModel.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.PORKBUN,
            } as Coupon;
            porkbunModel.subscriptionData.checkResult.Amount = 723;
            porkbunModel.subscriptionData.checkResult.AmountDue = 647;
            porkbunModel.subscriptionData.checkResult.CouponDiscount = 0;
            porkbunModel.subscriptionData.checkResult.BaseRenewAmount = 677;

            renderAccountStepPaymentSummary(porkbunModel, { couponConfig: porkbunCouponConfig }, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
            expect(screen.getAllByText(/total for 1 month/i).length).toBeGreaterThan(0);
            expect(screen.getByText(/1 user/i)).toBeInTheDocument();
        });

        it('should show tax exclusive breakdown for B2B plans', async () => {
            const b2bModel = createMockModel();

            b2bModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            b2bModel.subscriptionData.billingAddress.CountryCode = 'DE';
            b2bModel.subscriptionData.checkResult.Amount = 701;
            b2bModel.subscriptionData.checkResult.AmountDue = 758;
            b2bModel.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            b2bModel.subscriptionData.checkResult.Taxes = [{ Amount: 57, Rate: 19, Name: 'VAT' }];

            renderAccountStepPaymentSummary(b2bModel, {}, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/1 user/i)).toBeInTheDocument();
            expect(screen.getByTestId('plan-amount')).toBeInTheDocument();
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByText(/Tax 19%/i)).toBeInTheDocument();
            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
            expect(document.querySelectorAll('hr').length).toBeGreaterThan(0);
            expect(document.body.textContent).toContain('7.58');
        });

        it('should show VAT reverse charge for B2B without a subtotal breakdown', async () => {
            const b2bModel = createMockModel();

            b2bModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            b2bModel.subscriptionData.billingAddress.CountryCode = 'DE';
            b2bModel.subscriptionData.vatNumber = 'DE123456789';
            b2bModel.subscriptionData.checkResult.Amount = 701;
            b2bModel.subscriptionData.checkResult.AmountDue = 701;
            b2bModel.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            b2bModel.subscriptionData.checkResult.Taxes = [];

            renderAccountStepPaymentSummary(b2bModel, {}, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Pass Professional/i)).toBeInTheDocument();
            expect(screen.getByText(/1 user/i)).toBeInTheDocument();
            expect(screen.queryByTestId('plan-amount')).not.toBeInTheDocument();
            expect(screen.queryByTestId('taxAmount')).not.toBeInTheDocument();
            expect(screen.getByText(/VAT reverse charge mechanism applies/i)).toBeInTheDocument();
            expect(screen.getByText(/total for 1 month/i)).toBeInTheDocument();
        });

        it('should show proration breakdown when a B2B user upgrades under reverse charge', async () => {
            const b2bModel = createMockModel();

            b2bModel.subscriptionData.planIDs = { [PLANS.PASS_BUSINESS]: 1 };
            b2bModel.subscriptionData.billingAddress.CountryCode = 'DE';
            b2bModel.subscriptionData.vatNumber = 'DE123456789';
            b2bModel.subscriptionData.checkResult.SubscriptionMode = SubscriptionMode.Regular;
            b2bModel.subscriptionData.checkResult.Amount = 701;
            b2bModel.subscriptionData.checkResult.AmountDue = 812;
            b2bModel.subscriptionData.checkResult.Proration = 613;
            b2bModel.subscriptionData.checkResult.TaxMode = TaxMode.REVERSE_CHARGE;
            b2bModel.subscriptionData.checkResult.Taxes = [];
            b2bModel.session = {
                resumedSessionResult: { UID: 'existing-user' },
                subscription: { Plans: [{ Name: PLANS.PASS }] },
            };

            renderAccountStepPaymentSummary(b2bModel, {}, b2bPlan());

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByTestId('plan-amount')).toBeInTheDocument();
            expect(getRowText(/Proration/)).toContain('Balance from your previous subscription');
            expect(screen.getByText(/VAT reverse charge mechanism applies/i)).toBeInTheDocument();
            expect(screen.getByText(/amount due/i)).toBeInTheDocument();
        });
    });

    describe('Renewal Notice', () => {
        const cleanRegularModel = () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Proration = 0;
            model.subscriptionData.checkResult.Credit = 0;
            model.subscriptionData.checkResult.CouponDiscount = 0;
            model.subscriptionData.checkResult.AmountDue = 747;
            return model;
        };

        it('should show renewal notice indicator on the amount line when showRenewalNotice is true', async () => {
            renderAccountStepPaymentSummary(cleanRegularModel(), {
                showRenewalNotice: true,
            });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/amount due/i)).not.toBeInTheDocument();
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should hide renewal notice indicator when showRenewalNotice is false', async () => {
            renderAccountStepPaymentSummary(cleanRegularModel(), {
                showRenewalNotice: false,
            });

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Total for 1 month/i)).toBeInTheDocument();
            expect(screen.queryByText('*')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero AmountDue gracefully for free plans', async () => {
            const freeModel = createMockModel();

            freeModel.subscriptionData.checkResult.AmountDue = 641;
            freeModel.subscriptionData.checkResult.Amount = 643;
            freeModel.subscriptionData.checkResult.BaseRenewAmount = 0;

            renderAccountStepPaymentSummary(freeModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Summary/i)).toBeInTheDocument();
        });

        it('should handle different currencies correctly', async () => {
            const eurModel = createMockModel();

            eurModel.subscriptionData.currency = 'EUR';
            eurModel.subscriptionData.checkResult.Currency = 'EUR';
            eurModel.subscriptionData.checkResult.Amount = 683;
            eurModel.subscriptionData.checkResult.AmountDue = 687;

            renderAccountStepPaymentSummary(eurModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const euroSymbols = screen.getAllByText('€');

            expect(euroSymbols.length).toBeGreaterThan(0);
        });

        it('should handle yearly cycle correctly', async () => {
            const yearlyModel = createMockModel();

            yearlyModel.subscriptionData.cycle = CYCLE.YEARLY;
            yearlyModel.subscriptionData.checkResult.Cycle = CYCLE.YEARLY;

            renderAccountStepPaymentSummary(yearlyModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/12 months/i)).toBeInTheDocument();
        });

        it('should show correct pricing for yearly cycle', async () => {
            const yearlyModel = createMockModel();

            yearlyModel.subscriptionData.cycle = CYCLE.YEARLY;
            yearlyModel.subscriptionData.checkResult.Cycle = CYCLE.YEARLY;
            yearlyModel.subscriptionData.checkResult.BaseRenewAmount = 691;

            renderAccountStepPaymentSummary(yearlyModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Total for 12 months/i)).toBeInTheDocument();
        });
    });

    describe('Price Breakdown Structure', () => {
        it('should show full price line when no discount is applied', async () => {
            const cleanModel = createMockModel();

            cleanModel.subscriptionData.checkResult.Amount = 499;
            cleanModel.subscriptionData.checkResult.AmountDue = 499;
            cleanModel.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(cleanModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByText(/Total for 1 month/i)).toBeInTheDocument();
            expect(document.querySelector('.save-label')).toBeNull();
            expect(document.querySelector('.text-strike')).toBeNull();
        });

        it('should show the discount badge and struck-through regular price when a coupon reduces the price', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Amount = 906;
            model.subscriptionData.checkResult.Coupon = { Code: 'SAVE20' } as Coupon;
            model.subscriptionData.checkResult.CouponDiscount = 927;

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            const saveLabel = document.querySelector('.save-label');

            expect(saveLabel).not.toBeNull();
            expect(saveLabel?.textContent).toMatch(/\u2212?\s*\d+%/);
            expect(document.querySelector('.text-strike')).not.toBeNull();
        });

        it('should show discounted price when BF offer is active', async () => {
            const bfModel = createMockModel();

            bfModel.subscriptionData.checkResult.Coupon = {
                Code: COUPON_CODES.BLACK_FRIDAY_2025,
            } as Coupon;
            bfModel.subscriptionData.checkResult.CouponDiscount = 0;

            renderAccountStepPaymentSummary(bfModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();

            expect(screen.getByText(/Total for 1 month/i)).toBeInTheDocument();
        });

        it('should show tax line when TaxMode is EXCLUSIVE', async () => {
            const taxModel = createMockModel();

            taxModel.subscriptionData.checkResult.TaxMode = TaxMode.EXCLUSIVE;
            taxModel.subscriptionData.checkResult.AmountDue = 653;
            taxModel.subscriptionData.checkResult.Taxes = [{ Amount: 661, Rate: 8.1, Name: 'VAT' }];

            renderAccountStepPaymentSummary(taxModel);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
        });
    });

    describe('Coupon routing (hasCouponCode)', () => {
        it('should prefer subscriptionData.checkResult when a coupon code is present', async () => {
            const model = createMockModel();

            model.subscriptionData.checkResult.Coupon = { Code: 'SAVE20' } as Coupon;
            model.subscriptionData.checkResult.Amount = 920;
            model.subscriptionData.checkResult.CouponDiscount = 885;

            const optionsCheckResult = {
                ...model.subscriptionData.checkResult,
                Coupon: undefined,
                Amount: 985,
                CouponDiscount: 990,
            };

            renderAccountStepPaymentSummary(model, {}, undefined, optionsCheckResult);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(document.body.textContent).toContain('8.85');
        });

        it('should use options.checkResult when no coupon code is present on subscriptionData', async () => {
            const model = createMockModel();
            const optionsCheckResult = {
                ...model.subscriptionData.checkResult,
                Amount: 965,
                CouponDiscount: 935,
            };

            renderAccountStepPaymentSummary(model, {}, undefined, optionsCheckResult);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(document.body.textContent).toContain('9.35');
        });
    });

    describe('Lumo addon', () => {
        it('should append "+ Lumo" to the plan title when a Lumo addon is selected', async () => {
            const model = createMockModel();

            model.subscriptionData.planIDs = { [PLANS.PASS]: 1, '1lumo-pass2023': 1 };

            renderAccountStepPaymentSummary(model);

            await waitFor(() => {
                expect(screen.getByText(/Summary/i)).toBeInTheDocument();
            });

            expect(document.querySelector('.right-summary-logo')?.getAttribute('title')).toMatch(/\+ Lumo$/i);
        });
    });
});
