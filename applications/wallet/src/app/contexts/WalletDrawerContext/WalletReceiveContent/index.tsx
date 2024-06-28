import { useEffect, useState } from 'react';

import { first } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiFiatCurrency, WasmApiWalletAccount } from '@proton/andromeda';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';
import Href from '@proton/atoms/Href/Href';
import Copy from '@proton/components/components/button/Copy';
import QRCode from '@proton/components/components/image/QRCode';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, Select } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { BitcoinViaEmailNote } from '../../../atoms/BitcoinViaEmailNote';
import { CurrencySelect } from '../../../atoms/CurrencySelect';
import { WalletAccountItem } from '../../../components/WalletAccountSelector';
import { useWalletAccountExchangeRate } from '../../../hooks/useWalletAccountExchangeRate';
import { useFiatCurrencies, useGetExchangeRate } from '../../../store/hooks';
import { useUserWalletSettings } from '../../../store/hooks/useUserWalletSettings';
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
    const [defaultExchangeRate] = useWalletAccountExchangeRate(selectedAccount);

    const [settings] = useUserWalletSettings();
    const [controlledExchangeRate, setControlledExchangeRate] = useState<WasmApiExchangeRate>();
    const getExchangeRate = useGetExchangeRate();
    const exchangeRate = controlledExchangeRate ?? defaultExchangeRate;
    const [isOpen, setOpen] = useState(false);

    const { walletsChainData } = useBitcoinBlockchainContext();

    const [currencies] = useFiatCurrencies();

    useEffect(() => {
        setOpen(true);
        return () => {
            setOpen(false);
        };
    }, []);

    const {
        shouldShowAmountInput,
        loadingPaymentLink,
        paymentLink,
        amount,

        isIndexAboveGap,
        incrementIndex,

        showAmountInput,
        handleChangeAmount,
    } = useBitcoinReceive(isOpen, selectedAccount);

    const handleChange = async (currency?: WasmApiFiatCurrency) => {
        if (currency) {
            const exchangeRate = await getExchangeRate(currency.Symbol);
            if (exchangeRate) {
                setControlledExchangeRate(exchangeRate);
            }
        }
    };

    return (
        <div className="block overflow-auto">
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
                            <div
                                className="bg-weak rounded-xl flex flex-column items-center w-full"
                                style={{ padding: '2px' }}
                            >
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
                                    />
                                )}

                                <div className="w-custom pt-6 px-6" style={{ '--w-custom': '12.5rem' }}>
                                    <QRCode data-testid="serialized-payment-info-qrcode" value={paymentLinkString} />
                                </div>

                                <div className="flex flex-row flex-nowrap items-center mt-4 px-6">
                                    <div>
                                        <Tooltip title={paymentLinkString}>
                                            <Href href={paymentLinkUri} className="color-norm">
                                                <span className="block text-break-all text-center text-no-decoration">
                                                    {paymentLinkString}
                                                </span>
                                            </Href>
                                        </Tooltip>
                                    </div>

                                    <Copy
                                        value={paymentLinkString}
                                        className="flex items-start flex-nowrap gap-2 no-shrink ml-1"
                                        shape="ghost"
                                        color="weak"
                                    />
                                </div>

                                <div className="flex flex-row flex-nowrap items-center mt-4 px-6 pb-6">
                                    {!shouldShowAmountInput ? (
                                        <CoreButton
                                            data-testid="show-amount-input-button"
                                            shape="ghost"
                                            color="norm"
                                            onClick={() => {
                                                showAmountInput();
                                            }}
                                        >
                                            {c('Wallet Receive').t`Enter custom amount`}
                                        </CoreButton>
                                    ) : (
                                        <>
                                            <div className="mr-4">
                                                <BitcoinAmountInput
                                                    dense={false}
                                                    data-testid="amount-input"
                                                    title={c('Wallet Receive').t`Amount`}
                                                    placeholder={c('Wallet Receive').t`Amount to receive`}
                                                    value={amount}
                                                    onValueChange={(amount: number) => handleChangeAmount(amount)}
                                                    unit={exchangeRate ?? settings.BitcoinUnit}
                                                    assistiveText={c('Wallet Receive')
                                                        .t`Leave empty to let the sender choose the amount`}
                                                />
                                            </div>

                                            <div>
                                                <CurrencySelect
                                                    dense
                                                    options={currencies ?? []}
                                                    value={exchangeRate?.FiatCurrency}
                                                    onSelect={(u) => handleChange(u)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
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
                        onClick={() => {}}
                    >{c('Wallet receive').t`Share address`}</Button>

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
