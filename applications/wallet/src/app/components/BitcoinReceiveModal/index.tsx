import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Href } from '@proton/atoms/Href';
import type { ModalOwnProps } from '@proton/components/components';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import QRCode from '@proton/components/components/image/QRCode';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

import { Button, CoreButton } from '../../atoms';
import { BitcoinAmountInput } from '../../atoms/BitcoinAmountInput';
import { CurrencySelect } from '../../atoms/CurrencySelect';
import { FullscreenModal } from '../../atoms/FullscreenModal';
import { DEFAULT_BITCOIN_UNIT } from '../../constants';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { useBitcoinReceive } from './useBitcoinReceive';

interface Props extends ModalOwnProps {
    account: WasmApiWalletAccount;
}

export const BitcoinReceiveModal = ({ account, ...modalProps }: Props) => {
    const [unit, setUnit] = useState<WasmBitcoinUnit | WasmApiExchangeRate>(DEFAULT_BITCOIN_UNIT);
    const [exchangeRate] = useUserExchangeRate();

    const {
        shouldShowAmountInput,
        loadingPaymentLink,
        paymentLink,
        amount,

        isIndexAboveGap,
        incrementIndex,

        showAmountInput,
        handleChangeAmount,
    } = useBitcoinReceive(account);

    useEffect(() => {
        if (exchangeRate) {
            setUnit(exchangeRate);
        }
    }, [exchangeRate]);

    return (
        <FullscreenModal title={c('Wallet receive').t`Receive bitcoin`} {...modalProps}>
            <div className="flex flex-column">
                <h3 className="text-4xl text-bold mx-auto text-center">{c('Receive bitcoin')
                    .t`Your bitcoin address`}</h3>
                <div className="color-weak text-break mb-6">
                    <p className="text-center my-2">
                        {c('Receive bitcoin')
                            .t`Below is the last generated Bitcoin address. For better privacy, use a different address for each transaction.`}
                    </p>
                </div>
            </div>

            <div className="flex flex-column items-center">
                {/* Payment info data */}
                {paymentLink && !loadingPaymentLink ? (
                    (() => {
                        const paymentLinkString = paymentLink.toString();
                        const paymentLinkUri = paymentLink.toUri();

                        return (
                            <div className="bg-norm rounded-xl p-6 flex flex-column items-center">
                                <div className="w-custom" style={{ '--w-custom': '12.5rem' }}>
                                    <QRCode data-testid="serialized-payment-info-qrcode" value={paymentLinkString} />
                                </div>

                                <div className="flex flex-row flex-nowrap items-center mt-4 px-5">
                                    <div>
                                        <Href href={paymentLinkUri} className="color-norm">
                                            <Tooltip title={paymentLinkString}>
                                                <span className="block text-break-all text-center text-no-decoration">
                                                    {paymentLinkString}
                                                </span>
                                            </Tooltip>
                                        </Href>
                                    </div>

                                    <Copy
                                        value={paymentLinkUri}
                                        className="flex items-start flex-nowrap gap-2 no-shrink ml-1"
                                        shape="ghost"
                                        color="weak"
                                    >
                                        <Icon size={5} name="squares" />
                                    </Copy>
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

                <div className="flex flex-column items-center mt-6 w-full px-8">
                    <Button
                        pill
                        fullWidth
                        shape="solid"
                        color="norm"
                        disabled={!paymentLink || loadingPaymentLink}
                        className="py-3"
                        shadow
                        onClick={() => {}}
                    >{c('Wallet receive').t`Share address`}</Button>

                    <Button
                        className="mt-2 color-weak"
                        shape="ghost"
                        color="weak"
                        onClick={() => incrementIndex()}
                        disabled={isIndexAboveGap || !paymentLink || loadingPaymentLink}
                    >{c('Wallet receive').t`Generate new address`}</Button>

                    {isIndexAboveGap && (
                        <Alert type="warning">{c('Wallet receive')
                            .t`Gap between next address and last used one is too large. Please use one of the address you generate before`}</Alert>
                    )}
                </div>
            </div>
        </FullscreenModal>
    );
};
