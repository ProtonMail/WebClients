import type { ModalOwnProps } from '@proton/components/components';

import { Modal } from '../../../atoms';
import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

interface Props extends ModalOwnProps {
    email: string;
    textContent: string;
    onSendInvite: (email: string) => void;
    loading?: boolean;
}

export const WalletNotFoundErrorModal = ({ email, onSendInvite, textContent, loading, ...rest }: Props) => {
    return (
        <Modal className="wallet-not-found-dropdown" {...rest}>
            <WalletNotFoundErrorContent
                onSendInvite={onSendInvite}
                email={email}
                textContent={textContent}
                loading={loading}
            />
        </Modal>
    );
};
