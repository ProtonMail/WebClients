import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import type { ModalProps } from '../../../../components/modalTwo/Modal';
import ModalTwo from '../../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../../components/modalTwo/ModalContent';

const CancelSubscriptionLoadingModal = (props: ModalProps) => {
    return (
        <ModalTwo {...props} data-testid="cancel-subscription-loading">
            <ModalTwoContent
                className="text-center h-custom flex flex-column items-center justify-center"
                style={{ '--h-custom': '18rem' }}
            >
                <CircleLoader size="large" />
                <p>{c('State').t`Canceling your subscription, please wait`}</p>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default CancelSubscriptionLoadingModal;
