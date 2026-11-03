import type { Subscription } from '@proton/payments/core/subscription/interface';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import InAppPurchaseModal from '../InAppPurchaseModal';
import type { SubscriptionCancellationStep, SubscriptionCancellationStepConfig } from './types';

export const useInAppPurchaseStep = ({ canShow }: SubscriptionCancellationStepConfig): SubscriptionCancellationStep => {
    const [inAppPurchaseModal, showInAppPurchaseModal] = useModalTwoPromise<{ subscription: Subscription }>();

    const modal = inAppPurchaseModal(({ onReject, ...props }) => {
        return <InAppPurchaseModal {...props} onClose={onReject} />;
    });

    const show = async (subscription: Subscription) => {
        if (!(await canShow(subscription))) {
            return;
        }

        await showInAppPurchaseModal({ subscription });
    };

    return { modal, show };
};
