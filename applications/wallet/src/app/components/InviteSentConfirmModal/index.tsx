import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';

import { Button, Modal } from '../../atoms';

export interface InviteSentConfirmModalOwnProps {
    email: string;
}

type Props = ModalOwnProps & InviteSentConfirmModalOwnProps;

export const InviteSentConfirmModal = ({ email, ...modalProps }: Props) => {
    return (
        <Modal {...modalProps}>
            <div className="flex flex-column">
                <div className="flex items-center flex-column">
                    <div className="no-shrink mb-4">
                        <img src={walletSendingPlane} alt={''} />
                    </div>
                    <div className="flex flex-column items-center">
                        <span className="block text-4xl text-semibold text-center">{c('Wallet invite')
                            .t`Invitation sent to ${email}`}</span>
                    </div>
                </div>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Please let them know to check their email and follow the instruction to set up their ${WALLET_APP_NAME} with Bitcoin via Email`}</p>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Thank you for supporting ${WALLET_APP_NAME}!`}</p>

                <div className="w-full px-8 mt-12">
                    <Button
                        fullWidth
                        color="norm"
                        shape="solid"
                        onClick={() => {
                            modalProps.onClose?.();
                        }}
                    >{c('Wallet invite').t`Close`}</Button>
                </div>
            </div>
        </Modal>
    );
};
