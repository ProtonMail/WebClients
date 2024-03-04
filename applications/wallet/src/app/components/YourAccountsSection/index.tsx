import React, { useState } from 'react';

import { c } from 'ttag';

import { WasmBitcoinUnit } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { ConfirmActionModal, Icon } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { BitcoinAmount } from '../../atoms';
import { useBitcoinBlockchainContext, useRustApi } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { walletAccountDeletion } from '../../store/slices/apiWalletsData';
import { IWasmApiWalletData } from '../../types';
import {
    getAccountBalance,
    getAccountUntrustedBalance,
    getAccountWithChainDataFromManyWallets,
    getLabelByScriptType,
} from '../../utils';
import { AddAccountModal } from '../AddAccountModal';

interface Props {
    apiWalletData: IWasmApiWalletData;
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

export const YourAccountsSection = ({ apiWalletData }: Props) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [isAddWalletModalOpenned, setIsAddWalletModalOpenned] = useState(false);
    const [displayedDeleteButton, setDisplayedDeleteButton] = useState<string | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const isConfirmModalOpen = !!accountToDelete;

    const dispatch = useWalletDispatch();

    const rust = useRustApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const { Wallet, WalletAccounts } = apiWalletData;

    const onConfirmDeletion = async () => {
        if (!accountToDelete) {
            return;
        }

        await rust
            .wallet()
            .deleteWalletAccount(Wallet.ID, accountToDelete)
            .then(async () => {
                createNotification({ text: c('Wallet Account').t`Account successfully deleted` });
                setAccountToDelete(null);
                dispatch(walletAccountDeletion({ walletID: Wallet.ID, walletAccountID: accountToDelete }));
            })
            .catch(() => createNotification({ text: c('Wallet Account').t`Could not delete account`, type: 'error' }));
    };

    return (
        <>
            <div className="mt-14">
                <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your accounts`}</h2>

                <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                    {WalletAccounts.map((account) => {
                        const wasmAccount = getAccountWithChainDataFromManyWallets(
                            walletsChainData,
                            Wallet.ID,
                            account.ID
                        );

                        const untrustedBalance = getAccountUntrustedBalance(wasmAccount);

                        return (
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
                                        bitcoin={getAccountBalance(wasmAccount)}
                                        info={
                                            untrustedBalance ? (
                                                <span>{c('Wallet Account').t`${untrustedBalance} SAT pending`}</span>
                                            ) : null
                                        }
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

                                    {displayedDeleteButton === account.ID ? (
                                        <Button
                                            shape="ghost"
                                            className="p-1 ml-auto"
                                            onClick={() => {
                                                setAccountToDelete(account.ID);
                                            }}
                                        >
                                            {<Icon name="eraser" />}
                                        </Button>
                                    ) : (
                                        <div className="text-xs color-hint p-1 ml-auto">{account.DerivationPath}</div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}

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
                apiWalletData={apiWalletData}
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
