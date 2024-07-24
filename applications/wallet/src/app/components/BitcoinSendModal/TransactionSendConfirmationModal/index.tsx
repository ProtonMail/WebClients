import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components/components';
import { Prompt } from '@proton/components/components';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendingPlane from '@proton/styles/assets/img/wallet/wallet-paper-plane.png';
import clsx from '@proton/utils/clsx';

import { Button } from '../../../atoms';
import type { SubTheme } from '../../../utils';

interface TransactionSendConfirmationModalOwnProps {
    theme?: SubTheme;
    inviterAddressID?: String;
    onClickDone: () => void;
    onClickInviteAFriend: () => void;
}

type Props = ModalOwnProps & TransactionSendConfirmationModalOwnProps;

export const TransactionSendConfirmationModal = ({
    theme,
    inviterAddressID,
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
                    onClick={() => onClickDone()}
                >
                    {c('Wallet setup').t`Done`}
                </Button>,
                <Tooltip
                    title={
                        inviterAddressID
                            ? undefined
                            : c('Tooltip')
                                  .t`You need to have an email linked to your wallet account to be able to send invite`
                    }
                >
                    <Button
                        fullWidth
                        className="block text-semibold"
                        shape="ghost"
                        color="weak"
                        size="large"
                        disabled={!inviterAddressID}
                        onClick={() => onClickInviteAFriend()}
                    >{c('Wallet setup').t`Invite a friend`}</Button>
                </Tooltip>,
            ]}
        >
            <div className="flex flex-column items-center">
                <img src={walletSendingPlane} alt="" />
                <h1 className={clsx('text-bold text-break text-2xl')}>{c('Wallet send')
                    .t`Your Bitcoin is on its way!`}</h1>
                <p className="text-center color-weak">{c('Wallet send')
                    .t`Your transaction has been broadcasted to the Bitcoin network. It may take around one hour for the network to confirm the transaction.`}</p>

                <p className="text-center color-weak">{c('Wallet send')
                    .t`While you are waiting, invite your family and friends to ${WALLET_APP_NAME} so you can all send Bitcoin via Email.`}</p>
            </div>
        </Prompt>
    );
};
