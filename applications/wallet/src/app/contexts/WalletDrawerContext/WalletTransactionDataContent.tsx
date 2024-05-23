import { useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { Icon, Price, useModalStateWithData } from '@proton/components/components';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../atoms';
import { ConfirmationTimeDataListItem } from '../../components/TransactionList/data-list-items';
import { TransactionNoteModal } from '../../components/TransactionNoteModal';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
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
    apiWalletData: IWasmApiWalletData;
    apiAccount: WasmApiWalletAccount | undefined;
    transaction: TransactionData;
}

export const WalletTransactionDataDrawer = ({ apiAccount, apiWalletData, transaction }: Props) => {
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(
        apiAccount ?? apiWalletData.WalletAccounts[0]
    );

    const [showMore, setShowMore] = useState(false);

    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();

    const value = transaction.networkData.received - transaction.networkData.sent;

    return (
        <>
            <div className="flex flex-column">
                <div className="flex flex-column mb-10">
                    <div className="flex flex-row flex-nowrap items-center my-1">
                        <div className={clsx('text-semibold', loadingExchangeRate && 'skeleton-loader')}>
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
                            amount={(transaction.networkData.fee ?? 0) + transaction.networkData.sent}
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
