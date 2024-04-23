import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { WasmTransactionDetails } from '@proton/andromeda';
import ButtonLike from '@proton/atoms/Button/ButtonLike';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { useWalletSettings } from '@proton/wallet';

import { BitcoinAmount } from '../../atoms';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { confirmationTimeToHumanReadable } from '../../utils';

interface Props {
    walletId?: string;
    transactions: WasmTransactionDetails[];
    max?: number;
}

export const TransactionHistoryOverview = ({ walletId, transactions, max = 7 }: Props) => {
    const [walletSettings, loadingSettings] = useWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useUserExchangeRate();

    return (
        <>
            <ul className="p-0 mt-2">
                {transactions.slice(0, max).map((transaction) => {
                    const txValue = Number(transaction.received) - Number(transaction.sent);

                    return (
                        <li
                            // same transaction can appear several time with different values or sign when user did a self-transfer or used several wallets/accounts to do the transaction
                            key={`${transaction.txid}_${txValue}`}
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
                                    unit={{ value: walletSettings?.BitcoinUnit, loading: loadingSettings }}
                                    exchangeRate={{ value: exchangeRate, loading: loadingExchangeRate }}
                                    bitcoin={Number(txValue)}
                                    showColor
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            <ButtonLike
                as={Link}
                to={walletId ? `/transactions#walletId=${walletId}` : '/transactions'}
                shape="underline"
            >
                {c('Wallet Dashboard').t`See all transactions`}
            </ButtonLike>
        </>
    );
};
