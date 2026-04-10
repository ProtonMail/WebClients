import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import { DiscountWarningModal } from '../PlanLossWarningModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useDiscountWarningStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [discountWarningModal, showDiscountWarningModal] = useModalTwoPromise();

    const modal = discountWarningModal(({ onResolve, onReject, ...props }) => {
        return <DiscountWarningModal {...props} type="downgrade" onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showDiscountWarningModal();
    };

    return { modal, show };
};
