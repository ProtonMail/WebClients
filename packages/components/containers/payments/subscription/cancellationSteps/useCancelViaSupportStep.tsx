import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import CancelSubscriptionViaSupportModal from '../cancelSubscriptionViaSupport/CancelSubscriptionViaSupportModal';
import type { CancellationStep, CancellationStepConfig } from './types';

export const useCancelViaSupportStep = ({ canShow }: CancellationStepConfig): CancellationStep => {
    const [cancelViaSupportModal, showCancelViaSupportModal] = useModalTwoPromise();

    const modal = cancelViaSupportModal(({ onResolve, onReject, ...props }) => {
        return <CancelSubscriptionViaSupportModal {...props} onClose={onResolve} />;
    });

    const show = async () => {
        if (!(await canShow())) {
            return;
        }

        await showCancelViaSupportModal();
    };

    return { modal, show };
};
