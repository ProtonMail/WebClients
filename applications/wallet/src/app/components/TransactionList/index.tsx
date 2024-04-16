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
import { useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData, useWalletSettings } from '@proton/wallet';

import { BitcoinAmount, SimplePaginator } from '../../atoms';
import { ITEMS_PER_PAGE } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { TransactionData, useWalletTransactions } from '../../hooks/useWalletTransactions';
import { confirmationTimeToHumanReadable } from '../../utils';
import { OnchainTransactionDetailsProps } from '../OnchainTransactionDetails';
import { OnchainTransactionDetailsModal } from '../OnchainTransactionDetailsModal';

interface Props {
    wallet?: IWasmApiWalletData;
}

export const TransactionList = ({ wallet }: Props) => {
    const [walletSettings, loadingSettings] = useWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useUserExchangeRate();
    const { walletsChainData } = useBitcoinBlockchainContext();

    const walletChainData = wallet?.Wallet.ID ? walletsChainData[wallet?.Wallet.ID] : undefined;

    const [keys] = useUserKeys();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>([]);
    const [modalData, setModalData] = useState<Omit<OnchainTransactionDetailsProps, 'onUpdateLabel'>>();
    const [isLoading, withLoading] = useLoading(false);

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();
    // page 0 should be displayed as 'Page 1'
    const displayedPageNumber = currentPage + 1;

    const handleClickRow = useCallback(async (tx: TransactionData) => {
        setModalData({ tx });
    }, []);

    useEffect(() => {
        handleGoFirst();
    }, [walletChainData?.wallet, handleGoFirst]);

    useEffect(() => {
        const pagination = new WasmPagination(currentPage * ITEMS_PER_PAGE, ITEMS_PER_PAGE);

        if (walletChainData?.wallet) {
            void withLoading(
                walletChainData.wallet.getTransactions(pagination).then((transactions) => {
                    setTransactions(transactions[0].map((t) => t.Data));
                })
            );
        } else {
            setTransactions([]);
        }
    }, [currentPage, walletChainData?.wallet, withLoading]);

    const { transactionDetails, loadingRecordInit, loadingApiData, updateWalletTransaction } = useWalletTransactions({
        transactions,
        keys,
        wallet,
    });

    const transactionsTable = useMemo(() => {
        if (isLoading || loadingRecordInit) {
            return (
                <div className="m-auto flex flex-row items-center">
                    <CircleLoader className="color-primary mr-2" />
                    <span className="text-sm color-hint">{c('Wallet Transaction List')
                        .t`Syncing wallet to get latest transactions.`}</span>
                </div>
            );
        }

        if (transactionDetails?.length) {
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
                        {transactionDetails.map((tx) => {
                            const { networkData, apiData } = tx;
                            const txValue = networkData.received - networkData.sent;

                            // TXid cannot be assumed unique because of itnra-wallet self-transfers
                            return (
                                <TableRow
                                    key={`${networkData.txid}-${txValue}`}
                                    className={clsx(!!apiData && 'cursor-pointer')}
                                    onClick={() => handleClickRow(tx)}
                                >
                                    <TableCell>
                                        <div className="flex flex-column">
                                            <Tooltip title={networkData.txid}>
                                                <span className="inline-block max-w-full text-lg text-ellipsis">
                                                    {networkData.txid}
                                                </span>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-column">
                                            <span className="text-lg">
                                                {confirmationTimeToHumanReadable(networkData.time)}
                                            </span>
                                            <span className="color-hint">
                                                {networkData.time?.confirmed
                                                    ? c('Wallet Transaction List').t`Processed`
                                                    : c('Wallet Transaction List').t`Processing`}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-column">
                                            <span className={clsx('text-lg', loadingApiData && 'skeleton-loader')}>
                                                {apiData?.Label ?? '-'}
                                            </span>
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
        loadingApiData,
        loadingExchangeRate,
        loadingRecordInit,
        loadingSettings,
        transactionDetails,
        walletSettings?.BitcoinUnit,
    ]);

    return (
        <>
            <div className="flex flex-column mt-4 flex-nowrap grow">
                <div className="flex flex-column flex-nowrap mb-2 grow overflow-auto">{transactionsTable}</div>

                <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                    <span className="block mr-4">{c('Wallet Transaction List').t`Page ${displayedPageNumber}`}</span>

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
                onUpdateLabel={updateWalletTransaction}
            />
        </>
    );
};
