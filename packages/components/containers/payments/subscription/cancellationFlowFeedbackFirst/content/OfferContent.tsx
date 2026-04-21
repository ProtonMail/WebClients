import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Price from '@proton/components/components/price/Price';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLAN_NAMES } from '@proton/payments';

import FreePlanCard from '../components/FreePlanCard';
import OfferPlanCard from '../components/OfferPlanCard';
import { getOfferConfig } from '../config/offerConfig';
import type { OfferCheckResult } from '../hooks/useCancellationOffer';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
    offerData: OfferCheckResult;
}

export const OfferContent = ({ onKeepPlan, onContinueCancelling, offerData }: Props) => {
    const [openSubscriptionModal, isLoading] = useSubscriptionModal();
    const { checkout, planName, cycle, currency, coupon } = offerData;
    const { update } = useFeature(FeatureCode.CanUseFeedbackFirstCancellationOffer);

    if (!planName) {
        return null;
    }

    const config = getOfferConfig(planName);

    if (!config || !checkout) {
        return null;
    }

    const isYearly = cycle === CYCLE.YEARLY;
    const planDisplayName = PLAN_NAMES[planName];
    const cycleLabel = isYearly ? c('Label').t`Yearly` : c('Label').t`Monthly`;

    const perMonth = c('Suffix').t`/month`;
    const perYear = c('Suffix').t`/year`;

    const discountedMonthly = Math.floor(checkout.withDiscountPerMonth);
    const normalMonthly = checkout.withoutDiscountPerMonth;

    const priceElement = (amount: number, suffix?: string) => {
        return (
            <Price currency={currency} suffix={suffix} isDisplayedInSentence>
                {amount}
            </Price>
        );
    };

    const yearlyDiscountedPrice = priceElement(checkout.withDiscountPerCycle, perYear);
    const yearlyRenewalPrice = priceElement(checkout.withoutDiscountPerCycle, perYear);
    const monthlyDiscountedPrice = priceElement(discountedMonthly, perMonth);
    const monthlyRenewalPrice = priceElement(normalMonthly, perMonth);

    const getBillingFootnote = () => {
        if (isYearly) {
            return c('Info')
                .jt`Billed at ${yearlyDiscountedPrice} for the first 12 months, renews at ${yearlyRenewalPrice}.`;
        }

        return c('Info')
            .jt`Billed at ${monthlyDiscountedPrice} for the first 6 months, renews at ${monthlyRenewalPrice}.`;
    };

    const subtitle = isYearly
        ? c('Subtitle').t`Save 50% for 1 year, and keep full access`
        : c('Subtitle').t`Save 50% for 6 months, and keep full access`;

    const handleClaimOffer = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: planName,
            cycle,
            coupon,
            disablePlanSelection: true,
            disableCycleSelector: true,
            metrics: { source: 'upsells' },
            onSubscribed: () => {
                void update(false);
                onKeepPlan();
            },
        });
    };

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Lower your cost without losing features`} titleClassName="text-4xl" />
            <ModalTwoContent>
                <p className="mb-6 color-weak">{subtitle}</p>
                <div className="flex gap-4">
                    <OfferPlanCard
                        planDisplayName={planDisplayName}
                        features={config.features}
                        currency={currency}
                        discountedMonthly={discountedMonthly}
                        normalMonthly={normalMonthly}
                        cycleLabel={cycleLabel}
                        billingFootnote={getBillingFootnote()}
                        onClaimOffer={handleClaimOffer}
                        isLoading={isLoading}
                    />
                    <FreePlanCard
                        features={config.freeFeatures}
                        currency={currency}
                        onSwitchToFree={onContinueCancelling}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Action').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Action').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
