import { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Icon, ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, CoreInput, Input, Modal } from '../../atoms';
import { AccountPreferences } from '../AccountPreferences';
import { useWalletPreferences } from './useWalletPreferences';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    otherWallets: IWasmApiWalletData[];
}

export const WalletPreferencesModal = ({ wallet, otherWallets, ...modalProps }: Props) => {
    const {
        walletName,
        setWalletName,
        loadingWalletNameUpdate,
        updateWalletName,
        showDeletionConfirmation,
        setShowDeletionConfirmation,
        walletDeletionInputValue,
        setWalletDeletionInputValue,
        loadingDeletion,
        handleWalletDeletion,
    } = useWalletPreferences(wallet);

    return (
        <Modal
            title={c('Wallet preference').t`Your wallet preferences`}
            enableCloseWhenClickOutside
            size="large"
            {...modalProps}
        >
            <div className="flex flex-column">
                <Input
                    label={c('Wallet preference').t`Wallet name`}
                    placeholder={c('Wallet preference').t`My super wallet`}
                    value={walletName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setWalletName(e.target.value);
                    }}
                    disabled={loadingWalletNameUpdate}
                    suffix={
                        <CoreButton icon size="small">
                            <Icon
                                name="arrow-down-line"
                                onClick={() => {
                                    updateWalletName();
                                }}
                            />
                        </CoreButton>
                    }
                />

                <div className="flex flex-column my-3">
                    <span className="block color-weak">{c('Wallet preference').t`Accounts`}</span>

                    {wallet.WalletAccounts.map((walletAccount) => {
                        return (
                            <AccountPreferences
                                key={walletAccount.ID}
                                wallet={wallet}
                                walletAccount={walletAccount}
                                otherWallets={otherWallets}
                            />
                        );
                    })}
                </div>

                <div className="flex flex-column my-3">
                    <span className="block color-danger">{c('Wallet preference').t`Danger zone`}</span>
                    {showDeletionConfirmation ? (
                        <Card className="flex flex-column my-2 border border-danger">
                            <span className="block">{c('Wallet preference')
                                .t`Are you sure you want to delete this wallet?`}</span>
                            <span className="block">{c('Wallet preference')
                                .t`Please enter your wallet's name to confirm`}</span>

                            <div className="mt-2">
                                <CoreInput
                                    color="danger"
                                    disabled={loadingDeletion}
                                    placeholder={c('Wallet preference').t`Your wallet's name`}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        setWalletDeletionInputValue(e.target.value);
                                    }}
                                />
                            </div>

                            <div className="flex flex-row justify-end">
                                <Button
                                    disabled={walletDeletionInputValue !== wallet.Wallet.Name || loadingDeletion}
                                    pill
                                    shape="ghost"
                                    color="danger"
                                    size="small"
                                    className="mr-2"
                                    onClick={() => handleWalletDeletion()}
                                >{c('Wallet preference').t`Confirm deletion`}</Button>

                                <Button
                                    pill
                                    disabled={loadingDeletion}
                                    shape="solid"
                                    color="norm"
                                    size="small"
                                    onClick={() => setShowDeletionConfirmation(false)}
                                >{c('Wallet preference').t`Cancel`}</Button>
                            </div>
                        </Card>
                    ) : (
                        <Button
                            pill
                            shape="solid"
                            color="danger"
                            className="my-2"
                            onClick={() => setShowDeletionConfirmation(true)}
                        >{c('Wallet preference').t`Delete wallet`}</Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
