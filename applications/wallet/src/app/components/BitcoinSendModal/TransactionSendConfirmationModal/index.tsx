import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/wallet/wallet-paper-plane.jpg';
import clsx from '@proton/utils/clsx';

import { Button } from '../../../atoms';
import type { SubTheme } from '../../../utils';

interface TransactionSendConfirmationModalOwnProps {
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
        <Prompt
            className={theme}
            {...modalProps}
            buttons={[
                <Button
                    fullWidth
                    className="block"
                    size="large"
                    shape="solid"
                    color="norm"
                    onClick={() => onClickInviteAFriend()}
                >{c('Wallet setup').t`Invite a friend`}</Button>,
                <Button
                    fullWidth
                    className="block text-semibold"
                    shape="ghost"
                    color="weak"
                    size="large"
                    onClick={() => onClickDone()}
                >
                    {c('Wallet setup').t`Done`}
                </Button>,
            ]}
        >
            <div className="flex flex-column items-center">
                <img
                    className="h-custom w-custom"
                    src={walletSendingPlane}
                    alt=""
                    style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
                <h1 className={clsx('text-semibold text-break text-3xl')}>{c('Wallet send')
                    .t`Your Bitcoin is on its way!`}</h1>
                <p className="text-center color-weak mb-0">{c('Wallet send')
                    .t`Your transaction has been broadcasted to the Bitcoin network. It may take around one hour for the network to confirm the transaction.`}</p>

                <p className="text-center color-weak">{c('Wallet send')
                    .t`While you are waiting, invite your family and friends to ${WALLET_APP_NAME} so you can all send Bitcoin via Email.`}</p>
            </div>
        </Prompt>
    );
};
