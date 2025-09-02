import { useState } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms';
import QRCode from '@proton/components/components/image/QRCode';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Info from '@proton/components/components/link/Info';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, Select } from '../../../atoms';
import { WalletAccountItem } from '../../../components/WalletAccountSelector';
import { getAccountWithChainDataFromManyWallets } from '../../../utils';
import { useBitcoinBlockchainContext } from '../../BitcoinBlockchainContext';
import { WalletReceiveExtraContent } from '../WalletReceiveExtraContent';

interface Props {
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
    onClose?: () => void;
}

export const WalletReceiveContent = ({ wallet, account, onClose }: Props) => {
    const { createNotification } = useNotifications();

    const defaultAccount = wallet.WalletAccounts.at(0);
    const [selectedAccount, setSelectedAccount] = useState(account ?? defaultAccount);

    const { walletsChainData, bitcoinAddressHelperByWalletAccountId } = useBitcoinBlockchainContext();

    const bitcoinAddressHelper = selectedAccount?.ID
        ? bitcoinAddressHelperByWalletAccountId[selectedAccount.ID]
        : undefined;

    const bitcoinAddress = bitcoinAddressHelper?.receiveBitcoinAddress.address;
    const bitcoinAddressIndex = bitcoinAddressHelper?.receiveBitcoinAddress.index;

    const isDisabled = !bitcoinAddress || bitcoinAddressHelper?.isLoading;

    return (
        <div className="block">
            <h3 className="text-4xl text-bold mx-auto text-center mb-3">{c('Receive bitcoin').t`Receive Bitcoin`}</h3>
            <p className="text-center mt-0 mb-6">
                {c('Receive bitcoin')
                    .t`Below is the last generated Bitcoin address. For better privacy, use a different address for each transaction.`}
            </p>
            <div className="flex flex-column items-center">
                {/* Payment info data */}
                {bitcoinAddress && !bitcoinAddressHelper.isLoading ? (
                    <InputFieldStackedGroup>
                        {/* We only display selector when account was not provided */}
                        {!account && (
                            <Select
                                className="w-full"
                                renderSelected={() => selectedAccount?.Label}
                                value={selectedAccount?.ID}
                                onChange={(e) => {
                                    const walletAccount = wallet.WalletAccounts.find((w) => w.ID === e.value);
                                    if (walletAccount) {
                                        setSelectedAccount(walletAccount);
                                    }
                                }}
                                label={c('Wallet Receive').t`Receive to`}
                                options={wallet.WalletAccounts.map((w) => ({
                                    id: w.ID,
                                    label: w.Label,
                                    value: w.ID,
                                    children: (
                                        <WalletAccountItem
                                            withIcon={false}
                                            walletAccount={w}
                                            accountChainData={getAccountWithChainDataFromManyWallets(
                                                walletsChainData,
                                                w.WalletID,
                                                w.ID
                                            )}
                                        />
                                    ),
                                }))}
                                isGroupElement
                            />
                        )}
                        <InputFieldStacked isGroupElement classname="bg-weak text-center">
                            <div className="w-custom pt-6 px-6 mx-auto" style={{ '--w-custom': '11.5rem' }}>
                                <QRCode data-testid="serialized-payment-info-qrcode" value={bitcoinAddress} />
                            </div>
                            <div className="flex flex-row flex-nowrap items-center p-4">
                                <div>
                                    <h4 className="text-lg text-bold flex gap-2 mb-2 items-center text-center justify-center">
                                        {c('Wallet Receive').t`Bitcoin address`}
                                        {` #${bitcoinAddressIndex}`}
                                        <Info
                                            className="color-norm"
                                            title={c('Wallet Receive')
                                                .t`For better privacy, generate a new address for each transaction.`}
                                        />
                                    </h4>
                                    <span className="block text-break-all text-center text-no-decoration">
                                        {bitcoinAddress}
                                    </span>
                                </div>
                            </div>
                        </InputFieldStacked>
                    </InputFieldStackedGroup>
                ) : (
                    <div className="flex flex-column items-center justify-center my-12 py-12">
                        <CircleLoader className="color-primary" />
                        <p className="color-weak mt-6">{c('Wallet receive').t`Address generation in progress`}</p>
                    </div>
                )}

                <div className="flex flex-column items-center mt-10 w-full">
                    <Button
                        fullWidth
                        shape="solid"
                        color="norm"
                        disabled={isDisabled}
                        size="large"
                        onClick={() => {
                            if (bitcoinAddress) {
                                void navigator.clipboard.writeText(bitcoinAddress);
                                createNotification({
                                    text: c('Recipient details').t`Bitcoin address copied to clipboard`,
                                });
                            }
                        }}
                    >{c('Wallet receive').t`Copy Bitcoin address`}</Button>

                    <Button
                        data-testid={'generate-new-address-button'}
                        fullWidth
                        className="mt-2"
                        shape="ghost"
                        size="large"
                        onClick={() => {
                            void bitcoinAddressHelper?.generateNewReceiveAddress();
                        }}
                        disabled={isDisabled || bitcoinAddressHelper?.hasReachedStopGap}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <span className="flex gap-2 items-center text-center justify-center">
                            {c('Wallet Receive').t`Generate new address`}
                            {bitcoinAddressHelper?.willReachStopGap && ' '}
                            {bitcoinAddressHelper?.willReachStopGap && !bitcoinAddressHelper?.hasReachedStopGap && (
                                <Info
                                    className="color-norm"
                                    title={c('Wallet Receive')
                                        .t`To prevent a large gap, you should either use this address or a previously generated one`}
                                    data-testid={'generate-new-address-button-warning'}
                                />
                            )}
                            {bitcoinAddressHelper?.hasReachedStopGap && (
                                <Info
                                    className="color-norm"
                                    title={c('Wallet Receive')
                                        .t`To prevent a large gap, generating new addresses has been disabled. You can either use this address or a previously generated one`}
                                    data-testid={'generate-new-address-button-error'}
                                />
                            )}
                        </span>
                    </Button>
                </div>
                {selectedAccount && !isDisabled && (
                    <WalletReceiveExtraContent account={selectedAccount} onClose={onClose}></WalletReceiveExtraContent>
                )}
            </div>
        </div>
    );
};
