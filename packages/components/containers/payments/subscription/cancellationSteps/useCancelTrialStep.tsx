import type { Subscription } from '@proton/payments/core/subscription/interface';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import CancelTrialModal from '../CancelTrialModal';
import type { SubscriptionCancellationStep, SubscriptionCancellationStepConfig } from './types';

export const useCancelTrialStep = ({ canShow }: SubscriptionCancellationStepConfig): SubscriptionCancellationStep => {
    const [cancelTrialModal, showCancelTrialModal] = useModalTwoPromise<{ subscription: Subscription }>();

    const modal = cancelTrialModal(({ onResolve, onReject, ...props }) => {
        return <CancelTrialModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async (subscription: Subscription) => {
        if (!(await canShow(subscription))) {
            return;
        }

        await showCancelTrialModal({ subscription });
    };

    return { modal, show };
};
