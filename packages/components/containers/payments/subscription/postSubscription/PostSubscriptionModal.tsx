import { ModalTwo } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { PostSubscriptionModalName } from './interface';
import postSubscriptionModalsConfig from './modals/postSubscriptionModalsConfig';

interface PostSubscriptionModalProps {
    name: PostSubscriptionModalName | null;
    modalProps: ModalStateProps;
}

const PostSubscriptionModal = ({ name, modalProps }: PostSubscriptionModalProps) => {
    const config = name ? postSubscriptionModalsConfig[name] : null;
    if (!config) {
        return null;
    }

    return (
        <ModalTwo {...modalProps} className="modal-two--twocolors">
            <config.component onClose={modalProps.onClose} />
        </ModalTwo>
    );
};

export default PostSubscriptionModal;
