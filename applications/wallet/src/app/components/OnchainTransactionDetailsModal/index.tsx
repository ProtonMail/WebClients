import { c } from 'ttag';

import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

import { OnchainTransactionDetails, OnchainTransactionDetailsProps } from '../OnchainTransactionDetails';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data?: OnchainTransactionDetailsProps;
}

export const OnchainTransactionDetailsModal = ({ isOpen, onClose, data }: Props) => {
    return (
        <ModalTwo open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <ModalHeader title={c('Wallet Transaction').t`Transaction details`} />
            <ModalContent>{data && <OnchainTransactionDetails {...data} />}</ModalContent>
        </ModalTwo>
    );
};
