import { c } from 'ttag';

import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';

import { TransactionData } from '../../hooks/useWalletTransactions';
import { OnchainTransactionDetails, OnchainTransactionDetailsProps } from '../OnchainTransactionDetails';

interface Props {
    isOpen: boolean;
    data?: Omit<OnchainTransactionDetailsProps, 'onUpdateLabel'>;
    onClose: () => void;
    onUpdateLabel: (label: string, tx: TransactionData) => void;
}

export const OnchainTransactionDetailsModal = ({ isOpen, data, onClose, onUpdateLabel }: Props) => {
    return (
        <ModalTwo open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <ModalHeader title={c('Wallet Transaction').t`Transaction details`} />
            <ModalContent>
                {data && (
                    <OnchainTransactionDetails {...data} onUpdateLabel={(label) => onUpdateLabel(label, data.tx)} />
                )}
            </ModalContent>
        </ModalTwo>
    );
};
