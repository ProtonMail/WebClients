import { c } from 'ttag';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalTwoPromiseHandlers } from '@proton/components/components/modalTwo/useModalTwo';
import type { PLANS } from '@proton/payments';
import type { FreePlanDefault, Plan, SubscriptionModel } from '@proton/shared/lib/interfaces';

import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';
import { UpsellModalPanel } from './panels/UpsellModalPanel';
import { useUpsellModal } from './useUpsellModal';

export interface FeedbackDowngradeData {
    Reason?: string;
    Feedback?: string;
    ReasonDetails?: string;
    Context?: 'vpn' | 'mail';
}

export type KeepSubscription = {
    status: 'kept';
};

export type UpsellResult = {
    status: 'cancelled' | 'kept' | 'upsold';
};

type PromiseHandlers = ModalTwoPromiseHandlers<UpsellResult>;

export type PlanProps = {
    freePlan: FreePlanDefault;
    plans: Plan[];
    subscription: SubscriptionModel;
    upsellPlanId: PLANS;
};

const UpsellModal = ({
    freePlan,
    onResolve,
    onClose,
    onReject,
    plans,
    subscription,
    upsellPlanId,
    ...rest
}: Omit<ModalProps, 'onSubmit'> & PlanProps & PromiseHandlers) => {
    const { sendUpsellModalCancelReport, sendUpsellModalCloseReport, sendUpsellModalUpsellReport } =
        useCancellationTelemetry();

    const {
        currency,
        downgradedPlanAmount,
        downgradedPlanName,
        freePlanFeatures,
        freePlanTitle,
        upsellPlanAmount,
        upsellPlanFeatures,
        upsellPlanName,
        upsellSavings,
    } = useUpsellModal({ freePlan, plans, subscription, upsellPlanId });

    const handleConfirmCancel = () => {
        sendUpsellModalCancelReport();
        onResolve({ status: 'cancelled' });
        onClose?.();
    };

    const handleUpsell = () => {
        sendUpsellModalUpsellReport();
        onResolve({ status: 'upsold' });
        onClose?.();
    };

    const handleKeepSubscription = () => {
        onResolve({ status: 'kept' });
        sendUpsellModalCloseReport();
        onClose?.();
    };

    return (
        <Modal onClose={handleKeepSubscription} size="xlarge" className="pb-4" {...rest}>
            <ModalHeader
                subline={c('Cancellation upsell')
                    .t`Try ${upsellPlanName} and retain access to all premium email and calendar features.`}
                title={c('Cancellation upsell').t`Save money with ${upsellPlanName}`}
            />
            <ModalContent>
                <div className="flex flex-column md:flex-row flex-nowrap justify-space-between items-stretch gap-6">
                    <UpsellModalPanel
                        currency={currency}
                        downgradedPlanAmount={downgradedPlanAmount}
                        downgradedPlanName={downgradedPlanName}
                        features={upsellPlanFeatures}
                        isUpsell={true}
                        onClick={handleUpsell}
                        planName={upsellPlanName}
                        upsellPlanAmount={upsellPlanAmount}
                        upsellSavings={c('Cancellation upsell').t`Save ${upsellSavings}`}
                    />
                    <UpsellModalPanel
                        features={freePlanFeatures}
                        isUpsell={false}
                        onClick={handleConfirmCancel}
                        planName={freePlanTitle}
                    />
                </div>
            </ModalContent>
        </Modal>
    );
};

export default UpsellModal;
