import { c } from 'ttag';

import { ModalOwnProps } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/illustrations/wallet-sending-plane.svg';
import clsx from '@proton/utils/clsx';

import { Button, Modal } from '../../../atoms';
import { SubTheme } from '../../../utils';

export interface TransactionSendConfirmationModalOwnProps {
    theme?: SubTheme;
    onClickDone: () => void;
    onClickInviteAFriend: () => void;
}

type Props = ModalOwnProps & TransactionSendConfirmationModalOwnProps;

export const TransactionSendConfirmationModal = ({
    theme,
    onClickDone,
    onClickInviteAFriend,
    ...modalProps
}: Props) => {
    return (
        <Modal className={theme} {...modalProps} hasClose>
            <div className="flex flex-column items-center">
                <img src={walletSendingPlane} alt="" />
                <h1 className={clsx('text-bold text-break text-2xl')}>{c('Wallet send').t`Money is on the way`}</h1>
                <p className="text-center color-weak">{c('Wallet send')
                    .t`Your transaction has been broadcasted to the Bitcoin network. It may take around one hour for the network to confirm the transaction.`}</p>

                <p className="text-center color-weak mb-8">{c('Wallet send')
                    .t`While you are waiting, invite your family and friends to ${WALLET_APP_NAME} so you can all send Bitcoin via Email.`}</p>

                <Button fullWidth className="block mt-8 mb-2" shape="solid" color="norm" onClick={() => onClickDone()}>
                    {c('Wallet setup').t`Done`}
                </Button>

                <Button
                    fullWidth
                    className="block text-semibold"
                    shape="ghost"
                    color="weak"
                    onClick={() => onClickInviteAFriend()}
                >{c('Wallet setup').t`Invite a friend`}</Button>
            </div>
        </Modal>
    );
};
