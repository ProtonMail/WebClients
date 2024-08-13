import { useState } from 'react';

import { c } from 'ttag';

import { type WasmApiWalletAccount } from '@proton/andromeda';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';
import QRCode from '@proton/components/components/image/QRCode';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Info from '@proton/components/components/link/Info';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, Select } from '../../../atoms';
import { WalletAccountItem } from '../../../components/WalletAccountSelector';
import { getAccountWithChainDataFromManyWallets } from '../../../utils';
import { useBitcoinBlockchainContext } from '../../BitcoinBlockchainContext';

interface Props {
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
}

export const WalletReceiveContent = ({ wallet, account }: Props) => {
    const { createNotification } = useNotifications();

    const defaultAccount = wallet.WalletAccounts.at(0);
    const [selectedAccount, setSelectedAccount] = useState(account ?? defaultAccount);

    const { walletsChainData, bitcoinAddressHelperByWalletAccountId } = useBitcoinBlockchainContext();

    const isIndexAboveGap = true;

    const bitcoinAddressHelper = selectedAccount?.ID
        ? bitcoinAddressHelperByWalletAccountId[selectedAccount.ID]
        : undefined;
    const bitcoinAddress = bitcoinAddressHelper?.receiveBitcoinAddress.address;

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
                                        {c('Wallet Receive').t`Bitcoin address`}{' '}
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
                    <div className="flex flex-column items-center justify-center">
                        <CircleLoader className="color-primary" />
                        <p className="color-weak mt-6">{c('Wallet receive').t`Address generation in progress`}</p>
                    </div>
                )}

                <div className="flex flex-column items-center mt-10 w-full">
                    <Button
                        fullWidth
                        shape="solid"
                        color="norm"
                        disabled={!bitcoinAddress || bitcoinAddressHelper.isLoading}
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

                    {(() => {
                        const button = (
                            <Button
                                fullWidth
                                className="mt-2"
                                shape="ghost"
                                size="large"
                                onClick={() => bitcoinAddressHelper?.generateNewReceiveAddress()}
                                disabled={!bitcoinAddress || bitcoinAddressHelper.isLoading}
                            >{c('Wallet receive').t`Generate new address`}</Button>
                        );

                        return (
                            <Tooltip
                                title={
                                    isIndexAboveGap
                                        ? c('Wallet receive')
                                              .t`Gap between next address and last used one is too large. Please use one of the address you generate before`
                                        : null
                                }
                            >
                                {button}
                            </Tooltip>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
