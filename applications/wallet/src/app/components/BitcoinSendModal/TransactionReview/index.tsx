import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip, useModalState, useModalStateWithData } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData } from '@proton/wallet';

import { BitcoinAmount, Button, CoreButton, CoreInput } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { Price } from '../../../atoms/Price';
import { COMPUTE_BITCOIN_UNIT } from '../../../constants';
import { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { useUserWalletSettings } from '../../../store/hooks/useUserWalletSettings';
import { convertAmountStr, getLabelByUnit, isExchangeRate } from '../../../utils';
import { EmailListItem } from '../../EmailOrBitcoinAddressInput';
import { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { TextAreaModal } from '../../TextAreaModal';
import { FeesModal } from './FeesModal';
import { useTransactionReview } from './useTransactionReview';

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
    getFeesByBlockTarget: (blockTarget: number) => number | undefined;
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
    getFeesByBlockTarget,
}: Props) => {
    const [settings] = useUserWalletSettings();
    const [feesModal, setFeesModal] = useModalState();
    const [loadingSend, withLoadingSend] = useLoading();

    const [textAreaModal, setTextAreaModal] = useModalStateWithData<{ kind: 'message' | 'note' }>();

    const {
        message,
        noteToSelf,
        setMessage,
        setNoteToSelf,
        senderAddress,
        totalSentAmount,
        totalFees,
        totalAmount,
        handleSendTransaction,
    } = useTransactionReview({
        isUsingBitcoinViaEmail,
        wallet,
        account,
        unit,
        txBuilder,
        btcAddressMap,
        onSent,
    });

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
                            {convertAmountStr(totalSentAmount, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
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
                    <div className="flex flex-row w-full items-center justify-space-between">
                        <div className="flex flex-column items-start">
                            <div className="color-weak">{c('Wallet transaction').t`Network fees`}</div>

                            <div className="mb-0.5">{unit && <Price satsAmount={totalFees} unit={unit} />}</div>

                            {isExchangeRate(unit) && (
                                <div className="color-hint">
                                    <Price satsAmount={totalFees} unit={settings.BitcoinUnit} />
                                </div>
                            )}
                        </div>

                        <CoreButton
                            className="ml-4 rounded-full"
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
                        </CoreButton>

                        <FeesModal
                            unit={unit}
                            txBuilder={txBuilder}
                            updateTxBuilder={updateTxBuilder}
                            getFeesByBlockTarget={getFeesByBlockTarget}
                            {...feesModal}
                        />
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
                        <Tooltip
                            title={(() => {
                                if (!senderAddress) {
                                    return c('Wallet send')
                                        .t`You cannot send a message to the recipient because you don't have any address setup on your account`;
                                }

                                return null;
                            })()}
                        >
                            <div>
                                <CoreInput
                                    bigger
                                    dense
                                    disabled={!senderAddress}
                                    className="rounded-xl bg-norm"
                                    inputClassName="rounded-full pl-2"
                                    placeholder={c('Wallet send').t`Add Message to recipient`}
                                    value={message}
                                    onClick={() => setTextAreaModal({ kind: 'message' })}
                                    style={{ cursor: 'pointer' }}
                                    prefix={
                                        <div
                                            className="rounded-full bg-norm flex"
                                            style={{
                                                background: 'var(--interaction-weak-minor-2)',
                                                width: '2rem',
                                                height: '2rem',
                                            }}
                                        >
                                            <Icon name="speech-bubble" className="m-auto" />
                                        </div>
                                    }
                                />
                            </div>
                        </Tooltip>
                    </div>
                )}

                <div className="mt-2">
                    <CoreInput
                        bigger
                        dense
                        inputClassName="pl-2"
                        className="rounded-xl bg-norm"
                        placeholder={c('Wallet send').t`Add private note to myself`}
                        value={noteToSelf}
                        onClick={() => setTextAreaModal({ kind: 'note' })}
                        style={{ cursor: 'pointer' }}
                        prefix={
                            <div
                                className="rounded-full bg-norm flex"
                                style={{ background: 'var(--interaction-weak-minor-2)', width: '2rem', height: '2rem' }}
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
                />
            )}
        </>
    );
};
