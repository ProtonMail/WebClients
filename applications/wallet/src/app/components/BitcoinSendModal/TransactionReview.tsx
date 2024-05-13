import { ChangeEvent, useEffect, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import { Icon } from '@proton/components/components';
import useVerifyOutboundPublicKeys from '@proton/components/containers/keyTransparency/useVerifyOutboundPublicKeys';
import { useApi, useNotifications } from '@proton/components/hooks';
import { CryptoProxy } from '@proton/crypto/lib';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, CoreInput } from '../../atoms';
import { BitcoinAmountInput } from '../../atoms/BitcoinAmountInput';
import { Price } from '../../atoms/Price';
import { usePsbt } from '../../hooks/usePsbt';
import { TxBuilderUpdater } from '../../hooks/useTxBuilder';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { convertAmount } from '../../utils';
import { BtcAddressMap } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { RecipientListItem } from './RecipientListItem';

interface Props {
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    btcAddressMap: BtcAddressMap;
    onBack: () => void;
    onSent: () => void;
    onBackToEditRecipients: () => void;
}

export const TransactionReview = ({
    wallet,
    account,
    unit,
    txBuilder,
    btcAddressMap,
    onBack,
    onBackToEditRecipients,
    onSent,
}: Props) => {
    const [showMore, setShowMore] = useState(false);
    const [exchangeRate] = useUserExchangeRate();
    const txBuilderRecipients = txBuilder.getRecipients();
    const { createNotification } = useNotifications();
    const api = useApi();

    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();

    const [message, setMessage] = useState('');
    const [noteToSelf, setNoteToSelf] = useState('');

    const { createPsbt, finalPsbt, signAndBroadcastPsbt } = usePsbt({ txBuilder });
    useEffect(() => {
        void createPsbt();
    }, [createPsbt, txBuilder]);

    const totalFees = Number(finalPsbt?.total_fees ?? 0);
    const totalSentAmount = txBuilderRecipients.reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const totalAmount = totalFees + totalSentAmount;

    // Typeguard, no recipient should be undefined here
    const recipients = compact(txBuilder.getRecipients().map((r) => btcAddressMap[r[1]]));
    const [firstRecipient] = recipients;

    const handleSendTransaction = async () => {
        if (!exchangeRate) {
            return;
        }

        try {
            const accountAddressesKeys = await Promise.all(
                account.Addresses.map(async ({ Email }) => {
                    const keys = await getAndVerifyApiKeys({
                        api,
                        email: Email,
                        internalKeysOnly: true,
                        verifyOutboundPublicKeys,
                    });

                    const [primaryKey] = keys.addressKeys;

                    return CryptoProxy.importPublicKey({ armoredKey: primaryKey.armoredKey });
                })
            );

            await signAndBroadcastPsbt({
                apiAccount: account,
                apiWalletData: wallet,
                exchangeRateId: exchangeRate?.ID,
                noteToSelf,
                message,
                encryptionKeys: [...accountAddressesKeys, ...compact(recipients.map((r) => r.addressKey))],
            });

            createNotification({
                text: c('Wallet send').t`Transaction was succesfully sent`,
            });

            onSent();
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('Wallet send').t`The transaction could be sent. Please try again later`,
            });
        }
    };

    return (
        <div>
            {/* Recipients */}
            <div>
                <RecipientListItem
                    {...(recipients.length > 1 ? { recipients } : { recipient: firstRecipient })}
                    onClickEdit={onBackToEditRecipients}
                />
            </div>

            {/* Total sent */}
            <div className="my-10">
                <div className="flex flex-row items-center">
                    <span className="block color-hint">{c('Wallet send').t`Total amount (sent + fees)`}</span>

                    {!showMore && (
                        <CoreButton
                            size="small"
                            shape="ghost"
                            color="norm"
                            className="block ml-2"
                            onClick={() => setShowMore(true)}
                        >
                            {c('Wallet send').t`View details`}
                        </CoreButton>
                    )}
                </div>

                <div>
                    <BitcoinAmountInput
                        unit={unit}
                        unstyled
                        className="h1 invisible-number-input-arrow"
                        inputClassName="p-0"
                        style={{ fontSize: '3.75rem' }}
                        value={totalAmount}
                        prefix={typeof unit === 'object' ? unit.FiatCurrency : unit}
                    />
                </div>
                <span className="block color-weak">{convertAmount(totalAmount, 'SATS', 'BTC')} BTC</span>
            </div>

            {/* Show more */}

            {showMore && (
                <div className="flex flex-column w-full mb-7">
                    <div className="flex flex-row flex-nowrap color-hint w-full gap-1">
                        <div className="w-3/10">{c('Wallet transaction').t`Sent amount`}</div>
                        <div className="w-2/10 flex">
                            <div className="ml-auto">
                                {exchangeRate && <Price satsAmount={totalAmount} unit={exchangeRate} />}
                            </div>
                        </div>
                        <div className="w-3/10 flex">
                            <div className="ml-auto">
                                <Price satsAmount={totalAmount} unit={'BTC'} />
                            </div>
                        </div>
                        <CoreButton
                            size="small"
                            shape="ghost"
                            color="norm"
                            className="mx-auto py-0 w-2/10"
                            onClick={() => onBack()}
                        >
                            {c('Wallet send').t`Edit`}
                        </CoreButton>
                    </div>

                    <hr className="my-2" />

                    <div className="flex flex-row flex-nowrap color-hint w-full gap-1">
                        <div className="w-3/10">{c('Wallet transaction').t`Network fees`}</div>
                        <div className="w-2/10 flex">
                            <div className="ml-auto">
                                {exchangeRate && <Price satsAmount={totalFees} unit={exchangeRate} />}
                            </div>
                        </div>
                        <div className="w-3/10 flex">
                            <div className="ml-auto">
                                <Price satsAmount={totalFees} unit={'BTC'} />
                            </div>
                        </div>
                        <CoreButton
                            size="small"
                            shape="ghost"
                            color="norm"
                            className="mx-auto py-0 w-2/10"
                            onClick={() => onBack()}
                        >
                            {c('Wallet send').t`Edit`}
                        </CoreButton>
                    </div>
                </div>
            )}

            {/* Message/Note */}
            <div className="mt-2">
                <CoreInput
                    bigger
                    dense
                    inputClassName="rounded-full pl-2"
                    className="rounded-xl"
                    placeholder={c('Wallet send').t`Add Message to recipient`}
                    value={message}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                    prefix={
                        <div
                            className="rounded-full bg-norm flex"
                            style={{ background: 'var(--interaction-weak-major-2)', width: '2rem', height: '2rem' }}
                        >
                            <Icon name="speech-bubble" className="m-auto" />
                        </div>
                    }
                />
            </div>
            <div className="mt-2">
                <CoreInput
                    bigger
                    dense
                    inputClassName="pl-2"
                    className="rounded-xl"
                    placeholder={c('Wallet send').t`Add private note to myself`}
                    value={noteToSelf}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteToSelf(e.target.value)}
                    prefix={
                        <div
                            className="rounded-full bg-norm flex"
                            style={{ background: 'var(--interaction-weak-major-2)', width: '2rem', height: '2rem' }}
                        >
                            <Icon name="note" className="m-auto" />
                        </div>
                    }
                />
            </div>

            <Button
                color="norm"
                shape="solid"
                className="mt-6"
                fullWidth
                pill
                onClick={() => handleSendTransaction()}
            >{c('Wallet send').t`Send`}</Button>
        </div>
    );
};
