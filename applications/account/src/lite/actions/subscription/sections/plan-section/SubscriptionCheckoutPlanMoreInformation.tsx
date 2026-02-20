import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { canShowGiftCodeInput } from '@proton/components/containers/payments/subscription/modal-components/helpers/canShowGiftCodeInput';
import { show30DaysMoneyBackGuarantee } from '@proton/components/containers/payments/subscription/modal-components/helpers/show30DaysMoneyBackGuarantee';
import { IcArrowsSwitch } from '@proton/icons/icons/IcArrowsSwitch';
import { isSubscriptionCheckForbiddenWithReason } from '@proton/payments';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import type { CheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import noop from '@proton/utils/noop';

import SubscriptionCheckoutPlanGiftCodeInput from './SubscriptionCheckoutPlanGiftCodeInput';
import SubscriptionCheckoutPlanIncludedFeaturesModal from './SubscriptionCheckoutPlanIncludedFeaturesModal';

const SubscriptionCheckoutPlanMoreInformation = ({ checkoutView }: { checkoutView: CheckoutView }) => {
    const [showGiftCodeForm, setShowGiftCodeForm] = useState(false);
    const [planInformationModal, setPlanInformationModal, renderPlanInformationModal] = useModalState();
    const { checkoutUi, selectedPlan, subscription, plansMap, loading, selectCoupon, couponConfig } = usePayments();
    const { cycle, planIDs, checkResult } = checkoutUi;
    const { Coupon } = checkResult;

    // Hide Gift form when cycle changes
    useEffect(() => {
        if (!Coupon) {
            setShowGiftCodeForm(false);
        }
    }, [Coupon, cycle]);

    const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, planIDs, cycle);
    const hasGuarantee = show30DaysMoneyBackGuarantee({
        planIDs,
        plansMap,
        subscription,
        selectedPlan,
        paymentForbiddenReason,
    });

    const handleGiftCodeChange = async (code: string) => {
        return selectCoupon(code)
            .then(() => setShowGiftCodeForm(false))
            .catch(noop);
    };

    const showGiftCodeLink =
        !showGiftCodeForm && canShowGiftCodeInput({ paymentForbiddenReason, couponConfig, checkResult });

    const openPlanFeatureModal = () => {
        checkoutTelemetry.subscriptionContainer.reportPlanDescriptionInteraction({ action: 'expand' });
        setPlanInformationModal(true);
    };
    return (
        <>
            <div className="flex flex-column gap-2">
                {hasGuarantee && (
                    <div className="color-success text-semibold">
                        <IcArrowsSwitch className="align-text-bottom mr-1" />
                        <span>{c('Info').t`30-day money-back guarantee`}</span>
                    </div>
                )}
                {checkoutView.render('renewalNotice')}
                <div className="flex gap-1 items-center">
                    <Button onClick={() => openPlanFeatureModal()} shape="underline" size="tiny" color="norm">
                        {c('Link').t`What's included in your plan`}
                    </Button>
                    {showGiftCodeLink && (
                        <>
                            <span className="color-hint text-xs">•</span>
                            <Button
                                onClick={() => setShowGiftCodeForm(true)}
                                shape="underline"
                                size="tiny"
                                color="norm"
                            >{c('Link').t`Add a gift code`}</Button>
                        </>
                    )}
                </div>
                {showGiftCodeForm && (
                    <SubscriptionCheckoutPlanGiftCodeInput loading={loading} onApply={handleGiftCodeChange} />
                )}
            </div>
            {renderPlanInformationModal && <SubscriptionCheckoutPlanIncludedFeaturesModal {...planInformationModal} />}
        </>
    );
};

export default SubscriptionCheckoutPlanMoreInformation;
