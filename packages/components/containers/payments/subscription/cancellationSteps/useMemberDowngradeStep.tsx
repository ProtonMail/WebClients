import { useOrganization } from '@proton/account/organization/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import MemberDowngradeModal from '../../MemberDowngradeModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useMemberDowngradeStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [organization] = useOrganization();
    const [memberDowngradeModal, showMemberDowngradeModal] = useModalTwoPromise();

    const modal = organization
        ? memberDowngradeModal(({ onResolve, onReject, ...props }) => {
              return (
                  <MemberDowngradeModal
                      organization={organization}
                      {...props}
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

        await showMemberDowngradeModal();
    };

    return { modal, show };
};
