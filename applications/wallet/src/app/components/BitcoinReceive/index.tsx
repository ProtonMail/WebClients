import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';
import { Href } from '@proton/atoms/Href';
import Alert from '@proton/components/components/alert/Alert';
import Copy from '@proton/components/components/button/Copy';
import Icon from '@proton/components/components/icon/Icon';
import QRCode from '@proton/components/components/image/QRCode';
import { Tooltip } from '@proton/components/components/tooltip';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { SECOND } from '@proton/shared/lib/constants';

import { Selector } from '../../atoms/Selector';
import { WalletType } from '../../types/api';
import { getLightningFormatOptions } from './constants';
import { useBitcoinReceive } from './useBitcoinReceive';

const CopyPasteButton = ({ value }: { value: string }) => {
    const defaultTitle = c('Wallet Receive').t`Copy payment link`;
    const [title, setTitle] = useState(defaultTitle);

    return (
        <div className="mt-8">
            <Copy
                value={value}
                className="flex flex-row items-center"
                shape="solid"
                color="norm"
                size="small"
                onCopy={() => {
                    setTitle(c('Wallet Receive').t`Copied`);
                    setTimeout(() => setTitle(defaultTitle), 2 * SECOND);
                }}
            >
                <Icon className="mx-2" name="squares" alt={c('Wallet Receive').t`Copy`} />
                <span className="mr-2"> {title}</span>
            </Copy>
        </div>
    );
};

interface Props {
    defaultWalletId?: number;
}

export const BitcoinReceive = ({ defaultWalletId }: Props) => {
    const {
        paymentLink,
        selectedWallet,
        walletsOptions,
        selectedAccount,
        accountsOptions,
        selectedFormat,
        shouldShowAmountInput,
        amount,
        handleSelectWallet,
        handleSelectAccount,
        handleSelectFormat,
        handleChangeAmount,
        showAmountInput,
    } = useBitcoinReceive(defaultWalletId);

    const [walletSelectorLabel, accountSelectorLabel, formatSelectorLabel, amountInputLabel] = [
        c('Wallet Receive').t`Receive to wallet`,
        c('Wallet Receive').t`on account`,
        c('Wallet Receive').t`using format`,
        c('Wallet Receive').t`Amount`,
    ];

    return (
        <div className="flex flex-column items-center">
            {/* Wallets and Account/format selector */}
            <div className="flex w-full flex-row px-8">
                <Selector
                    id="wallet-selector"
                    label={walletSelectorLabel}
                    selected={selectedWallet?.WalletID}
                    onSelect={handleSelectWallet}
                    options={walletsOptions}
                />

                {selectedWallet?.Type === WalletType.OnChain && accountsOptions && (
                    <Selector
                        id="account-selector"
                        label={accountSelectorLabel}
                        selected={selectedAccount?.WalletAccountID}
                        onSelect={handleSelectAccount}
                        options={accountsOptions}
                    />
                )}

                {selectedWallet?.Type === WalletType.Lightning && (
                    <Selector
                        id="format-selector"
                        label={formatSelectorLabel}
                        selected={selectedFormat.value}
                        onSelect={handleSelectFormat}
                        options={getLightningFormatOptions().map((format) => ({
                            value: format.value,
                            label: format.name,
                        }))}
                    />
                )}

                {shouldShowAmountInput ? (
                    <div className="w-3/10">
                        <InputFieldTwo
                            dense
                            title={amountInputLabel}
                            label={amountInputLabel}
                            type="number"
                            className="mt-2"
                            id="amount-input"
                            data-testid="amount-input"
                            value={amount}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                handleChangeAmount(Number(event.target.value));
                            }}
                            suffix="SAT"
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
                    const paymentLinkString = paymentLink.to_string();
                    const paymentLinkUri = paymentLink.to_uri();

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
                                <h3 className="text-lg text-semibold mt-4">{selectedWallet?.Name}</h3>
                                <Href href={paymentLinkUri}>
                                    <Tooltip title={paymentLinkString}>
                                        <p
                                            className="text-monospace h-custom bg-norm m-0 text-break overflow-hidden"
                                            style={{ '--h-custom': '3rem', lineHeight: '1rem' }}
                                        >
                                            {[...paymentLinkString].slice(0, 60).join('')}
                                            {paymentLinkString.length > 60 && '...'}
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
