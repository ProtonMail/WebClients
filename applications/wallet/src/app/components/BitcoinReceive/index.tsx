import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';
import { Href } from '@proton/atoms/Href';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import QRCode from '@proton/components/components/image/QRCode';
import { Tooltip } from '@proton/components/components/tooltip';
import { SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import { IWasmApiWalletData } from '@proton/wallet';

import { WalletSelector } from '../../atoms';
import { BitcoinAmountInput } from '../../atoms/BitcoinAmountInput';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { useBitcoinReceive } from './useBitcoinReceive';

const CopyPasteButton = ({ value }: { value: string }) => {
    const defaultTitle = c('Wallet Receive').t`Copy payment link`;
    const [title, setTitle] = useState(defaultTitle);

    return (
        <div className="mt-8">
            <Copy
                value={value}
                className="flex items-start flex-nowrap gap-2"
                shape="solid"
                color="norm"
                size="small"
                onCopy={() => {
                    setTitle(c('Wallet Receive').t`Copied`);
                    setTimeout(() => setTitle(defaultTitle), 2 * SECOND);
                }}
            >
                <span className="shrink-0">
                    <Icon name="squares" />
                </span>
                <span className="text-left">{title}</span>
            </Copy>
        </div>
    );
};

interface Props {
    defaultWalletId?: string;
    wallets: IWasmApiWalletData[];
}

export const BitcoinReceive = ({ defaultWalletId, wallets }: Props) => {
    const [exchangeRate] = useUserExchangeRate();

    const {
        paymentLink,
        selectedWallet,
        shouldShowAmountInput,
        amount,
        handleSelectWallet,
        handleChangeAmount,
        showAmountInput,
    } = useBitcoinReceive(wallets, defaultWalletId);

    const walletSelectorLabels = {
        wallet: c('Wallet Receive').t`Receive to wallet`,
        account: c('Wallet Receive').t`on account`,
        format: c('Wallet Receive').t`using format`,
    };

    return (
        <div className="flex flex-column items-center">
            {/* Wallets and Account/format selector */}
            <div className="flex w-full flex-row px-8">
                <WalletSelector
                    onSelect={handleSelectWallet}
                    value={selectedWallet}
                    label={walletSelectorLabels}
                    apiWalletsData={wallets}
                    onlyValidWallet
                />

                {shouldShowAmountInput ? (
                    <div className="flex flex-row flex-nowrap mt-7">
                        <BitcoinAmountInput
                            data-testid="amount-input"
                            title={c('Wallet Receive').t`Amount`}
                            value={amount}
                            onValueChange={(amount: number) => handleChangeAmount(amount)}
                            exchangeRates={[exchangeRate].filter(isTruthy)}
                        />
                    </div>
                ) : (
                    <div className="mt-6 w-3/10 flex flex-row justify-center">
                        <Button
                            shape="underline"
                            data-testid="show-amount-input-button"
                            color="norm"
                            onClick={() => {
                                showAmountInput();
                            }}
                        >
                            {c('Wallet Receive').t`Add amount`}
                        </Button>
                    </div>
                )}
            </div>

            <hr className="my-8 w-5/6 bg-strong" />

            {/* Payment info data */}
            {paymentLink &&
                (() => {
                    const paymentLinkString = paymentLink.toString();
                    const paymentLinkUri = paymentLink.toUri();

                    return (
                        <Card
                            className="flex flex-row shrink bg-norm mx-auto mb-8 p-8"
                            rounded
                            background={false}
                            bordered={false}
                        >
                            <div className="mr-8 w-custom" style={{ '--w-custom': '15rem' }}>
                                <QRCode data-testid="serialized-payment-info-qrcode" value={paymentLinkString} />
                            </div>
                            <div
                                className="flex flex-column w-custom justify-space-between"
                                style={{ '--w-custom': '15rem' }}
                            >
                                <h3 className="text-lg text-semibold mt-4">
                                    {selectedWallet.apiWalletData?.Wallet.Name}
                                </h3>
                                <Href href={paymentLinkUri}>
                                    <Tooltip title={paymentLinkString}>
                                        <p
                                            className="text-monospace h-custom bg-norm m-0 text-break overflow-hidden"
                                            style={{ '--h-custom': '3rem', lineHeight: '1rem' }}
                                        >
                                            {paymentLinkString}
                                        </p>
                                    </Tooltip>
                                </Href>

                                <CopyPasteButton value={paymentLinkString} />

                                <Alert type="warning" className="text-xs lh-xs">
                                    {c('Wallet Receive').t`Disclaimer: fees might apply`}
                                </Alert>
                            </div>
                        </Card>
                    );
                })()}
        </div>
    );
    return null;
};
