import React, { useState } from 'react';

import { c } from 'ttag';

import { WasmBitcoinUnit } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Pill } from '@proton/atoms/Pill';
import Alert from '@proton/components/components/alert/Alert';
import { ConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { BitcoinAmount } from '../../atoms';
import { useBitcoinBlockchainContext, useRustApi } from '../../contexts';
import { useWalletDispatch } from '../../store/hooks';
import { walletDeletion } from '../../store/slices/apiWalletsData';
import { IWasmApiWalletData } from '../../types';
import { WalletType } from '../../types/api';
import { getWalletBalance, getWalletUntrustedBalance } from '../../utils';

interface Props {
    onAddWallet: () => void;
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

const ONCHAIN_COLOR = '#12869F';
const LIGHTNING_COLOR = '#AD7406';

const getTopRightNode = ({ Wallet, IsNotDecryptable }: IWasmApiWalletData) => {
    if (IsNotDecryptable) {
        return (
            <Tooltip
                title={c('Wallet decryption')
                    .t`You need to reactivate the key used to create this wallet to decrypt it.`}
            >
                <Icon name="exclamation-circle" className="color-warning" />
            </Tooltip>
        );
    }

    return Wallet.Type === WalletType.OnChain ? (
        <Pill color={ONCHAIN_COLOR}>Onchain</Pill>
    ) : (
        <Pill color={LIGHTNING_COLOR}>Lightning</Pill>
    );
};

export const YourWalletsSection = ({ onAddWallet }: Props) => {
    const { walletsChainData, decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const [displayedDeleteButton, setDisplayedDeleteButton] = useState<string | null>(null);
    const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
    const isConfirmModalOpen = !!walletToDelete;
    const dispatch = useWalletDispatch();

    const rust = useRustApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const onConfirmDeletion = async () => {
        if (!walletToDelete) {
            return;
        }

        await rust
            .wallet()
            .deleteWallet(walletToDelete)
            .then(async () => {
                createNotification({ text: c('Wallet').t`Wallet successfully deleted` });
                setWalletToDelete(null);
                dispatch(walletDeletion({ walletID: walletToDelete }));
            })
            .catch(() => createNotification({ text: c('Wallet').t`Could not delete wallet`, type: 'error' }));
    };

    return (
        <>
            <div className="mt-14">
                <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your wallets`}</h2>

                <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                    {decryptedApiWalletsData?.map((wallet) => {
                        const fingerPrint = walletsChainData[wallet.Wallet.ID]?.wallet.getFingerprint();

                        const untrustedBalance = getWalletUntrustedBalance(walletsChainData, wallet.Wallet.ID);

                        return (
                            <Card
                                key={wallet.Wallet.ID}
                                data-testid="wallet-balance-card"
                                rounded
                                className="w-full bg-gradient-weak-norm border-weak py-3"
                                onMouseEnter={() => setDisplayedDeleteButton(wallet.Wallet.ID)}
                                onMouseLeave={() => setDisplayedDeleteButton(null)}
                            >
                                <div className="flex flex-row justify-space-between w-full">
                                    <h3 className="text-lg max-w-3/5 text-ellipsis">{wallet.Wallet.Name}</h3>
                                    {getTopRightNode(wallet)}
                                </div>

                                <div className="mt-6 flex flex-row items-center">
                                    <div>
                                        <BitcoinAmount
                                            bitcoin={getWalletBalance(walletsChainData, wallet.Wallet.ID)}
                                            info={
                                                untrustedBalance ? (
                                                    <span>{c('Wallet Account')
                                                        .t`${untrustedBalance} SAT pending`}</span>
                                                ) : null
                                            }
                                            unit={bitcoinUnit}
                                            fiat={fiatCurrency}
                                            firstClassName="text-2xl"
                                            secondClassName="mb-1"
                                        />
                                    </div>

                                    {displayedDeleteButton === wallet.Wallet.ID ? (
                                        <Button
                                            shape="ghost"
                                            className="p-1 ml-auto"
                                            onClick={() => {
                                                setWalletToDelete(wallet.Wallet.ID);
                                            }}
                                        >
                                            {<Icon name="eraser" alt={c('Wallet Dashboard').t`an eraser icon`} />}
                                        </Button>
                                    ) : (
                                        <div className="text-xs color-hint p-1 ml-auto">{fingerPrint}</div>
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
                            onAddWallet();
                        }}
                    >
                        <span className="m-auto color-primary">{c('Wallet Dashboard').t`Add wallet`}</span>
                    </Button>
                </div>
            </div>

            <ConfirmActionModal
                open={isConfirmModalOpen}
                onClose={() => setWalletToDelete(null)}
                onExit={() => setWalletToDelete(null)}
                onSubmit={() => withLoading(onConfirmDeletion())}
                title={c('Wallet').t`Wallet deletion`}
                message={
                    <div>
                        <p>{c('Wallet').t`Are you sure you want to delete this wallet?`}</p>
                        <Alert type="warning">{c('Wallet')
                            .t`Please make sure you have a backup of your wallet's mnemonic, you won't be able to get it after deletion`}</Alert>
                    </div>
                }
                submitText={c('Wallet').t`Continue`}
                size="medium"
                loading={loading}
            />
        </>
    );
};
