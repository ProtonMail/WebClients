import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

import { IWasmSimpleTransaction, IWasmSimpleTransactionArray, WasmDerivationPath, WasmPagination } from '../../../pkg';
import { BitcoinAmount, SimplePaginator } from '../../atoms';
import { ITEMS_PER_PAGE } from '../../constants';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { confirmationTimeToHumanReadable } from '../../utils';
import { OnchainTransactionDetailsProps } from '../OnchainTransactionDetails';
import { OnchainTransactionDetailsModal } from '../OnchainTransactionDetailsModal';

interface Props {
    wallet?: WalletWithAccountsWithBalanceAndTxs;
}

export const TransactionList = ({ wallet }: Props) => {
    const [transactions, setTransactions] = useState<IWasmSimpleTransactionArray>([]);
    const [modalData, setModalData] = useState<OnchainTransactionDetailsProps>();

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();

    const handleClickRow = useCallback(
        async (simpleTx: IWasmSimpleTransaction) => {
            if (simpleTx.account_key) {
                const account = wallet?.wasmWallet.getAccount(WasmDerivationPath.fromRawTs(simpleTx.account_key));

                if (!account) {
                    return;
                }

                const tx = await account.getTransaction(simpleTx.txid);

                if (tx) {
                    setModalData({ tx, account });
                }
            }
        },
        [wallet?.wasmWallet]
    );

    useEffect(() => {
        handleGoFirst();
    }, [wallet?.wasmWallet, handleGoFirst]);

    useEffect(() => {
        const pagination = new WasmPagination(currentPage * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
        wallet?.wasmWallet.getTransactions(pagination).then((transactions) => {
            setTransactions(transactions);
        });
    }, [currentPage, wallet?.wasmWallet]);

    return (
        <>
            <div className="flex flex-column mt-4 flex-nowrap grow">
                <div className="flex flex-column flex-nowrap mb-2">
                    <div className="overflow-auto">
                        <Table className="text-sm" borderWeak>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell className="w-2/10">{c('Wallet Transaction List')
                                        .t`Id`}</TableHeaderCell>
                                    <TableHeaderCell className="w-2/10">{c('Wallet Transaction List')
                                        .t`Date`}</TableHeaderCell>
                                    <TableHeaderCell className="w-4/10">{c('Wallet Transaction List')
                                        .t`Label`}</TableHeaderCell>
                                    <TableHeaderCell className="w-2/10 text-right">{c('Wallet Transaction List')
                                        .t`Amount`}</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    // TXid cannot be assumed unique because of itnra-wallet self-transfers
                                    <TableRow
                                        key={`${transaction.txid}-${transaction.value}`}
                                        className="cursor-pointer"
                                        onClick={() => handleClickRow(transaction)}
                                    >
                                        <TableCell>
                                            <div className="flex flex-column">
                                                <Tooltip title={transaction.txid}>
                                                    <span className="inline-block max-w-full text-lg text-ellipsis">
                                                        {transaction.txid}
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-column">
                                                <span className="text-lg">
                                                    {confirmationTimeToHumanReadable(transaction.time)}
                                                </span>
                                                <span className="color-hint">
                                                    {transaction.time.confirmed
                                                        ? c('Wallet Transaction List').t`Processed`
                                                        : c('Wallet Transaction List').t`Processing`}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-column">
                                                <span className="text-lg">TODO</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-column text-right">
                                                <BitcoinAmount
                                                    className="text-lg"
                                                    fiat="USD"
                                                    fiatClassName="ml-auto"
                                                    showColor
                                                    showExplicitSign
                                                >
                                                    {Number(transaction.value)}
                                                </BitcoinAmount>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                    <span className="block mr-4">{c('Wallet Dashboard').t`Page ${currentPage}`}</span>

                    <SimplePaginator
                        canGoPrev={currentPage > 0}
                        onNext={handleNext}
                        canGoNext={transactions.length >= ITEMS_PER_PAGE}
                        onPrev={handlePrev}
                    />
                </div>
            </div>

            <OnchainTransactionDetailsModal
                onClose={() => setModalData(undefined)}
                isOpen={!!modalData}
                data={modalData}
            />
        </>
    );
};
