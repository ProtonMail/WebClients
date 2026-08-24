import { useSubscription } from '@proton/account/subscription/hooks';
import { isPaidSubscription } from '@proton/payments/core/type-guards';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import PassLaunchOfferDowngradeModal from '../../PassLaunchOfferDowngradeModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const usePassLaunchOfferStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [subscription] = useSubscription();
    const [passLaunchOfferModal, showPassLaunchOfferModal] = useModalTwoPromise();

    const modal = isPaidSubscription(subscription)
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
