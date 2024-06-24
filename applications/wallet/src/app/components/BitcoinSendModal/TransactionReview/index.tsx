import { ChangeEvent, useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, IconName, Tooltip, useModalState } from '@proton/components/components';
import { useAddresses, useGetAddressKeys, useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData } from '@proton/wallet';

import { BitcoinAmount, Button, CoreButton, CoreInput, Modal } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { Price } from '../../../atoms/Price';
import { COMPUTE_BITCOIN_UNIT } from '../../../constants';
import { usePsbt } from '../../../hooks/usePsbt';
import { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { useUserWalletSettings } from '../../../store/hooks/useUserWalletSettings';
import { convertAmount, getLabelByUnit, isExchangeRate } from '../../../utils';
import { useAsyncValue } from '../../../utils/hooks/useAsyncValue';
import { EmailListItem } from '../../EmailOrBitcoinAddressInput';
import { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { useFeesInput } from './useFeesInput';

import './TransactionReview.scss';

interface Props {
    isUsingBitcoinViaEmail: boolean;
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
    isUsingBitcoinViaEmail,
    wallet,
    account,
    unit,
    txBuilder,
    btcAddressMap,
    onBackToEditRecipients,
    onSent,
    updateTxBuilder,
}: Props) => {
    const [addresses] = useAddresses();
    // We use primaryAddress when user wants to use BvE but doesn't have any email set on the wallet account he is using
    const primaryAddress = addresses?.[0];
    const [showMore, setShowMore] = useState(false);
    const txBuilderRecipients = txBuilder.getRecipients();
    const { createNotification } = useNotifications();
    const [settings] = useUserWalletSettings();
    const [feesModal, setFeesModal] = useModalState();
    const { getFeesByBlockTarget } = useFeesInput(txBuilder);
    const [loadingSend, withLoadingSend] = useLoading();

    const getAddressKeys = useGetAddressKeys();

    const [message, setMessage] = useState('');
    const [noteToSelf, setNoteToSelf] = useState('');

    const { createDraftPsbt, psbt, signAndBroadcastPsbt } = usePsbt({ txBuilder }, true);

    const totalFees = Number(psbt?.total_fees ?? 0);
    const totalSentAmount = txBuilderRecipients.reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const totalAmount = totalFees + totalSentAmount;

    // Typeguard, no recipient should be undefined here
    const recipients = compact(txBuilder.getRecipients().map((r) => btcAddressMap[r[1]]));

    const handleSendTransaction = async () => {
        try {
            const accountPrimaryAddressesKeys = await Promise.all(
                account.Addresses.map(async ({ ID }) => {
                    const [primaryAddressKey] = await getAddressKeys(ID);
                    return primaryAddressKey;
                })
            );

            const signingKeys = accountPrimaryAddressesKeys.map((k) => k.privateKey);
            const senderEncryptionKeys = accountPrimaryAddressesKeys.map((k) => k.publicKey);

            await signAndBroadcastPsbt(
                {
                    apiAccount: account,
                    apiWalletData: wallet,
                    exchangeRateId: isExchangeRate(unit) ? unit?.ID : undefined,
                    noteToSelf: noteToSelf || undefined,
                    message: message || undefined,
                    signingKeys,
                    encryptionKeys: [...senderEncryptionKeys, ...compact(recipients.map((r) => r.addressKey))],
                    addressId: account.Addresses[0]?.ID ?? primaryAddress?.ID,
                },
                isUsingBitcoinViaEmail
            );

            onSent();

            createNotification({
                text: c('Wallet send').t`Transaction was successfully sent`,
            });
        } catch (error) {
            createNotification({
                type: 'error',
                text:
                    typeof error === 'object' && error && 'message' in error
                        ? (error.message as string)
                        : c('Wallet send').t`The transaction could not be sent. Please try again later`,
            });
        }
    };

    const getTransactionFeesAtFeeRate = async (feeRate: number) => {
        const updatedTxBuilder = await txBuilder.setFeeRate(BigInt(feeRate));
        const psbt = await createDraftPsbt(updatedTxBuilder);
        return Number(psbt?.total_fees ?? 0);
    };

    const getFeeOption = async (
        icon: IconName,
        text: string,
        blockTarget: number
    ): Promise<[IconName, string, number, number]> => {
        const feeRate = getFeesByBlockTarget(blockTarget);
        return [icon, text, feeRate, await getTransactionFeesAtFeeRate(feeRate)];
    };

    const feeOptions = useAsyncValue<[IconName, string, number, number][]>(
        Promise.all([
            getFeeOption('chevron-up', c('Wallet send').t`High priority`, 2),
            getFeeOption('minus', c('Wallet send').t`Median priority`, 5),
            getFeeOption('chevron-down', c('Wallet send').t`Low priority`, 10),
        ]),
        []
    );

    return (
        <>
            {loadingSend && (
                <div
                    className="fixed top-0 left-0 w-full h-full flex flex-column items-center justify-center"
                    style={{ background: '#e2e2e277' }}
                >
                    <CircleLoader size="medium" className="color-primary" />
                </div>
            )}

            <div className="max-w-full">
                <h2 className="text-center mb-8 text-semibold">{c('Wallet send').t`Review`}</h2>

                {/* Total sent */}
                <div className="my-10">
                    <div className="flex flex-row items-center">
                        <span className="block color-hint">{c('Wallet send').t`You are sending`}</span>

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
                            value={totalSentAmount}
                            prefix={typeof unit === 'object' ? unit.FiatCurrency : unit}
                        />
                    </div>
                    {isExchangeRate(unit) && (
                        <span className="block color-weak">
                            {convertAmount(totalSentAmount, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                            {getLabelByUnit(settings.BitcoinUnit)}
                        </span>
                    )}
                </div>

                <div className="w-full mt-4 flex flex-row justify-space-between items-center">
                    <span className="block color-weak">{c('Wallet send').t`Recipients`}</span>

                    <div>
                        <CoreButton size="small" shape="ghost" color="norm" onClick={() => onBackToEditRecipients()}>
                            {c('Wallet send').t`Edit recipients`}
                        </CoreButton>
                    </div>
                </div>

                <div className="flex flex-column w-full mt-2 mb-4">
                    {txBuilder.getRecipients().map((txBuilderRecipient, index) => {
                        const recipientUid = txBuilderRecipient[0];
                        const btcAddress = txBuilderRecipient[1];
                        const amount = txBuilderRecipient[2];

                        const recipient = btcAddressMap[btcAddress];

                        // Typeguard, no recipient should be undefined here
                        if (!recipient) {
                            return null;
                        }

                        return (
                            <EmailListItem
                                key={recipientUid}
                                index={index}
                                name={recipient.recipient.Name ?? recipient.recipient.Address}
                                address={recipient.recipient.Address}
                                rightNode={
                                    txBuilder.getRecipients().length > 1 ? (
                                        <div
                                            className="w-custom flex flex-column items-end mr-1 no-shrink"
                                            style={{ '--w-custom': '7.5rem' }}
                                        >
                                            <BitcoinAmount
                                                bitcoin={Number(amount)}
                                                unit={{ value: settings.BitcoinUnit }}
                                                exchangeRate={isExchangeRate(unit) ? { value: unit } : undefined}
                                                firstClassName="text-right"
                                                secondClassName="text-right"
                                            />
                                        </div>
                                    ) : null
                                }
                            />
                        );
                    })}
                </div>

                <div className="flex flex-column w-full mb-7">
                    <div className="flex flex-column items-start">
                        <div className="flex flex-row w-full items-center justify-space-between">
                            <div className="color-weak">{c('Wallet transaction').t`Network fees`}</div>
                            <Button
                                className="ml-4 rounded-full"
                                size="small"
                                icon
                                shape="solid"
                                color="weak"
                                onClick={() => {
                                    setFeesModal(true);
                                }}
                            >
                                <Tooltip title={c('Wallet send').t`Edit`}>
                                    <Icon name="pencil" alt={c('Wallet send').t`Edit`} />
                                </Tooltip>
                            </Button>
                        </div>

                        <div className="mb-0.5">{unit && <Price satsAmount={totalFees} unit={unit} />}</div>

                        {isExchangeRate(unit) && (
                            <div className="color-hint">
                                <Price satsAmount={totalFees} unit={settings.BitcoinUnit} />
                            </div>
                        )}

                        <Modal
                            {...feesModal}
                            className="fees-selection-modal"
                            header={
                                <div className="flex flex-row justify-space-between px-6 items-center mt-4">
                                    <h1 className="text-lg text-semibold">{c('Wallet send').t`Network fees`}</h1>

                                    <Tooltip title={c('Action').t`Close`}>
                                        <Button
                                            className="shrink-0 rounded-full bg-norm"
                                            icon
                                            size="small"
                                            shape="ghost"
                                            data-testid="modal:close"
                                            onClick={feesModal.onClose}
                                        >
                                            <Icon
                                                className="modal-close-icon"
                                                name="cross-big"
                                                alt={c('Action').t`Close`}
                                            />
                                        </Button>
                                    </Tooltip>
                                </div>
                            }
                        >
                            <div className="flex flex-column">
                                {feeOptions.map(([iconName, text, feeRate, feesAtFeeRate]) => (
                                    <button
                                        key={feeRate}
                                        onClick={() => {
                                            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(feeRate)));
                                            feesModal.onClose?.();
                                        }}
                                        className="fees-selection-button unstyled flex flex-row p-4 items-center"
                                    >
                                        <Icon name={iconName} />
                                        <div className="mx-4">{text}</div>
                                        <div className="flex flex-column items-end ml-auto">
                                            <BitcoinAmount
                                                bitcoin={feesAtFeeRate}
                                                unit={{ value: settings.BitcoinUnit }}
                                                exchangeRate={isExchangeRate(unit) ? { value: unit } : undefined}
                                                firstClassName="text-right"
                                                secondClassName="text-right"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Modal>
                    </div>

                    <hr className="my-2" />

                    <div className="flex flex-column items-start">
                        <div className="flex flex-row w-full items-center justify-space-between">
                            <div className="color-weak">{c('Wallet transaction').t`Total (sent amount + fees)`}</div>
                        </div>

                        <div className="mb-0.5">{unit && <Price satsAmount={totalAmount} unit={unit} />}</div>

                        {isExchangeRate(unit) && (
                            <div className="color-hint">
                                <Price satsAmount={totalAmount} unit={settings.BitcoinUnit} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Message/Note */}
                {isUsingBitcoinViaEmail && (
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
                                    style={{
                                        background: 'var(--interaction-weak-major-2)',
                                        width: '2rem',
                                        height: '2rem',
                                    }}
                                >
                                    <Icon name="speech-bubble" className="m-auto" />
                                </div>
                            }
                        />
                    </div>
                )}

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
                    onClick={() => {
                        void withLoadingSend(handleSendTransaction());
                    }}
                >{c('Wallet send').t`Send`}</Button>
            </div>
        </>
    );
};
