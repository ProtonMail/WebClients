import { Link } from 'react-router-dom';

import { isNumber } from 'lodash';
import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

import { IWasmSimpleTransactionArray, WasmBitcoinUnit } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { confirmationTimeToHumanReadable, sortTransactionsByTime } from '../../utils';

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

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
                        const txValue = Number(transaction.received) - Number(transaction.sent);
                        return (
                            <li
                                // same transaction can appear several time with different values or sign when user did a self-transfer or used several wallets/accounts to do the transaction
                                key={`${transaction.txid}_${txValue}`}
                                className="flex flex-row justify-space-between items-end border-weak border-bottom py-2 px-0"
                            >
                                <div className="flex flex-column">
                                    <span className="block color-weak text-sm">
                                        {confirmationTimeToHumanReadable(transaction.confirmation_time)}
                                    </span>
                                    <Tooltip title={transaction.txid}>
                                        <span className="block text-sm">
                                            {transaction.txid.slice(0, 7)}...{transaction.txid.slice(-6)}
                                        </span>
                                    </Tooltip>
                                </div>
                                <div>
                                    <BitcoinAmount unit={bitcoinUnit} fiat={fiatCurrency} bitcoin={Number(txValue)} />
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
