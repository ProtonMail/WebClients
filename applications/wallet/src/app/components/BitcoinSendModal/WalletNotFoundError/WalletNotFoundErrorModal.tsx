import type { ModalOwnProps } from '@proton/components/components';

import { Modal } from '../../../atoms';
import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

interface Props extends ModalOwnProps {
    email: string;
    textContent: string;
    onSendInvite: (email: string) => void;
}

export const WalletNotFoundErrorModal = ({ email, onSendInvite, textContent, ...rest }: Props) => {
    return (
        <Modal className="wallet-not-found-dropdown" {...rest}>
            <WalletNotFoundErrorContent onSendInvite={onSendInvite} email={email} textContent={textContent} />
        </Modal>
    );
};
