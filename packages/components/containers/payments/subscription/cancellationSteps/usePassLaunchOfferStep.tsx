import type { Subscription } from '@proton/payments/core/subscription/interface';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import PassLaunchOfferDowngradeModal from '../../PassLaunchOfferDowngradeModal';
import type { SubscriptionCancellationStep, SubscriptionCancellationStepConfig } from './types';

export const usePassLaunchOfferStep = ({
    canShow,
}: SubscriptionCancellationStepConfig): SubscriptionCancellationStep => {
    const [passLaunchOfferModal, showPassLaunchOfferModal] = useModalTwoPromise<{ subscription: Subscription }>();

    const modal = passLaunchOfferModal(({ onResolve, onReject, ...props }) => {
        return <PassLaunchOfferDowngradeModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async (subscription: Subscription) => {
        if (!(await canShow(subscription))) {
            return;
        }

        await showPassLaunchOfferModal({ subscription });
    };

    return { modal, show };
};
