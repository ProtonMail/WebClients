import ModalTwo from '@proton/components/components/modalTwo/Modal';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { SUBSCRIPTION_STEPS } from '../constants';
import type { PostSubscriptionFlowName } from './interface';
import postSubscriptionConfig from './postSubscriptionConfig';

interface PostSubscriptionModalProps extends ModalStateProps {
    name: PostSubscriptionFlowName | null;
    step: SUBSCRIPTION_STEPS;
}

const PostSubscriptionModal = ({ name, step, ...modalProps }: PostSubscriptionModalProps) => {
    const config = name ? postSubscriptionConfig[name] : null;
    if (!config) {
        return null;
    }

    return (
        <ModalTwo {...modalProps} className="modal-two--twocolors">
            <config.modal onClose={modalProps.onClose} step={step} />
        </ModalTwo>
    );
};

export default PostSubscriptionModal;
