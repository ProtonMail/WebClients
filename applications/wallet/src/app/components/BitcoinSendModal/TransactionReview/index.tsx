import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount, WasmTxBuilder } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip, useModalState, useModalStateWithData } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet';

import { Button, CoreButton } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { NoteOrMessage } from '../../../atoms/NoteOrMessage';
import { Price } from '../../../atoms/Price';
import { TEXT_AREA_MAX_LENGTH } from '../../../constants';
import type { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { useExchangeRate } from '../../../store/hooks';
import { EmailListItem } from '../../EmailListItem';
import type { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import type { RecipientDetailsModalOwnProps } from '../../RecipientDetailsModal';
import { RecipientDetailsModal } from '../../RecipientDetailsModal';
import { TextAreaModal } from '../../TextAreaModal';
import { secondaryAmount } from '../AmountInput/BitcoinAmountInputWithBalanceAndCurrencySelect';
import { FeesModal } from './FeesModal';
import { useTransactionReview } from './useTransactionReview';

import './TransactionReview.scss';

interface Props {
    isUsingBitcoinViaEmail: boolean;
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
    exchangeRate: WasmApiExchangeRate;
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    btcAddressMap: BtcAddressMap;
    onBack: () => void;
    onSent: () => void;
    onBackToEditRecipients: () => void;
    getFeesByBlockTarget: (blockTarget: number) => number | undefined;
}

export const TransactionReview = ({
    isUsingBitcoinViaEmail,
    wallet,
    account,
    exchangeRate,
    txBuilder,
    btcAddressMap,
    onBackToEditRecipients,
    onSent,
    updateTxBuilder,
    getFeesByBlockTarget,
}: Props) => {
    const [accountExchangeRate] = useExchangeRate(account.FiatCurrency);

    const [settings] = useUserWalletSettings();
    const [feesModal, setFeesModal] = useModalState();
    const [loadingSend, withLoadingSend] = useLoading();

    const [textAreaModal, setTextAreaModal] = useModalStateWithData<{ kind: 'message' | 'note' }>();
    const [recipientDetailsModal, setRecipientDetailsModal] = useModalStateWithData<RecipientDetailsModalOwnProps>();

    const {
        message,
        noteToSelf,
        setMessage,
        setNoteToSelf,
        senderAddress,
        totalSentAmount,
        totalFees,
        totalAmount,
        psbtExpectedSize,
        handleSendTransaction,
    } = useTransactionReview({
        isUsingBitcoinViaEmail,
        wallet,
        account,
        exchangeRate,
        txBuilder,
        btcAddressMap,
        onSent,
    });

    return (
        <>
            {loadingSend && (
                <div
                    className="fixed top-0 left-0 w-full h-full flex flex-column items-center justify-center"
                    style={{ background: 'var(--bg-overlay)' }}
                >
                    <CircleLoader size="medium" className="color-primary" />
                </div>
            )}

            <div className="max-w-full">
                <h2 className="text-center mb-8 text-semibold">{c('Wallet send').t`Confirm and send`}</h2>

                {/* Total sent */}
                <div className="my-8">
                    <div className="flex flex-row items-center">
                        <span className="block color-hint">{c('Wallet send').t`You are sending`}</span>
                    </div>

                    <div>
                        <BitcoinAmountInput
                            unit={exchangeRate}
                            unstyled
                            className="h1 invisible-number-input-arrow"
                            inputClassName="p-0"
                            style={{ fontSize: '3.75rem' }}
                            value={totalSentAmount}
                            prefix={typeof exchangeRate === 'object' ? exchangeRate.FiatCurrency : exchangeRate}
                        />
                    </div>

                    <span className="block color-weak">
                        {secondaryAmount({
                            key: 'hint-secondary-amount',
                            settingsBitcoinUnit: settings.BitcoinUnit,
                            secondaryExchangeRate: accountExchangeRate,
                            primaryExchangeRate: exchangeRate,
                            value: totalSentAmount,
                        })}
                    </span>
                </div>

                <div className="w-full mt-4 flex flex-row justify-space-between items-center">
                    <span className="block color-weak text-semibold">{c('Wallet send').t`Recipient`}</span>

                    <div>
                        <CoreButton size="small" shape="ghost" color="norm" onClick={() => onBackToEditRecipients()}>
                            {c('Wallet send').t`Edit`}
                        </CoreButton>
                    </div>
                </div>

                <div className="flex flex-column w-full mt-2">
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
                            <>
                                <EmailListItem
                                    key={recipientUid}
                                    index={index}
                                    name={recipient.recipient.Name ?? recipient.recipient.Address}
                                    address={recipient.recipient.Address}
                                    rightNode={
                                        txBuilder.getRecipients().length > 1 ? (
                                            <>
                                                <div
                                                    className="w-custom flex flex-column items-end mr-1 shrink-0"
                                                    style={{ '--w-custom': '7.5rem' }}
                                                >
                                                    <div className="mb-1">
                                                        {exchangeRate && (
                                                            <Price satsAmount={Number(amount)} unit={exchangeRate} />
                                                        )}
                                                    </div>

                                                    <span className="block color-hint">
                                                        {secondaryAmount({
                                                            key: 'hint-total-amount',
                                                            settingsBitcoinUnit: settings.BitcoinUnit,
                                                            secondaryExchangeRate: accountExchangeRate,
                                                            primaryExchangeRate: exchangeRate,
                                                            value: Number(amount),
                                                        })}
                                                    </span>
                                                </div>
                                                <CoreButton
                                                    className="ml-4 rounded-full bg-weak"
                                                    icon
                                                    shape="solid"
                                                    color="weak"
                                                    onClick={() => {
                                                        setRecipientDetailsModal({
                                                            recipient: {
                                                                Address: recipient.recipient.Address,
                                                                Name: recipient.recipient.Name,
                                                            },
                                                            btcAddress,
                                                            index,
                                                        });
                                                    }}
                                                >
                                                    <Icon name="chevron-right" alt={c('Action').t`Open recipient`} />
                                                </CoreButton>
                                            </>
                                        ) : (
                                            <CoreButton
                                                className="ml-4 rounded-full bg-weak"
                                                icon
                                                shape="solid"
                                                color="weak"
                                                onClick={() => {
                                                    setRecipientDetailsModal({
                                                        recipient: {
                                                            Address: recipient.recipient.Address,
                                                            Name: recipient.recipient.Name,
                                                        },
                                                        btcAddress,
                                                        index: 0,
                                                    });
                                                }}
                                            >
                                                <Icon name="chevron-right" alt={c('Action').t`Open recipient`} />
                                            </CoreButton>
                                        )
                                    }
                                />
                                <hr className="mb-0" />
                            </>
                        );
                    })}
                </div>

                <div className="flex flex-column w-full">
                    <div className="flex flex-row w-full items-center justify-space-between">
                        <div className="flex flex-column items-start">
                            <div className="color-weak mb-4 mt-3 text-semibold">{c('Wallet transaction')
                                .t`Network fee`}</div>

                            <div className="mb-1">
                                {exchangeRate && <Price satsAmount={totalFees} unit={exchangeRate} />}
                            </div>

                            <span className="block color-hint">
                                {secondaryAmount({
                                    key: 'hint-fiat-amount',
                                    settingsBitcoinUnit: settings.BitcoinUnit,
                                    secondaryExchangeRate: accountExchangeRate,
                                    primaryExchangeRate: exchangeRate,
                                    value: totalFees,
                                })}
                            </span>
                        </div>

                        <CoreButton
                            className="ml-4 rounded-full bg-weak"
                            icon
                            shape="solid"
                            color="weak"
                            onClick={() => {
                                setFeesModal(true);
                            }}
                        >
                            <Tooltip title={c('Action').t`Edit`}>
                                <Icon name="chevron-right" alt={c('Action').t`Edit`} />
                            </Tooltip>
                        </CoreButton>

                        <FeesModal
                            accountExchangeRate={accountExchangeRate}
                            exchangeRate={exchangeRate}
                            txBuilder={txBuilder}
                            updateTxBuilder={updateTxBuilder}
                            getFeesByBlockTarget={getFeesByBlockTarget}
                            psbtExpectedSize={psbtExpectedSize}
                            {...feesModal}
                        />
                    </div>

                    <hr className="my-3" />

                    <div className="flex flex-column items-start">
                        <div className="flex flex-row w-full items-center justify-space-between">
                            <div className="color-weak mb-4 text-semibold">{c('Wallet transaction')
                                .t`Total (Amount + fee)`}</div>
                        </div>

                        <div className="mb-1">
                            {exchangeRate && <Price satsAmount={totalAmount} unit={exchangeRate} />}
                        </div>

                        <span className="block color-hint">
                            {secondaryAmount({
                                key: 'hint-total-amount',
                                settingsBitcoinUnit: settings.BitcoinUnit,
                                secondaryExchangeRate: accountExchangeRate,
                                primaryExchangeRate: exchangeRate,
                                value: totalAmount,
                            })}
                        </span>
                    </div>
                </div>

                <hr className="my-3" />

                {/* Message/Note */}
                {isUsingBitcoinViaEmail && (
                    <div className="mt-2">
                        <Tooltip
                            title={(() => {
                                if (!senderAddress) {
                                    return c('Wallet send')
                                        .t`You cannot send a message to the recipient because you don't have any address setup on your account`;
                                }

                                return null;
                            })()}
                        >
                            <div className="rounded-lg w-full">
                                <NoteOrMessage
                                    handleClick={() => setTextAreaModal({ kind: 'message' })}
                                    value={message}
                                    type="message"
                                />
                            </div>
                        </Tooltip>
                    </div>
                )}

                <div className="mt-2">
                    <NoteOrMessage
                        handleClick={() => setTextAreaModal({ kind: 'note' })}
                        value={noteToSelf}
                        type="note"
                    />
                </div>

                <Button
                    color="norm"
                    shape="solid"
                    size="large"
                    shadow
                    className="mt-6"
                    fullWidth
                    onClick={() => {
                        void withLoadingSend(handleSendTransaction());
                    }}
                >{c('Wallet send').t`Confirm and send`}</Button>
            </div>

            {textAreaModal.data && (
                <TextAreaModal
                    {...(textAreaModal.data.kind === 'note'
                        ? {
                              title: 'Write a private note to yourself',
                              inputLabel: 'Note to self',
                              buttonText: 'Confirm',
                              value: noteToSelf,
                              onSubmit: (value) => {
                                  setNoteToSelf(value);
                                  textAreaModal.onClose();
                              },
                          }
                        : {
                              title: 'Write a message to your recipient(s)',
                              inputLabel: 'Message to recipient(s)',
                              buttonText: 'Confirm',
                              value: message,
                              onSubmit: (value) => {
                                  setMessage(value);
                                  textAreaModal.onClose();
                              },
                          })}
                    {...textAreaModal}
                    maxLength={TEXT_AREA_MAX_LENGTH}
                />
            )}
            {recipientDetailsModal.data && (
                <RecipientDetailsModal {...recipientDetailsModal.data} {...recipientDetailsModal} />
            )}
        </>
    );
};
