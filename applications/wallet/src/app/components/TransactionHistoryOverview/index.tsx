import { Link } from 'react-router-dom';

import { isNumber } from 'lodash';
import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import { IWasmSimpleTransactionArray } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { confirmationTimeToHumanReadable, sortTransactionsByTime } from '../../utils';

interface Props {
    walletId?: number;
    transactions: IWasmSimpleTransactionArray;
    max?: number;
}

export const TransactionHistoryOverview = ({ walletId, transactions, max = 7 }: Props) => {
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
                                        {confirmationTimeToHumanReadable(transaction.time)}
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
                                            Number(transaction.value) < 0 ? 'color-danger' : 'color-success'
                                        )}
                                    >
                                        {Number(transaction.value)}
                                    </BitcoinAmount>
                                </div>
                            </li>
                        );
                    })}
            </ul>

            <ButtonLike
                as={Link}
                to={isNumber(walletId)! ? `/transactions#walletId=${walletId}` : '/transactions'}
                shape="underline"
            >
                {c('Wallet Dashboard').t`See all transactions`}{' '}
            </ButtonLike>
        </>
    );
};
