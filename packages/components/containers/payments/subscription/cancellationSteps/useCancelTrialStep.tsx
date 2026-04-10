import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';

import CancelTrialModal from '../CancelTrialModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useCancelTrialStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [cancelTrialModal, showCancelTrialModal] = useModalTwoPromise();

    const modal = cancelTrialModal(({ onResolve, onReject, ...props }) => {
        return <CancelTrialModal {...props} onConfirm={onResolve} onClose={onReject} />;
    });

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showCancelTrialModal();
    };

    return { modal, show };
};
