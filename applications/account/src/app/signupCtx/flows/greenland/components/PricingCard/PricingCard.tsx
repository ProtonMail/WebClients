import type { ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { MailLogo, Price, SkeletonLoader } from '@proton/components';
import { IcBagPercentFilled } from '@proton/icons/icons/IcBagPercentFilled';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { type CheckoutView, createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS, BRAND_NAME, DARK_WEB_MONITORING_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import humanSize, { type SizeUnits } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

import { getSecureStorageString } from '../../helpers/i18n';
import FeatureItem from '../FeatureItem/FeatureItem';
import { SaveBadge } from '../SaveBadge/SaveBadge';

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

const PricingFooter = ({ checkoutView }: { checkoutView: CheckoutView }) => {
    const payments = usePaymentOptimistic();
    const { checkoutUi, selectedPlan } = payments;
    const isPaidPlan = selectedPlan.name !== PLANS.FREE;

    const showDivider = isPaidPlan && checkoutUi.cycle !== CYCLE.MONTHLY;
    const divider = showDivider && <hr className="my-4 bg-weak" />;

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-8 pt-5 gap-2">
                {checkoutView.render('taxInclusive')}
                {checkoutView.render('billingCycle')}
                {checkoutView.render('discount')}
                {divider}
                {checkoutView.render('amountDue')}
            </div>
        </footer>
    );
};

export const PricingCard = () => {
    const payments = usePaymentOptimistic();
    const { options } = payments;

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const checkoutView = createCheckoutView(
        {
            planIDs: options.planIDs,
            plansMap: payments.plansMap,
            checkResult: options.checkResult,
            app: APPS.PROTONMAIL,
            paymentForbiddenReason: { forbidden: false },
        },
        (headless) => ({
            addons: () => null,
            amountDue: (item) => {
                const amountDueElement = (() => {
                    if (!headless.isPaidPlan) {
                        return <span data-testid="totalFree">{c('Signup').t`Free`}</span>;
                    }

                    return hasFullCheckoutDetails ? (
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
                    ) : (
                        <SkeletonLoader width="6.5rem" height="1.4rem" />
                    );
                })();

                return (
                    <div className="flex justify-space-between gap-2 text-lg">
                        <span className="text-semibold">{c('Signup').t`Total`}</span>
                        <span className="text-semibold">{amountDueElement}</span>
                    </div>
                );
            },
            billingCycle: (item) => (
                <div className="flex justify-space-between gap-2">
                    <span>{c('Signup').t`Billing Cycle`}</span>
                    <span data-testid="billingCycle">{item.shortText}</span>
                </div>
            ),
            coupon: () => null,
            credit: () => null,
            gift: () => null,
            proration: () => null,
            planAmount: () => null,
            planAmountWithDiscount: () => null,
            taxExclusive: () => null,
            taxInclusive: (item) => (
                <div className="flex justify-space-between gap-2" data-testid="tax">
                    <span>{item.taxRateElement}</span>
                    <span>{item.taxAmountElement}</span>
                </div>
            ),
            nextBilling: () => null,
            unusedCredit: () => null,
            members: () => null,
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
            renewalNotice: (item) => <div className="w-full text-center text-sm color-weak mt-8">{item.content}</div>,
        })
    );

    const discountItem = checkoutView.getItem('discount');
    const couponBanner = hasFullCheckoutDetails && discountItem.visible && (
        <div className="greenland-signup-pricing-card-top w-full shadow-raised bg-norm mb-1">
            <div className="greenland-signup-pricing-card-top-content">
                <div className="flex items-center gap-2 px-8 py-4 fade-in">
                    <IcBagPercentFilled className="shrink-0 color-primary" />
                    <span className="text-semibold" data-testid="discountBanner">{c('Signup')
                        .t`Promo applied – ${discountItem.discountPercent}% off`}</span>
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
                <PricingFooter checkoutView={checkoutView} />
            </div>
            {checkoutView.render('renewalNotice')}
        </section>
    );
};
