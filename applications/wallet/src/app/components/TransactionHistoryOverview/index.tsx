import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { WasmSimpleTransaction } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { confirmationTimeToHumanReadable, sortTransactionsByTime } from '../../utils';

interface Props {
    transactions: WasmSimpleTransaction[];
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
                                // same transaction can appear several time with different values or sign when user did a self-transfer or used several wallets/accounts to do the transaction
                                key={`${transaction.txid}_${transaction.value}`}
                                className="flex flex-row justify-space-between items-end border-weak border-bottom py-2 px-0"
                            >
                                <div className="flex flex-column">
                                    <span className="block color-weak text-sm">
                                        {confirmationTimeToHumanReadable(transaction.confirmation)}
                                    </span>
                                    <Tooltip title={transaction.txid}>
                                        <span className="block text-sm">
                                            {transaction.txid.slice(0, 7)}...{transaction.txid.slice(-6)}
                                        </span>
                                    </Tooltip>
                                </div>
                                <div>
                                    <BitcoinAmount
                                        className={clsx(
                                            'text-sm',
                                            transaction.value < 0 ? 'color-danger' : 'color-success'
                                        )}
                                    >
                                        {Number(transaction.value)}
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
