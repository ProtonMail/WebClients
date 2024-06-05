import { useState } from 'react';

import { c } from 'ttag';

import { Icon, Price, useModalStateWithData } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../../atoms';
import { ConfirmationTimeDataListItem } from '../../components/TransactionList/data-list-items';
import { TransactionNoteModal } from '../../components/TransactionNoteModal';
import { TransactionData } from '../../hooks/useWalletTransactions';
import { satsToBitcoin, satsToFiat } from '../../utils';
import {
    AmountDataListItem,
    MessageDataListItem,
    NoteDataListItem,
    RecipientsDataListItem,
    SendersDataListItem,
} from './data-items';

interface Props {
    transaction: TransactionData;
}

export const WalletTransactionDataDrawer = ({ transaction }: Props) => {
    const [showMore, setShowMore] = useState(false);
    const exchangeRate = transaction.apiData?.ExchangeRate ?? undefined;

    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();

    const isSender = transaction.networkData.sent > transaction.networkData.received;
    /**
     * If user is sender, we want to display what the amount he actually sent, without change output amount and feees
     * If user is recipient, we want to the amount he received
     */
    const value = isSender
        ? transaction.networkData.sent - (transaction.networkData.fee ?? 0) - transaction.networkData.received
        : transaction.networkData.received - transaction.networkData.sent;

    return (
        <>
            <div className="flex flex-column">
                <div className="flex flex-column mb-10">
                    <div className="flex flex-row flex-nowrap items-center my-1">
                        <div className={clsx('text-semibold')}>
                            <Price
                                currency={exchangeRate?.FiatCurrency}
                                className="h1 text-semibold"
                                wrapperClassName="contrast"
                            >
                                {exchangeRate ? satsToFiat(value, exchangeRate).toFixed(2) : '-'}
                            </Price>
                        </div>
                    </div>
                    <div className="text-lg color-hint">{satsToBitcoin(value)} BTC</div>
                </div>

                <ConfirmationTimeDataListItem tx={transaction} />

                <hr className="my-4" />
                <RecipientsDataListItem tx={transaction} />

                <hr className="my-4" />
                <SendersDataListItem tx={transaction} />

                {transaction.apiData?.Body && (
                    <>
                        <hr className="my-4" />
                        <MessageDataListItem tx={transaction} />
                    </>
                )}

                <hr className="my-4" />

                <NoteDataListItem
                    tx={transaction}
                    onClick={() => {
                        setNoteModalState({ transaction });
                    }}
                />
                <hr className="my-4" />

                {showMore ? (
                    <>
                        <AmountDataListItem
                            amount={transaction.networkData.fee}
                            label={c('Wallet transaction').t`Network fee`}
                            exchangeRate={exchangeRate}
                        />

                        <hr className="my-4" />

                        <AmountDataListItem
                            amount={(transaction.networkData.fee ?? 0) + value}
                            label={c('Wallet transaction').t`Total (sent amount + fee)`}
                            exchangeRate={exchangeRate}
                        />
                    </>
                ) : (
                    <div>
                        <CoreButton shape="ghost" size="small" className="color-hint" onClick={() => setShowMore(true)}>
                            {c('Wallet transaction').t`View more`} <Icon name="chevron-down" size={3} />
                        </CoreButton>
                    </div>
                )}
            </div>

            <TransactionNoteModal
                onUpdateLabel={() => {
                    // TODO: maybe create slice in store for wallet transactions
                    // void updateWalletTransaction(label, tx).then(() => {
                    //     noteModalState.onClose?.();
                    // });
                }}
                {...noteModalState}
            />
        </>
    );
};
