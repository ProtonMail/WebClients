import { useSubscription } from '@proton/account/subscription/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import InAppPurchaseModal from '../InAppPurchaseModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useInAppPurchaseStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [subscription] = useSubscription();
    const [inAppPurchaseModal, showInAppPurchaseModal] = useModalTwoPromise();

    const modal = subscription
        ? inAppPurchaseModal(({ onReject, ...props }) => {
              return <InAppPurchaseModal {...props} subscription={subscription} onClose={onReject} />;
          })
        : null;

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showInAppPurchaseModal();
    };

    return { modal, show };
};
