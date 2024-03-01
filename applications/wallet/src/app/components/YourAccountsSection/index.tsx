import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { ConfirmActionModal, Icon } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { WasmBitcoinUnit } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { useRustApi } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { walletAccountDeletion } from '../../store/slices/userWallets';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getLabelByScriptType } from '../../utils';
import { AddAccountModal } from '../AddAccountModal';

interface Props {
    wallet: WalletWithAccountsWithBalanceAndTxs;
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

export const YourAccountsSection = ({ wallet }: Props) => {
    const [isAddWalletModalOpenned, setIsAddWalletModalOpenned] = useState(false);
    const [displayedDeleteButton, setDisplayedDeleteButton] = useState<string | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const isConfirmModalOpen = !!accountToDelete;

    const dispatch = useWalletDispatch();

    const rust = useRustApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const onConfirmDeletion = async () => {
        if (!accountToDelete) {
            return;
        }

        await rust
            .wallet()
            .deleteWalletAccount(wallet.Wallet.ID, accountToDelete)
            .then(async () => {
                createNotification({ text: c('Wallet Account').t`Account successfully deleted` });
                setAccountToDelete(null);
                dispatch(walletAccountDeletion({ walletID: wallet.Wallet.ID, walletAccountID: accountToDelete }));
            })
            .catch(() => createNotification({ text: c('Wallet Account').t`Could not delete account`, type: 'error' }));
    };

    return (
        <>
            <div className="mt-14">
                <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your accounts`}</h2>

                <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                    {wallet.accounts.map((account) => (
                        <Card
                            key={account.ID}
                            data-testid="account-balance-card"
                            rounded
                            className="w-full bg-gradient-weak-norm border-weak py-3"
                            onMouseEnter={() => setDisplayedDeleteButton(account.ID)}
                            onMouseLeave={() => setDisplayedDeleteButton(null)}
                        >
                            <div className="text-right">
                                <BitcoinAmount
                                    bitcoin={account.balance.confirmed ? Number(account.balance.confirmed) : 0}
                                    unit={bitcoinUnit}
                                    fiat={fiatCurrency}
                                    firstClassName="text-2xl"
                                />
                            </div>

                            <div className="mt-4 flex flex-row items-center justify-between">
                                <div className="max-w-4/5 ">
                                    <span className="color-hint text-sm">
                                        {getLabelByScriptType(account.ScriptType)}
                                    </span>
                                    <h3 className="w-full text-lg text-ellipsis">{account.Label}</h3>
                                </div>

                                {displayedDeleteButton === account.ID && (
                                    <Button
                                        shape="ghost"
                                        className="p-1 ml-auto"
                                        onClick={() => {
                                            setAccountToDelete(account.ID);
                                        }}
                                    >
                                        {<Icon name="eraser" />}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}

                    <Button
                        shape="outline"
                        color="weak"
                        fullWidth
                        className="border-weak flex"
                        onClick={() => {
                            setIsAddWalletModalOpenned(true);
                        }}
                    >
                        <div className="m-auto color-primary">{c('Wallet Dashboard').t`Add Account`}</div>
                    </Button>
                </div>
            </div>

            <AddAccountModal
                wallet={wallet}
                isOpen={isAddWalletModalOpenned}
                onClose={() => {
                    setIsAddWalletModalOpenned(false);
                }}
            />

            <ConfirmActionModal
                open={isConfirmModalOpen}
                onClose={() => setAccountToDelete(null)}
                onExit={() => setAccountToDelete(null)}
                onSubmit={() => withLoading(onConfirmDeletion())}
                title={c('Wallet Account').t`Account deletion`}
                message={c('Wallet Account').t`Are you sure you want to delete this account?`}
                submitText={c('Wallet Account').t`Continue`}
                size="small"
                loading={loading}
            />
        </>
    );
};
