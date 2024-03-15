import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmPagination, WasmTransactionDetails } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { EmptyViewContainer } from '@proton/components/containers';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import { useWalletSettings } from '@proton/wallet';

import { BitcoinAmount, SimplePaginator } from '../../atoms';
import { ITEMS_PER_PAGE } from '../../constants';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { WalletWithChainData } from '../../types';
import { confirmationTimeToHumanReadable } from '../../utils';
import { OnchainTransactionDetailsProps } from '../OnchainTransactionDetails';
import { OnchainTransactionDetailsModal } from '../OnchainTransactionDetailsModal';

interface Props {
    wallet?: WalletWithChainData;
}

export const TransactionList = ({ wallet }: Props) => {
    const [walletSettings, loadingSettings] = useWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useUserExchangeRate();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>();
    const [modalData, setModalData] = useState<OnchainTransactionDetailsProps>();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();

    const handleClickRow = useCallback(async (tx: WasmTransactionDetails) => {
        setModalData({ tx });
    }, []);

    useEffect(() => {
        handleGoFirst();
    }, [wallet?.wallet, handleGoFirst]);

    useEffect(() => {
        const pagination = new WasmPagination(currentPage * ITEMS_PER_PAGE, ITEMS_PER_PAGE);

        if (wallet?.wallet) {
            setIsLoading(true);

            void wallet.wallet
                .getTransactions(pagination)
                .then((transactions) => {
                    setTransactions(transactions[0]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setTransactions([]);
        }
    }, [currentPage, wallet?.wallet]);

    const transactionsTable = useMemo(() => {
        if (isLoading) {
            return (
                <div className="m-auto flex flex-row items-center">
                    <CircleLoader className="color-primary mr-2" />
                    <span className="text-sm color-hint">{c('Wallet Transaction List')
                        .t`Syncing wallet to get latest transactions.`}</span>
                </div>
            );
        }

        if (transactions?.length) {
            return (
                <Table className="text-sm" borderWeak>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell className="w-2/10">{c('Wallet Transaction List').t`Id`}</TableHeaderCell>
                            <TableHeaderCell className="w-2/10">{c('Wallet Transaction List').t`Date`}</TableHeaderCell>
                            <TableHeaderCell className="w-4/10">{c('Wallet Transaction List')
                                .t`Label`}</TableHeaderCell>
                            <TableHeaderCell className="w-2/10 text-right">{c('Wallet Transaction List')
                                .t`Amount`}</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => {
                            const txValue = Number(transaction.received) - Number(transaction.sent);

                            // TXid cannot be assumed unique because of itnra-wallet self-transfers
                            return (
                                <TableRow
                                    key={`${transaction.txid}-${txValue}`}
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
                                                {!transaction.time
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
                                                bitcoin={Number(txValue)}
                                                unit={{ value: walletSettings?.BitcoinUnit, loading: loadingSettings }}
                                                exchangeRate={{ value: exchangeRate, loading: loadingExchangeRate }}
                                                firstClassName="text-lg ml-auto"
                                                secondClassName="ml-auto"
                                                showColor
                                                showExplicitSign
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            );
        }

        return (
            <EmptyViewContainer
                imageProps={{
                    src: noResultSearchSvg,
                    alt: c('Wallet Transaction List').t`No transaction found`,
                }}
            >
                {c('Wallet Transaction List').t`You don't have transaction yet on this wallet`}
            </EmptyViewContainer>
        );
    }, [
        exchangeRate,
        handleClickRow,
        isLoading,
        loadingExchangeRate,
        loadingSettings,
        transactions,
        walletSettings?.BitcoinUnit,
    ]);

    return (
        <>
            <div className="flex flex-column mt-4 flex-nowrap grow">
                <div className="flex flex-column flex-nowrap mb-2 grow overflow-auto">{transactionsTable}</div>

                <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                    <span className="block mr-4">{c('Wallet Transaction List').t`Page ${currentPage}`}</span>

                    <SimplePaginator
                        canGoPrev={!isLoading && currentPage > 0}
                        onNext={handleNext}
                        canGoNext={!isLoading && !!transactions && transactions.length >= ITEMS_PER_PAGE}
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
