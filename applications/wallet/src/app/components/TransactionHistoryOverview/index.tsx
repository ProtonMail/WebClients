import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import clsx from '@proton/utils/clsx';

import { BitcoinAmount } from '../../atoms';
import { Transaction } from '../../types';
import { sortTransactionsByTime } from '../../utils';

interface Props {
    transactions: Transaction[];
    max?: number;
}

export const TransactionHistoryOverview = ({ transactions, max = 7 }: Props) => {
    return (
        <>
            <ul className="p-0 mt-2">
                {sortTransactionsByTime(transactions)
                    .slice(0, max)
                    .map((transaction) => {
                        return (
                            <li
                                key={transaction.id}
                                className="flex flex-row flex-justify-space-between flex-align-items-end border-weak border-bottom py-2 px-0"
                            >
                                <div className="flex flex-column">
                                    <span className="block color-weak text-sm">
                                        {format(new Date(transaction.timestamp), 'dd MMM yyyy, hh:mm')}
                                    </span>
                                    <span className="block text-sm">{transaction.id}</span>
                                </div>
                                <div>
                                    <BitcoinAmount
                                        className={clsx(
                                            'text-sm',
                                            transaction.value < 0 ? 'color-danger' : 'color-success'
                                        )}
                                    >
                                        {transaction.value}
                                    </BitcoinAmount>
                                </div>
                            </li>
                        );
                    })}
            </ul>

            {/* TODO: connect with transaction history page when done */}
            <Button shape="underline">{c('Wallet Dashboard').t`See all transactions`} </Button>
        </>
    );
};
