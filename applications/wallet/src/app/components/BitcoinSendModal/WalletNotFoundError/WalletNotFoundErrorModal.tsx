import { ModalOwnProps } from '@proton/components/components';

import { Modal } from '../../../atoms';
import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

interface Props extends ModalOwnProps {
    email: string;
    onSendInvite: (email: string) => void;
}

export const WalletNotFoundErrorModal = ({ email, onSendInvite, ...rest }: Props) => {
    return (
        <Modal className="wallet-not-found-dropdown" {...rest}>
            <WalletNotFoundErrorContent onSendInvite={onSendInvite} email={email} />
        </Modal>
    );
};
