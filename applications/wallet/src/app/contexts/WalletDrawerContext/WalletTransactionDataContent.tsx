import { useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import { ConfirmationTimeDataListItem } from '../../components/TransactionList/data-list-items';
import { TransactionData } from '../../hooks/useWalletTransactions';
import { satsToBitcoin } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';
import {
    AmountDataListItem,
    LinkToBlockchainItem,
    MessageDataListItem,
    NoteDataListItem,
    RecipientsDataListItem,
    SendersDataListItem,
} from './data-items';

interface Props {
    transaction: TransactionData;
    onClickEditNote: () => void;
}

export const WalletTransactionDataDrawer = ({ transaction, onClickEditNote }: Props) => {
    const [showMore, setShowMore] = useState(false);
    const { network } = useBitcoinBlockchainContext();
    const exchangeRate = transaction.apiData?.ExchangeRate ?? undefined;

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
                                unit={exchangeRate ?? 'BTC'}
                                className="h1 text-semibold"
                                wrapperClassName="contrast"
                                satsAmount={value}
                            />
                        </div>
                    </div>
                    {exchangeRate && <div className="text-lg color-hint">{satsToBitcoin(value)} BTC</div>}
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
                        onClickEditNote();
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

                        <LinkToBlockchainItem tx={transaction} network={network} />
                    </>
                ) : (
                    <div>
                        <CoreButton shape="ghost" size="small" className="color-hint" onClick={() => setShowMore(true)}>
                            {c('Wallet transaction').t`View more`} <Icon name="chevron-down" size={3} />
                        </CoreButton>
                    </div>
                )}
            </div>
        </>
    );
};
