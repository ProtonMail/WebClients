import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Href } from '@proton/atoms/Href';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import QRCode from '@proton/components/components/image/QRCode';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletSendSvg from '@proton/styles/assets/img/illustrations/wallet-send.svg';

import { Button, CoreButton, CoreButtonLike } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { CurrencySelect } from '../../../atoms/CurrencySelect';
import { Tip } from '../../../atoms/Tip';
import { DEFAULT_BITCOIN_UNIT } from '../../../constants';
import { useWalletAccountExchangeRate } from '../../../hooks/useWalletAccountExchangeRate';
import { useBitcoinReceive } from './useBitcoinReceive';

interface Props {
    account: WasmApiWalletAccount;
}

export const WalletReceiveContent = ({ account }: Props) => {
    const [unit, setUnit] = useState<WasmBitcoinUnit | WasmApiExchangeRate>(DEFAULT_BITCOIN_UNIT);
    const [exchangeRate] = useWalletAccountExchangeRate(account);
    const [isOpen, setOpen] = useState(false);

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
    } = useBitcoinReceive(isOpen, account);

    useEffect(() => {
        if (exchangeRate) {
            setUnit(exchangeRate);
        }
    }, [exchangeRate]);

    return (
        <div className="flex flex-column grow justify-center">
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

            <Tip
                className={'mb-3'}
                image={walletSendSvg}
                text={c('Wallet Receive').t`Other ${WALLET_APP_NAME} users can send Bitcoin to your email.`}
                action={
                    <CoreButtonLike shape="underline" className="unstyled p-0 font-semibold">{c('Wallet Receive')
                        .t`Discover Bitcoin Via Email`}</CoreButtonLike>
                }
            />

            <div className="flex flex-column items-center">
                {/* Payment info data */}
                {paymentLink && !loadingPaymentLink ? (
                    (() => {
                        const paymentLinkString = paymentLink.toString();
                        const paymentLinkUri = paymentLink.toUri();

                        return (
                            <div className="bg-weak rounded-xl p-6 flex flex-column items-center">
                                <div className="w-custom" style={{ '--w-custom': '12.5rem' }}>
                                    <QRCode data-testid="serialized-payment-info-qrcode" value={paymentLinkString} />
                                </div>

                                <div className="flex flex-row flex-nowrap items-center mt-4 px-5">
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

                                <div className="flex flex-row flex-nowrap items-center mt-4">
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
                                                    unit={unit}
                                                    assistiveText={c('Wallet Receive')
                                                        .t`Leave empty to let the sender choose the amount`}
                                                />
                                            </div>

                                            <div>
                                                <CurrencySelect
                                                    exchangeRates={exchangeRate && [exchangeRate]}
                                                    value={unit}
                                                    onChange={(u) => setUnit(u)}
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

                    <Button
                        fullWidth
                        className="mt-2"
                        shape="ghost"
                        size="large"
                        onClick={() => incrementIndex()}
                        disabled={isIndexAboveGap || !paymentLink || loadingPaymentLink}
                    >{c('Wallet receive').t`Generate new address`}</Button>

                    {isIndexAboveGap && (
                        <Alert type="warning">{c('Wallet receive')
                            .t`Gap between next address and last used one is too large. Please use one of the address you generate before`}</Alert>
                    )}
                </div>
            </div>
        </div>
    );
};
