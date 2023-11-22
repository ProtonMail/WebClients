import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Alert, Copy, Icon, InputFieldTwo, QRCode, Tooltip } from '@proton/components/components';
import { SECOND } from '@proton/shared/lib/constants';

import { Selector } from './Selector';
import { getLightningFormatOptions } from './constants';
import { useBitcoinReceiveInfoGenerator } from './useBitcoinReceiveInfoGenerator';

// TODO: remove when wallets api is ready
const wallets: any[] = [
    { kind: 'lightning', name: 'lightning 01', id: 0, balance: 167 },
    { kind: 'bitcoin', name: 'Bitcoin 01', id: 1, balance: 1783999 },
];

// TODO: remove when accounts api is ready
const accounts: any[] = [
    { name: 'account #1', id: 0 },
    { name: 'account #2', id: 1 },
    { name: 'account #3', id: 2 },
];

const CopyPasteButton = ({ value }: { value: string }) => {
    const defaultTitle = c('Wallet Receive').t`Copy address`;
    const [title, setTitle] = useState(defaultTitle); // TODO change copy in relation with kind of generated payment info

    return (
        <div className="mt-8">
            <Copy
                value={value}
                className="flex flex-row flex-align-items-center"
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

export const BitcoinReceiveInfoGenerator = () => {
    const {
        serializedPaymentInformation,
        selectedWallet,
        selectedAccount,
        selectedFormat,
        shouldShowAmountInput,
        amount,
        handleSelectWallet,
        handleSelectAccount,
        handleSelectFormat,
        handleChangeAmount,
        showAmountInput,
    } = useBitcoinReceiveInfoGenerator();

    const [walletSelectorLabel, accountSelectorLabel, formatSelectorLabel, amountInputLabel] = [
        c('Wallet Receive').t`Receive to wallet`,
        c('Wallet Receive').t`On account`,
        c('Wallet Receive').t`Using format`,
        c('Wallet Receive').t`Amount`,
    ];

    return (
        <div className="bg-weak flex flex-column flex-align-items-center">
            {/* Wallets and Account/format selector */}
            <div className="flex w-full flex-row px-8">
                <Selector
                    id="wallet-selector"
                    label={walletSelectorLabel}
                    selected={selectedWallet.id}
                    onSelect={handleSelectWallet}
                    options={wallets.map((wallet) => ({ value: wallet.id, label: wallet.name }))}
                />

                {selectedWallet.kind === 'bitcoin' && (
                    <Selector
                        id="account-selector"
                        label={accountSelectorLabel}
                        selected={selectedAccount.id}
                        onSelect={handleSelectAccount}
                        options={accounts.map((account) => ({ value: account.id, label: account.name }))}
                    />
                )}

                {selectedWallet.kind === 'lightning' && (
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
                            min={0}
                            max={selectedWallet?.balance ?? 0}
                            className="mt-2"
                            id="amount-input"
                            data-testid="amount-input"
                            value={amount}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                handleChangeAmount(Number(event.target.value));
                            }}
                            suffix="SATS"
                        />
                    </div>
                ) : (
                    <div className="mt-6 w-3/10 flex flex-row flex-justify-center">
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
            {serializedPaymentInformation && (
                <Card
                    className="flex flex-row flex-item-shrink bg-norm mx-auto mb-8 p-8"
                    rounded
                    background={false}
                    bordered={false}
                >
                    <div className="mr-8 w-custom" style={{ '--w-custom': '15rem' }}>
                        <QRCode data-testid="serialized-payment-info-qrcode" value={serializedPaymentInformation} />
                    </div>
                    <div
                        className="flex flex-column w-custom flex-justify-space-between"
                        style={{ '--w-custom': '15rem' }}
                    >
                        <h3 className="text-lg text-semibold mt-4">{selectedWallet.name}</h3>
                        <Tooltip title={serializedPaymentInformation}>
                            <p
                                className="text-monospace h-custom bg-norm m-0 text-break overflow-hidden"
                                style={{ '--h-custom': '3rem', lineHeight: '1rem' }}
                            >
                                {[...serializedPaymentInformation].slice(0, 60).join('')}
                                {serializedPaymentInformation.length > 60 && '...'}
                            </p>
                        </Tooltip>

                        <CopyPasteButton value={serializedPaymentInformation} />

                        <Alert type="warning" className="text-xs lh-xs">
                            {c('Wallet Receive').t`Disclaimer: fees might apply`}
                        </Alert>
                    </div>
                </Card>
            )}
        </div>
    );
};
