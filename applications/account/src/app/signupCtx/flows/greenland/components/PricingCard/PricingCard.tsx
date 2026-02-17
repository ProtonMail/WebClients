import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { MailLogo, Price, SkeletonLoader, getCheckoutRenewNoticeTextFromCheckResult } from '@proton/components';
import { IcBagPercentFilled } from '@proton/icons/icons/IcBagPercentFilled';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { APPS, BRAND_NAME, DARK_WEB_MONITORING_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize, { type SizeUnits } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';
import { SaveBadge } from '../SaveBadge/SaveBadge';
import { TaxRow } from './TaxRow';

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

const getHumanReadableSpace = (space: number | undefined, unit?: SizeUnits) => {
    if (!space) {
        return undefined;
    }
    return humanSize({ bytes: space, fraction: 0, unit, unitOptions: { max: 'TB' } });
};

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const maxSpace = getHumanReadableSpace(payments.plansMap[PLANS.MAIL]?.MaxSpace);

    const plan = payments.plansMap[PLANS.MAIL];
    const maxAddresses = plan?.MaxAddresses || 10;

    return (
        <div className="px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">
                <FeatureItem loading={!maxSpace} text={getSecureStorageString(maxSpace)} highlighted />
                <FeatureItem
                    loading={payments.loadingPaymentDetails}
                    text={c('Signup').ngettext(
                        msgid`${maxAddresses} extra email address`,
                        `${maxAddresses} extra email addresses`,
                        maxAddresses
                    )}
                    highlighted
                />
                <FeatureItem text={c('Signup').t`Use your own email domain`} highlighted />
                <FeatureItem text={c('Signup').t`Unlimited folders, labels, and filters`} highlighted />
                <FeatureItem text={c('Signup').t`${MAIL_APP_NAME} desktop app`} highlighted />
                <FeatureItem text={DARK_WEB_MONITORING_NAME} highlighted />
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
                    <MailLogo variant="glyph-only" width={30} />
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

const PricingFooter = () => {
    const payments = usePaymentOptimistic();
    const { checkoutUi, selectedPlan } = payments;
    const isPaidPlan = selectedPlan.name !== PLANS.FREE;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const taxRow = <TaxRow checkResult={payments.checkResult} />;

    const billingCycle = (
        <div className="flex justify-space-between gap-2">
            <span>{c('Signup').t`Billing Cycle`}</span>
            <span data-testid="billingCycle">{getCycleText(checkoutUi.cycle)}</span>
        </div>
    );

    const showDiscount = checkoutUi.discountPercent !== 0;
    const discount = showDiscount && (
        <div className="flex justify-space-between gap-2">
            {hasFullCheckoutDetails ? (
                <SaveBadge savePercentage={checkoutUi.discountPercent} />
            ) : (
                <SkeletonLoader width="5rem" height="1.25rem" />
            )}
            {hasFullCheckoutDetails ? (
                <Price key="price" currency={checkoutUi.currency} className="text-strike" data-testid="discountPrice">
                    {checkoutUi.withoutDiscountPerCycle}
                </Price>
            ) : (
                <SkeletonLoader width="5rem" height="1.25rem" />
            )}
        </div>
    );

    const showDivider = isPaidPlan && checkoutUi.cycle !== CYCLE.MONTHLY;
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
                                currency={checkoutUi.currency}
                                suffix={
                                    checkoutUi.cycle === CYCLE.MONTHLY && (
                                        <span className="text-sm color-weak">{c('Suffix').t`/month`}</span>
                                    )
                                }
                            >
                                {checkoutUi.amountDue}
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

export const PricingCard = () => {
    const payments = usePaymentOptimistic();
    const { checkoutUi } = payments;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const renewalNotice = (
        <div className="w-full text-center text-sm color-weak mt-8">
            {getCheckoutRenewNoticeTextFromCheckResult({
                checkResult: payments.checkResult,
                plansMap: payments.plansMap,
                planIDs: checkoutUi.planIDs,
                app: APPS.PROTONMAIL,
            })}
        </div>
    );

    const showCouponBanner = hasFullCheckoutDetails && checkoutUi.couponDiscount !== 0;
    const couponBanner = showCouponBanner && (
        <div className="greenland-signup-pricing-card-top w-full shadow-raised bg-norm mb-1">
            <div className="greenland-signup-pricing-card-top-content">
                <div className="flex items-center gap-2 px-8 py-4 fade-in">
                    <IcBagPercentFilled className="shrink-0 color-primary" />
                    <span className="text-semibold" data-testid="discountBanner">{c('Signup')
                        .t`Promo applied – ${checkoutUi.discountPercent}% off`}</span>
                </div>
            </div>
        </div>
    );

    return (
        <section className={clsx('greenland-signup-pricing-card w-full flex flex-column')}>
            {couponBanner}
            <div className="greenland-signup-pricing-card-inner fade-in w-full flex flex-column shadow-raised gap-8 py-8 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter />
            </div>
            {renewalNotice}
        </section>
    );
};
