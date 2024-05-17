import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount, WasmSortOrder, WasmTransactionDetails } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, useModalStateWithData } from '@proton/components/components';
import { useUserKeys } from '@proton/components/hooks';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, SimplePaginator } from '../../atoms';
import { ITEMS_PER_PAGE } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDrawerContext } from '../../contexts/WalletDrawerContext';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { TransactionData, useWalletTransactions } from '../../hooks/useWalletTransactions';
import { useBitcoinNetwork } from '../../store/hooks';
import { getAccountTransactions, getWalletTransactions } from '../../utils';
import { DataList } from '../DataList';
import { TransactionNoteModal } from '../TransactionNoteModal';
import arrowsExchange from './arrows-exchange.svg';
import {
    AmountDataListItem,
    ConfirmationTimeDataListItem,
    NoteDataListItem,
    SenderOrRecipientDataListItem,
} from './data-list-items';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
}

export const TransactionList = ({ apiWalletData, apiAccount }: Props) => {
    const [exchangeRate, loadingExchangeRate] = useUserExchangeRate();
    const { walletsChainData, syncSingleWallet, syncSingleWalletAccount, isSyncing } = useBitcoinBlockchainContext();
    const { openDrawer } = useWalletDrawerContext();
    const [sortOrder, setSortOrder] = useState<WasmSortOrder>(WasmSortOrder.Desc);

    const isSyncingWalletData = isSyncing(apiWalletData.Wallet.ID, apiAccount?.ID);

    const [network] = useBitcoinNetwork();

    const [userKeys] = useUserKeys();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>([]);
    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();
    // page 0 should be displayed as 'Page 1'
    const displayedPageNumber = currentPage + 1;

    const handleClickRow = useCallback(
        async (transaction: TransactionData) => {
            openDrawer({ transaction });
        },
        [openDrawer]
    );

    useEffect(() => {
        handleGoFirst();
    }, [apiWalletData?.Wallet.ID, apiAccount?.ID, handleGoFirst]);

    useEffect(() => {
        if (apiWalletData?.Wallet.ID && !isSyncingWalletData) {
            if (apiAccount?.ID) {
                void getAccountTransactions(
                    walletsChainData,
                    apiWalletData.Wallet.ID,
                    apiAccount.ID,
                    { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE },
                    sortOrder
                ).then((txs) => setTransactions(txs));
            } else {
                void getWalletTransactions(
                    walletsChainData,
                    apiWalletData.Wallet.ID,
                    { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE },
                    sortOrder
                ).then((txs) => setTransactions(txs));
            }
        } else {
            setTransactions([]);
        }
    }, [currentPage, apiWalletData.Wallet.ID, walletsChainData, sortOrder, apiAccount?.ID, isSyncingWalletData]);

    const { transactionDetails, loadingRecordInit, loadingApiData, updateWalletTransaction } = useWalletTransactions({
        transactions,
        userKeys,
        wallet: apiWalletData,
    });

    const handleClickSync = useCallback(() => {
        if (apiAccount) {
            return syncSingleWalletAccount(apiWalletData.Wallet.ID, apiAccount.ID);
        } else {
            return syncSingleWallet(apiWalletData.Wallet.ID);
        }
    }, [apiAccount, apiWalletData.Wallet.ID, syncSingleWallet, syncSingleWalletAccount]);

    const transactionsTable = useMemo(() => {
        if (transactionDetails?.length && network) {
            return (
                <>
                    <div className="flex flex-column flex-nowrap mb-2 grow overflow-auto">
                        <div className="relative flex flex-column mx-4 bg-weak rounded-xl">
                            {/* Syncing overlay */}
                            {isSyncingWalletData && (
                                <div
                                    className="absolute top-0 left-0 w-full h-full flex rounded-xl"
                                    style={{ background: '#2a2a2a44' }}
                                >
                                    <div className="flex flex-row justify-center items-center m-auto">
                                        <div className="flex mr-1">
                                            <CircleLoader className="color-primary m-auto" />
                                        </div>
                                        <div>{c('Wallet transactions').t`Syncing transactions`}</div>
                                    </div>
                                </div>
                            )}

                            <DataList
                                onClickRow={(tx) => handleClickRow(tx)}
                                canClickRow={(tx) => !!tx}
                                rows={transactionDetails.map((tx) => ({
                                    ...tx,
                                    key: `${tx.networkData.txid}-${tx.networkData.received}-${tx.networkData.sent}`,
                                }))}
                                columns={[
                                    {
                                        id: 'confirmation',
                                        className: 'w-custom no-shrink',
                                        style: { '--w-custom': '15rem' },
                                        data: (row) => (
                                            <ConfirmationTimeDataListItem loading={loadingRecordInit} tx={row} />
                                        ),
                                    },
                                    {
                                        id: 'senderorrecipients',
                                        className: 'grow',
                                        data: (row) => (
                                            <SenderOrRecipientDataListItem loading={loadingApiData} tx={row} />
                                        ),
                                    },
                                    {
                                        id: 'note',
                                        className: 'w-custom no-shrink',
                                        style: { '--w-custom': '10rem' },
                                        data: (row) => (
                                            <NoteDataListItem
                                                loading={loadingApiData}
                                                tx={row}
                                                onClick={() => {
                                                    setNoteModalState({ transaction: row });
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        id: 'amount',
                                        className: 'w-custom no-shrink',
                                        style: { '--w-custom': '8rem' },
                                        data: (row) => (
                                            <AmountDataListItem
                                                loadingLabel={loadingExchangeRate}
                                                loading={loadingRecordInit}
                                                tx={row}
                                                exchangeRate={exchangeRate}
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                        <span className="block mr-4">{c('Wallet Transaction List')
                            .t`Page ${displayedPageNumber}`}</span>

                        <SimplePaginator
                            canGoPrev={currentPage > 0}
                            onNext={handleNext}
                            canGoNext={!!transactions && transactions.length >= ITEMS_PER_PAGE}
                            onPrev={handlePrev}
                        />
                    </div>
                </>
            );
        }

        if (isSyncingWalletData) {
            return (
                <div className="flex flex-row items-center color-primary m-auto">
                    <CircleLoader size="small" />
                    <div className="ml-2">{c('Wallet transactions').t`Syncing transactions`}</div>
                </div>
            );
        }

        return (
            <div className="flex flex-column mx-auto justify-center grow mb-10">
                <img
                    className="block mb-3"
                    src={arrowsExchange}
                    alt="Arrow going up and down, symbolising money transfer"
                />
                <div>
                    <p className="h2 text-semibold text-center">{c('Wallet transaction').t`Start your journey`}</p>
                    <p className="h2 text-semibold text-center">
                        {c('Wallet transaction').t`Add bitcoins to your wallet`}
                    </p>
                </div>
                <div className="flex flex-row justify-center mt-6 ui-standard">
                    <Button
                        pill
                        shape="solid"
                        color="weak"
                        className="text-lg w-custom mx-1 py-3"
                        shadow
                        style={{ '--w-custom': '7.5rem' }}
                    >
                        {c('Wallet transaction').t`Receive`}
                    </Button>
                    <Button
                        pill
                        shape="solid"
                        className="button-darker text-lg w-custom mx-1 py-3"
                        shadow
                        style={{ '--w-custom': '7.5rem' }}
                    >
                        {c('Wallet transaction').t`Buy`}
                    </Button>
                </div>
            </div>
        );
    }, [
        transactionDetails,
        network,
        displayedPageNumber,
        currentPage,
        handleNext,
        transactions,
        handlePrev,
        handleClickRow,
        loadingRecordInit,
        loadingApiData,
        setNoteModalState,
        loadingExchangeRate,
        exchangeRate,
        isSyncingWalletData,
    ]);

    return (
        <>
            <div className="flex flex-row mx-4 mb-6 mt-10 items-center justify-space-between">
                <h2 className="mr-4 text-semibold">{c('Wallet transactions').t`Transactions`}</h2>

                <div className="flex flex-row">
                    <CoreButton
                        icon
                        size="medium"
                        shape="ghost"
                        color="weak"
                        className="ml-2 rounded-full bg-weak"
                        disabled={isSyncingWalletData}
                        onClick={() => handleClickSync()}
                    >
                        <Icon name="arrows-rotate" size={5} alt={c('Wallet transactions list').t`Sync`} />
                    </CoreButton>
                    <CoreButton
                        icon
                        size="medium"
                        shape="ghost"
                        color="weak"
                        className="ml-2 rounded-full bg-weak"
                        disabled={!transactionDetails?.length || isSyncingWalletData}
                        onClick={() =>
                            setSortOrder((prev) =>
                                prev === WasmSortOrder.Asc ? WasmSortOrder.Desc : WasmSortOrder.Asc
                            )
                        }
                    >
                        {sortOrder === WasmSortOrder.Asc ? (
                            <Icon
                                alt={c('Wallet transactions list').t`Descending order`}
                                name="list-arrow-down"
                                size={5}
                            />
                        ) : (
                            <Icon
                                alt={c('Wallet transactions list').t`Ascending order`}
                                name="list-arrow-up"
                                size={5}
                            />
                        )}
                    </CoreButton>
                </div>
            </div>

            <div className="flex flex-column flex-nowrap grow">{transactionsTable}</div>

            <TransactionNoteModal
                onUpdateLabel={(label, tx) => {
                    void updateWalletTransaction(label, tx).then(() => {
                        noteModalState.onClose?.();
                    });
                }}
                {...noteModalState}
            />
        </>
    );
};
