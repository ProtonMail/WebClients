import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/wallet/wallet-paper-plane.jpg';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';

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
                <div className="flex items-center flex-column mb-4">
                    <div className="shrink-0 mb-4">
                        <img src={walletSendingPlane} alt="" />
                    </div>
                    <div className="flex flex-column items-center">
                        <span className="block text-4xl text-semibold text-center">{c('Wallet invite')
                            .t`Invitation sent to ${email}`}</span>
                    </div>
                </div>

                <ModalParagraph>
                    <p>{c('Wallet invite')
                        .t`Please let them know to check their email and follow the instruction to set up their ${WALLET_APP_NAME} with Bitcoin via Email.`}</p>
                    <p>{c('Wallet invite').t`Thank you for supporting ${WALLET_APP_NAME}!`}</p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
