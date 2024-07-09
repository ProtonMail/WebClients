import { useEffect, useState } from 'react';

import { first } from 'lodash';
import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';
import Href from '@proton/atoms/Href/Href';
import { Info } from '@proton/components/components';
import QRCode from '@proton/components/components/image/QRCode';
import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, Select } from '../../../atoms';
import { BitcoinViaEmailNote } from '../../../atoms/BitcoinViaEmailNote';
import { WalletAccountItem } from '../../../components/WalletAccountSelector';
import { getAccountWithChainDataFromManyWallets } from '../../../utils';
import { useBitcoinBlockchainContext } from '../../BitcoinBlockchainContext';
import { useBitcoinReceive } from './useBitcoinReceive';

interface Props {
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
}

export const WalletReceiveContent = ({ wallet, account }: Props) => {
    const defaultAccount = first(wallet.WalletAccounts);

    const [selectedAccount, setSelectedAccount] = useState(account ?? defaultAccount);

    const [isOpen, setOpen] = useState(false);

    const { walletsChainData } = useBitcoinBlockchainContext();

    useEffect(() => {
        setOpen(true);
        return () => {
            setOpen(false);
        };
    }, []);

    const {
        loadingPaymentLink,
        paymentLink,

        isIndexAboveGap,
        incrementIndex,
    } = useBitcoinReceive(isOpen, selectedAccount);

    return (
        <div className="block">
            <div className="flex flex-column">
                <h3 className="text-4xl text-bold mx-auto text-center">{c('Receive bitcoin')
                    .t`Your bitcoin address`}</h3>
                <div className="color-weak text-break mb-6">
                    <p className="text-center my-2">
                        {c('Receive bitcoin')
                            .t`Here is your Bitcoin address. For better privacy, use a different address for each transaction.`}
                    </p>
                </div>
            </div>

            {selectedAccount && (
                <BitcoinViaEmailNote
                    isActive={!!selectedAccount?.Addresses.length}
                    email={selectedAccount?.Addresses?.[0]?.Email}
                />
            )}

            <div className="flex flex-column items-center">
                {/* Payment info data */}
                {paymentLink && !loadingPaymentLink ? (
                    (() => {
                        const paymentLinkString = paymentLink.toString();
                        const paymentLinkUri = paymentLink.toUri();

                        return (
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
                                        <QRCode
                                            data-testid="serialized-payment-info-qrcode"
                                            value={paymentLinkString}
                                        />
                                    </div>
                                    <div className="flex flex-row flex-nowrap items-center p-4">
                                        <div>
                                            <h4 className="text-rg font-bold flex gap-2 mb-2 items-center text-center justify-center">
                                                {c('Wallet Receive').t`Bitcoin address`}{' '}
                                                <Info
                                                    className="color-norm"
                                                    title={c('Wallet Receive')
                                                        .t`For better privacy, generate a new address for each transaction.`}
                                                />
                                            </h4>
                                            <Tooltip title={paymentLinkString}>
                                                <Href href={paymentLinkUri} className="color-norm">
                                                    <span className="block text-break-all text-center text-no-decoration">
                                                        {paymentLinkString}
                                                    </span>
                                                </Href>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </InputFieldStacked>
                            </InputFieldStackedGroup>
                        );
                    })()
                ) : (
                    <div className="flex flex-column items-center justify-center">
                        <CircleLoader className="color-primary" />
                        <p className="color-weak mt-6">{c('Wallet receive').t`Address generation in progress`}</p>
                    </div>
                )}

                <div className="flex flex-column items-center mt-6 w-full">
                    <Button
                        fullWidth
                        shape="solid"
                        color="norm"
                        disabled={!paymentLink || loadingPaymentLink}
                        size="large"
                        onClick={() => {
                            if (paymentLink) {
                                void navigator.clipboard.writeText(paymentLink.toString());
                            }
                        }}
                    >{c('Wallet receive').t`Copy address`}</Button>

                    {(() => {
                        const button = (
                            <Button
                                fullWidth
                                className="mt-2"
                                shape="ghost"
                                size="large"
                                onClick={() => incrementIndex()}
                                disabled={isIndexAboveGap || !paymentLink || loadingPaymentLink}
                            >{c('Wallet receive').t`Generate new address`}</Button>
                        );

                        return isIndexAboveGap ? (
                            <Tooltip
                                title={c('Wallet receive')
                                    .t`Gap between next address and last used one is too large. Please use one of the address you generate before`}
                            >
                                {button}
                            </Tooltip>
                        ) : (
                            button
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
