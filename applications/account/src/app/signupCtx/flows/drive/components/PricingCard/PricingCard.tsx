import type { ReactNode } from 'react';

import { c } from 'ttag';

import { DriveLogo, Price, SkeletonLoader } from '@proton/components';
import { IcBagPercentFilled } from '@proton/icons/icons/IcBagPercentFilled';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { type CheckoutView, createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

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
                {checkoutView.render('taxInclusive')}
                {checkoutView.render('billingCycle')}
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

    const checkoutView = createCheckoutView(
        {
            planIDs: options.planIDs,
            plansMap: payments.plansMap,
            checkResult: options.checkResult,
            app: APPS.PROTONDRIVE,
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
                    return <div className="w-full text-center text-sm color-weak mt-8">{item.content}</div>;
                }
            },

            billingCycle: (item) => {
                if (step === 'payment' || item.cycle !== CYCLE.MONTHLY) {
                    return (
                        <div className="flex justify-space-between gap-2">
                            <span>{c('Signup').t`Billing Cycle`}</span>
                            <span data-testid="billingCycle">{item.shortText}</span>
                        </div>
                    );
                }
            },
        })
    );

    const discountItem = checkoutView.getItem('discount');
    const showCouponBanner = hasFullCheckoutDetails && discountItem.visible && discountItem.couponDiscount !== 0;
    const couponBanner = showCouponBanner && (
        <div className="drive-signup-pricing-card-top w-full shadow-raised bg-norm mb-1">
            <div className="drive-signup-pricing-card-top-content">
                <div className="flex items-center gap-2 px-8 py-4 fade-in">
                    <IcBagPercentFilled className="shrink-0 color-primary" />
                    <span className="text-semibold" data-testid="discountBanner">{c('Signup')
                        .t`Promo applied – ${discountItem.discountPercent}% off`}</span>
                </div>
            </div>
        </div>
    );

    return (
        <section className={clsx('drive-signup-pricing-card w-full flex flex-column')}>
            {couponBanner}
            <div className="drive-signup-pricing-card-inner fade-in w-full flex flex-column shadow-raised gap-8 py-8 bg-norm">
                <PricingHeader />
                <PricingFeatures />
                <PricingFooter checkoutView={checkoutView} />
            </div>
            {checkoutView.render('renewalNotice')}
        </section>
    );
};
