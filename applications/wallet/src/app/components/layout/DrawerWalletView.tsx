import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import DrawerView, { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';

import { IWasmSimpleTransactionArray } from '../../../pkg';
import { useOnchainWalletContext } from '../../contexts';
import { TransactionHistoryOverview } from '../TransactionHistoryOverview';

export const DrawerWalletView = () => {
    const { walletId } = useParams<{ walletId?: string }>();

    const { wallets } = useOnchainWalletContext();

    const transactions = useMemo(() => {
        if (walletId) {
            const wallet = wallets?.find(({ Wallet }) => Wallet.ID === walletId);
            return wallet?.accounts.flatMap(({ transactions }) => transactions);
        } else {
            const accounts = wallets?.flatMap(({ accounts }) => accounts);
            return accounts?.flatMap(({ transactions }) => transactions);
        }
    }, [walletId, wallets]);

    const tab: SelectedDrawerOption = {
        text: c('Title').t`Quick actions`,
        value: 'wallet-quick-actions',
    };

    return (
        <DrawerView tab={tab} id="drawer-app-proton-wallet-quick-actions">
            <div className="bg-weak py-4 px-6 h-full">
                <div className="flex flex-column items-center">
                    <ButtonLike
                        as={Link}
                        to={
                            Number.isInteger(walletId)
                                ? `/transfer#mode=send&walletId=${walletId}`
                                : '/transfer#mode=send'
                        }
                        size="large"
                        className="w-full mt-3"
                    >
                        <Icon name="arrow-up" className="mr-2" /> {c('Wallet Dashboard').t`Send`}
                    </ButtonLike>
                    <ButtonLike
                        as={Link}
                        to={Number.isInteger(walletId) ? `/transfer#walletId=${walletId}` : '/transfer'}
                        size="large"
                        className="w-full mt-3"
                    >
                        <Icon name="arrow-down" className="mr-2" /> {c('Wallet Dashboard').t`Receive`}
                    </ButtonLike>
                    {/* TODO: connect with swap when ready */}
                    <Button size="large" className="w-full mt-3">
                        <Icon name="arrow-right-arrow-left" className="mr-2" /> {c('Wallet Dashboard').t`Swap`}
                    </Button>
                </div>

                {Boolean(transactions?.length) && (
                    <>
                        <hr className="my-10" />
                        <div>
                            <h2 className="h4 text-left w-full text-semibold">{c('Wallet Dashboard')
                                .t`Last transactions`}</h2>
                            <TransactionHistoryOverview
                                walletId={Number.isInteger(walletId) ? Number(walletId) : undefined}
                                transactions={transactions as IWasmSimpleTransactionArray}
                            />
                        </div>
                    </>
                )}
            </div>
        </DrawerView>
    );
};
