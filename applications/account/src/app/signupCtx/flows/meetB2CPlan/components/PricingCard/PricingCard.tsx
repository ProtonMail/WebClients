import type { ReactNode } from 'react';

import { c } from 'ttag';

import { CycleSelector, Price, SkeletonLoader } from '@proton/components';
import {
    FREE_MAX_ACTIVE_MEETINGS,
    FREE_MAX_MEETINGS_PER_DAY,
    FREE_MAX_PARTICIPANTS,
    PAID_MAX_ACTIVE_MEETINGS,
    PAID_MAX_PARTICIPANTS,
    getMaxMeetingsPerDayText,
    getMaxMeetingsText,
    getMaxParticipantsText,
    getMeetMeetingRecordingText,
    getMeetingMaxLengthText,
} from '@proton/components/containers/payments/features/meet';
import { IcBagPercentFilled } from '@proton/icons/icons/IcBagPercentFilled';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { type CheckoutView, createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import FeatureItem from '../FeatureItem/FeatureItem';
import { SaveBadge } from '../SaveBadge/SaveBadge';
import planMeetProfessionalLogo from './plan-meet-business.svg';
import planFreeLogo from './plan-meet-free.svg';

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

const PricingFeatures = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const features =
        selectedPlan.name === PLANS.MEET ? (
            <>
                <FeatureItem text={getMeetingMaxLengthText('paid')} highlighted />
                <FeatureItem text={getMaxParticipantsText(PAID_MAX_PARTICIPANTS)} highlighted />
                <FeatureItem text={getMaxMeetingsText(PAID_MAX_ACTIVE_MEETINGS)} highlighted />
                <FeatureItem text={getMaxMeetingsPerDayText('unlimited')} highlighted />
                <FeatureItem text={getMeetMeetingRecordingText()} highlighted />
            </>
        ) : (
            <>
                <FeatureItem text={getMeetingMaxLengthText('free')} highlighted />
                <FeatureItem text={getMaxParticipantsText(FREE_MAX_PARTICIPANTS)} highlighted />
                <FeatureItem text={getMaxMeetingsText(FREE_MAX_ACTIVE_MEETINGS)} highlighted />
                <FeatureItem text={getMaxMeetingsPerDayText(FREE_MAX_MEETINGS_PER_DAY)} highlighted />
            </>
        );
    return (
        <div className="px-8">
            <ul className="unstyled m-0 flex flex-column gap-2">{features}</ul>
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
                <LogoIconShape border={selectedPlan.name === PLANS.FREE}>
                    <img
                        src={selectedPlan.name === PLANS.FREE ? planFreeLogo : planMeetProfessionalLogo}
                        alt=""
                        className="w-full"
                    />
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

interface PricingFooterProps {
    checkoutView: CheckoutView;
}

const PricingFooter = ({ checkoutView }: PricingFooterProps) => {
    const { checkoutData } = checkoutView;

    const showDivider = checkoutData.isPaidPlan && checkoutData.checkoutUi.cycle !== CYCLE.MONTHLY;
    const divider = showDivider && <hr className="my-4 bg-weak" />;

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-8 pt-5 gap-2">
                {checkoutView.render('billingCycle')}
                {checkoutView.render('taxInclusive')}
                {checkoutView.render('discount')}
                {divider}
                {
                    // maybe remove?
                    checkoutView.render('planAmountWithDiscount')
                }
                {checkoutView.render('taxExclusive')}
                {checkoutView.render('amountDue')}
            </div>
        </footer>
    );
};

export const PricingCard = ({ step }: { step: PricingStep }) => {
    const payments = usePaymentOptimistic();
    const { options } = payments;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const cycleOptions = [
        { text: c('Signup').t`Monthly`, value: CYCLE.MONTHLY },
        { text: c('Signup').t`Yearly`, value: CYCLE.YEARLY },
    ];

    const checkoutView = createCheckoutView(
        {
            planIDs: options.planIDs,
            plansMap: payments.plansMap,
            checkResult: options.checkResult,
            app: APPS.PROTONMEET,
            paymentForbiddenReason: { forbidden: false },
        },
        (headless) => ({
            members: () => null,
            addons: () => null,
            planAmount: () => null,
            discount: (item) => (
                <div className="flex justify-space-between gap-2">
                    {hasFullCheckoutDetails ? (
                        <SaveBadge savePercentage={item.discountPercent} />
                    ) : (
                        <SkeletonLoader width="5rem" height="1.25rem" />
                    )}
                    {hasFullCheckoutDetails ? (
                        <Price key="price" currency={item.currency} className="text-strike" data-testid="discountPrice">
                            {item.withoutDiscountPerCycle}
                        </Price>
                    ) : (
                        <SkeletonLoader width="5rem" height="1.25rem" />
                    )}
                </div>
            ),
            proration: () => null,
            unusedCredit: () => null,
            coupon: () => null,
            credit: () => null,
            gift: () => null,
            planAmountWithDiscount: (item) => (
                <div className="flex justify-space-between gap-2">
                    <span>{c('Payments').t`Net amount`}</span>
                    <Price key="price" currency={item.currency} data-testid="netAmount">
                        {item.planAmountWithDiscount}
                    </Price>
                </div>
            ),
            taxExclusive: (item) => (
                <div className="flex justify-space-between gap-2" data-testid="tax">
                    <span>{item.taxRateElement}</span>
                    <span>{item.taxAmountElement}</span>
                </div>
            ),
            taxInclusive: (item) => {
                if (step === 'payment') {
                    return (
                        <div className="flex justify-space-between gap-2" data-testid="tax">
                            <span>{item.taxRateElement}</span>
                            <span>{item.taxAmountElement}</span>
                        </div>
                    );
                }
            },
            nextBilling: () => null,
            amountDue: (item) => {
                let totalContent: ReactNode;
                if (!headless.isPaidPlan) {
                    totalContent = <span data-testid="totalFree">{c('Signup').t`Free`}</span>;
                } else if (hasFullCheckoutDetails) {
                    totalContent = (
                        <Price
                            key="price"
                            data-testid="totalPrice"
                            currency={item.currency}
                            suffix={
                                item.cycle === CYCLE.MONTHLY && (
                                    <span className="text-sm color-weak">{c('Suffix').t`/month`}</span>
                                )
                            }
                        >
                            {item.amountDue}
                        </Price>
                    );
                } else {
                    totalContent = <SkeletonLoader width="6.5rem" height="1.4rem" />;
                }
                return (
                    <div className="flex justify-space-between gap-2 text-lg">
                        <span className="text-semibold">{c('Signup').t`Total`}</span>
                        <span className="text-semibold">{totalContent}</span>
                    </div>
                );
            },
            renewalNotice: (item) => {
                if (step === 'payment' && hasFullCheckoutDetails) {
                    return <div className="text-sm color-weak">{item.content}</div>;
                }
            },

            vatReverseCharge: (item) => {
                if (step === 'payment' && hasFullCheckoutDetails) {
                    return <div className="text-sm color-weak mt-2">{item.text}</div>;
                }
            },

            billingCycle: (item) => {
                if (step === 'payment') {
                    return (
                        <div className="flex justify-space-between gap-2">
                            <span>{c('Signup').t`Billing Cycle`}</span>
                            <CycleSelector
                                unstyled
                                className="w-auto color-primary"
                                cycle={item.cycle}
                                options={cycleOptions}
                                mode="select-two"
                                onSelect={(cycle) => {
                                    if (cycle === 'lifetime') {
                                        return;
                                    }
                                    void payments.selectCycle(cycle);
                                }}
                            />
                        </div>
                    );
                }
            },
        })
    );

    const discountItem = checkoutView.getItem('discount');
    const showCouponBanner = hasFullCheckoutDetails && discountItem.visible && discountItem.couponDiscount !== 0;
    const couponBanner = showCouponBanner && (
        <div className="meet-signup-pricing-card-top w-full shadow-raised shadow-color-primary bg-norm mb-1">
            <div className="meet-signup-pricing-card-top-content">
                <div className="flex items-center gap-2 px-8 py-4 fade-in">
                    <IcBagPercentFilled className="shrink-0 color-primary" />
                    <span className="text-semibold" data-testid="discountBanner">{c('Signup')
                        .t`Promo applied – ${discountItem.discountPercent}% off`}</span>
                </div>
            </div>
        </div>
    );

    return (
        <section className={clsx('meet-signup-pricing-card w-full flex flex-column')}>
            {couponBanner}
            <div className="meet-signup-pricing-card-inner fade-in w-full flex flex-column shadow-raised shadow-color-primary gap-8 py-8 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter checkoutView={checkoutView} />
            </div>
            {(checkoutView.getItem('renewalNotice').visible || checkoutView.getItem('vatReverseCharge').visible) && (
                <div className="w-full text-center mt-8">
                    {checkoutView.render('renewalNotice')}
                    {checkoutView.render('vatReverseCharge')}
                </div>
            )}
        </section>
    );
};
