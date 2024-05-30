import { ModalOwnProps } from '@proton/components/components';

import { Modal } from '../../../atoms';
import { WalletNotFoundErrorContent } from './WalletNotFoundErrorContent';

interface Props extends ModalOwnProps {
    email: String;
}

export const WalletNotFoundErrorModal = ({ email, ...rest }: Props) => {
    return (
        <Modal className="wallet-not-found-dropdown" {...rest}>
            <WalletNotFoundErrorContent email={email} />
        </Modal>
    );
};
