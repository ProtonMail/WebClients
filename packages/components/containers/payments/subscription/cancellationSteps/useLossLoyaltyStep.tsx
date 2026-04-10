import { useOrganization } from '@proton/account/organization/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import LossLoyaltyModal from '../../LossLoyaltyModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useLossLoyaltyStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [organization] = useOrganization();
    const [lossLoyaltyModal, showLossLoyaltyModal] = useModalTwoPromise();

    const modal = organization
        ? lossLoyaltyModal(({ onResolve, onReject, ...props }) => {
              return (
                  <LossLoyaltyModal organization={organization} {...props} onConfirm={onResolve} onClose={onReject} />
              );
          })
        : null;

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showLossLoyaltyModal();
    };

    return { modal, show };
};
