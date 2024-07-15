import { c } from 'ttag';

import { ModalOwnProps, Prompt } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';

import { Button } from '../../atoms';

interface InviteSentConfirmModalOwnProps {
    email: string;
}

type Props = ModalOwnProps & InviteSentConfirmModalOwnProps;

export const InviteSentConfirmModal = ({ email, ...modalProps }: Props) => {
    return (
        <Prompt
            {...modalProps}
            buttons={
                <Button fullWidth size="large" shape="solid" color="norm" onClick={modalProps.onClose}>{c('Wallet')
                    .t`Close`}</Button>
            }
        >
            <div className="flex flex-column">
                <div className="flex items-center flex-column">
                    <div className="shrink-0 mb-4">
                        <img src={walletSendingPlane} alt="" />
                    </div>
                    <div className="flex flex-column items-center">
                        <span className="block text-4xl text-semibold text-center">{c('Wallet invite')
                            .t`Invitation sent to ${email}`}</span>
                    </div>
                </div>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Please let them know to check their email and follow the instruction to set up their ${WALLET_APP_NAME} with Bitcoin via Email.`}</p>

                <p className="my-4 text-center color-weak">{c('Wallet invite')
                    .t`Thank you for supporting ${WALLET_APP_NAME}!`}</p>
            </div>
        </Prompt>
    );
};
