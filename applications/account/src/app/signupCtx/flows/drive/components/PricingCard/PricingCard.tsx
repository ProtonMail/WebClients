import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { DriveLogo, Price, SkeletonLoader, getCheckoutRenewNoticeTextFromCheckResult } from '@proton/components';
import { IcBagPercentFilled } from '@proton/icons';
import type { Currency } from '@proton/payments';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import type { Tax } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

import { getDriveMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSecureStoragePerUserString, getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';
import { SaveBadge } from '../SaveBadge/SaveBadge';
import planFreeLogo from './plan-drive-free.svg';

import './PricingCard.scss';

export type PricingStep = 'account-details' | 'payment';

const LogoIconShape = ({ children, border = true }: { children: ReactNode; border?: boolean }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': '2.75rem', backgroundColor: 'white' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

const getCycleText = (cycle: CYCLE) => {
    if (!cycle) {
        return '';
    }
    if (cycle === CYCLE.MONTHLY) {
        return c('Billing cycle option').t`Monthly`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('Billing cycle option').t`Yearly`;
    }
    return c('Plans').ngettext(msgid`${cycle} month`, `${cycle} months`, cycle);
};

interface TaxRowProps {
    tax: Tax;
    currency: Currency;
}

const TaxRow = ({ tax, currency }: Partial<TaxRowProps>) => {
    if (!tax || !currency) {
        return null;
    }

    const formattedTaxRate = withDecimalPrecision(tax.Rate, 4);
    const price = (
        <Price key="price" currency={currency} data-testid="taxAmount">
            {tax.Amount}
        </Price>
    );
    const taxName = tax.Name ?? c('Label').t`VAT`;

    return (
        <div className="flex justify-space-between gap-2" data-testid="tax">
            <span>
                {taxName} {formattedTaxRate}
                {'%'}
            </span>
            <span>{price}</span>
        </div>
    );
};

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const maxSpace = getDriveMaxSpaceMap(payments);

    return (
        <div className="px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">
                {selectedPlan.name in maxSpace && (
                    <FeatureItem
                        text={
                            selectedPlan.name === PLANS.DRIVE_BUSINESS
                                ? getSecureStoragePerUserString(maxSpace[selectedPlan.name])
                                : getSecureStorageString(maxSpace[selectedPlan.name])
                        }
                        tooltip={
                            selectedPlan.name !== PLANS.FAMILY &&
                            selectedPlan.name !== PLANS.DRIVE_BUSINESS &&
                            c('Signup')
                                .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`
                        }
                        highlighted
                    />
                )}
                <FeatureItem text={c('Signup').t`End-to-end encryption`} highlighted />
                <FeatureItem text={c('Signup').t`Connect all your devices`} highlighted />
                <FeatureItem text={c('Signup').t`Online documents`} highlighted />
                <FeatureItem text={c('Signup').t`Secure file sharing`} highlighted />
                <FeatureItem text={c('Signup').t`Upload files of any size`} highlighted />
            </ul>
        </div>
    );
};

const PricingHeader = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    return (
        <>
            <div className="px-8">
                <span
                    className="rounded text-semibold py-0.5 px-1 color-primary"
                    style={{ backgroundColor: 'rgb(109 74 255 / 0.08)' }}
                >{c('Signup').t`Your plan`}</span>
            </div>
            <header className="flex flex-nowrap gap-4 items-center px-8">
                <LogoIconShape>
                    {selectedPlan.name === PLANS.FREE ? (
                        <img src={planFreeLogo} alt="" width={24} />
                    ) : (
                        <DriveLogo variant="glyph-only" width={30} />
                    )}
                </LogoIconShape>
                <span className="text-2xl text-semibold" data-testid="planName">
                    {selectedPlan.name === PLANS.FREE
                        ? `${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}`
                        : selectedPlan.getPlan().Title}
                </span>
            </header>
        </>
    );
};

const PricingFooter = ({ step }: { step: PricingStep }) => {
    const payments = usePaymentOptimistic();
    const { uiData, selectedPlan } = payments;
    const { checkout } = uiData;
    const isPaidPlan = selectedPlan.name !== PLANS.FREE;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const showTaxRow = step === 'payment';
    const taxRow = showTaxRow && (
        <TaxRow tax={payments.checkResult?.Taxes?.[0]} currency={payments.checkResult?.Currency} />
    );

    const showBillingCycle = (isPaidPlan && checkout.cycle !== CYCLE.MONTHLY) || step === 'payment';
    const billingCycle = showBillingCycle && (
        <div className="flex justify-space-between gap-2">
            <span>{c('Signup').t`Billing Cycle`}</span>
            <span data-testid="billingCycle">{getCycleText(checkout.cycle)}</span>
        </div>
    );

    const showDiscount = checkout.discountPercent !== 0;
    const discount = showDiscount && (
        <div className="flex justify-space-between gap-2">
            {hasFullCheckoutDetails ? (
                <SaveBadge savePercentage={checkout.discountPercent} />
            ) : (
                <SkeletonLoader width="5rem" height="1.25rem" />
            )}
            {hasFullCheckoutDetails ? (
                <Price key="price" currency={checkout.currency} className="text-strike" data-testid="discountPrice">
                    {checkout.withoutDiscountPerCycle}
                </Price>
            ) : (
                <SkeletonLoader width="5rem" height="1.25rem" />
            )}
        </div>
    );

    const showDivider = isPaidPlan && checkout.cycle !== CYCLE.MONTHLY;
    const divider = showDivider && <hr className="my-4 bg-weak" />;

    const total = (
        <div className="flex justify-space-between gap-2 text-lg">
            <span className="text-semibold">{c('Signup').t`Total`}</span>
            <span className="text-semibold">
                {isPaidPlan ? (
                    <>
                        {hasFullCheckoutDetails ? (
                            <Price
                                key="price"
                                data-testid="totalPrice"
                                currency={checkout.currency}
                                suffix={
                                    checkout.cycle === CYCLE.MONTHLY && (
                                        <span className="text-sm color-weak">{c('Suffix').t`/month`}</span>
                                    )
                                }
                            >
                                {checkout.withDiscountPerCycle}
                            </Price>
                        ) : (
                            <SkeletonLoader width="6.5rem" height="1.4rem" />
                        )}
                    </>
                ) : (
                    <span data-testid="totalFree">{c('Signup').t`Free`}</span>
                )}
            </span>
        </div>
    );

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-8 pt-5 gap-2">
                {taxRow}
                {billingCycle}
                {discount}
                {divider}
                {total}
            </div>
        </footer>
    );
};

export const PricingCard = ({ step }: { step: PricingStep }) => {
    const payments = usePaymentOptimistic();
    const { uiData, selectedPlan } = payments;
    const { checkout } = uiData;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const showRenewalNotice = selectedPlan.name !== PLANS.FREE && step === 'payment';
    const renewalNotice = showRenewalNotice && (
        <div className="w-full text-center text-sm color-weak mt-8">
            {getCheckoutRenewNoticeTextFromCheckResult({
                checkResult: payments.checkResult,
                plansMap: payments.plansMap,
                planIDs: checkout.planIDs,
                app: APPS.PROTONDRIVE,
            })}
        </div>
    );

    const showCouponBanner = hasFullCheckoutDetails && checkout.couponDiscount !== 0;
    const couponBanner = showCouponBanner && (
        <div className="pricing-card-top w-full shadow-raised bg-norm mb-1">
            <div className="pricing-card-top-content">
                <div className="flex items-center gap-2 px-8 py-4 fade-in">
                    <IcBagPercentFilled className="shrink-0 color-primary" />
                    <span className="text-semibold" data-testid="discountBanner">{c('Signup')
                        .t`Promo applied – ${checkout.discountPercent}% off`}</span>
                </div>
            </div>
        </div>
    );

    return (
        <section className={clsx('pricing-card w-full flex flex-column')}>
            {couponBanner}
            <div className="pricing-card-inner fade-in w-full flex flex-column shadow-raised gap-8 py-8 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter step={step} />
            </div>
            {renewalNotice}
        </section>
    );
};
