import { useSubscription } from '@proton/account/subscription/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import PassLaunchOfferDowngradeModal from '../../PassLaunchOfferDowngradeModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const usePassLaunchOfferStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [subscription] = useSubscription();
    const [passLaunchOfferModal, showPassLaunchOfferModal] = useModalTwoPromise();

    const modal = subscription
        ? passLaunchOfferModal(({ onResolve, onReject, ...props }) => {
              return (
                  <PassLaunchOfferDowngradeModal
                      {...props}
                      subscription={subscription}
                      onConfirm={onResolve}
                      onClose={onReject}
                  />
              );
          })
        : null;

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showPassLaunchOfferModal();
    };

    return { modal, show };
};
