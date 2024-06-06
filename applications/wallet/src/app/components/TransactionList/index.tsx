import { useCallback, useEffect, useMemo, useState } from 'react';

import { add } from 'date-fns';
import { c } from 'ttag';

import { WasmApiWalletAccount, WasmSortOrder, WasmTransactionDetails } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, useModalStateWithData } from '@proton/components/components';
import { useUserKeys } from '@proton/components/hooks';
import arrowsExchange from '@proton/styles/assets/img/illustrations/arrows-exchange.svg';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, SimplePaginator } from '../../atoms';
import { CoolDownButton } from '../../atoms/CoolDownButton';
import { ITEMS_PER_PAGE } from '../../constants';
import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '../../constants/wallet';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletDrawerContext } from '../../contexts/WalletDrawerContext';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import { TransactionData, useWalletTransactions } from '../../hooks/useWalletTransactions';
import { getAccountTransactions, getThemeForWallet, getWalletTransactions } from '../../utils';
import { DataList } from '../DataList';
import { TransactionNoteModal } from '../TransactionNoteModal';
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
    const { walletsChainData, decryptedApiWalletsData, syncSingleWallet, syncSingleWalletAccount, getSyncingData } =
        useBitcoinBlockchainContext();
    const { openDrawer, drawer, setDrawerData } = useWalletDrawerContext();
    const [sortOrder, setSortOrder] = useState<WasmSortOrder>(WasmSortOrder.Desc);

    const syncingData = getSyncingData(apiWalletData.Wallet.ID, apiAccount?.ID);
    const isSyncingWalletData = syncingData?.syncing;
    const cooldownStartTime = syncingData?.lastSyncing ? new Date(syncingData?.lastSyncing) : undefined;
    const cooldownEndTime = cooldownStartTime
        ? add(cooldownStartTime, { minutes: SYNCING_MINIMUM_COOLDOWN_MINUTES })
        : undefined;

    const [userKeys] = useUserKeys();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>([]);
    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();
    // page 0 should be displayed as 'Page 1'
    const displayedPageNumber = currentPage + 1;

    const handleClickRow = useCallback(
        async (transaction: TransactionData) => {
            openDrawer({
                theme: getThemeForWallet(decryptedApiWalletsData ?? [], apiWalletData.Wallet.ID),
                transaction,
                kind: 'transaction-data',
                onClickEditNote: () => setNoteModalState({ transaction }),
            });
        },
        [openDrawer, decryptedApiWalletsData, apiWalletData.Wallet.ID, setNoteModalState]
    );

    useEffect(() => {
        handleGoFirst();
    }, [apiWalletData?.Wallet.ID, apiAccount?.ID, handleGoFirst]);

    useEffect(() => {
        if (apiWalletData?.Wallet.ID) {
            if (apiAccount?.ID) {
                void getAccountTransactions(
                    walletsChainData,
                    apiWalletData.Wallet.ID,
                    apiAccount.ID,
                    { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE },
                    sortOrder
                ).then((txs) => {
                    setTransactions(txs);
                });
            } else {
                void getWalletTransactions(
                    walletsChainData,
                    apiWalletData.Wallet.ID,
                    { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE },
                    sortOrder
                ).then((txs) => {
                    setTransactions(txs);
                });
            }
        } else {
            setTransactions([]);
        }
    }, [apiAccount?.ID, apiWalletData.Wallet.ID, currentPage, sortOrder, walletsChainData]);

    const { transactionDetails, loadingRecordInit, loadingApiData, updateWalletTransaction } = useWalletTransactions({
        transactions,
        userKeys,
        wallet: apiWalletData,
    });

    const handleClickSync = useCallback(() => {
        const isManual = true;
        if (apiAccount) {
            return syncSingleWalletAccount({
                walletId: apiWalletData.Wallet.ID,
                accountId: apiAccount.ID,
                manual: isManual,
            });
        } else {
            return syncSingleWallet({ walletId: apiWalletData.Wallet.ID, manual: isManual });
        }
    }, [apiAccount, apiWalletData.Wallet.ID, syncSingleWallet, syncSingleWalletAccount]);

    const transactionsTable = useMemo(() => {
        if (transactionDetails?.length) {
            return (
                <>
                    <div className="flex flex-column flex-nowrap mb-2 grow overflow-auto">
                        <div className="relative flex flex-column mx-4 bg-weak rounded-xl">
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
                                                loadingLabel={loadingApiData}
                                                loading={loadingRecordInit}
                                                tx={row}
                                                exchangeRate={row.apiData?.ExchangeRate ?? undefined}
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

        if (isSyncingWalletData || !transactionDetails) {
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
                        shape="ghost"
                        color="norm"
                        className="text-lg w-custom mx-1"
                        style={{ '--w-custom': '7.5rem' }}
                        shadow
                    >
                        {c('Wallet transaction').t`Receive`}
                    </Button>
                    <Button
                        shape="solid"
                        className="button-darker text-lg w-custom mx-1"
                        style={{ '--w-custom': '7.5rem' }}
                    >
                        {c('Wallet transaction').t`Buy`}
                    </Button>
                </div>
            </div>
        );
    }, [
        transactionDetails,
        isSyncingWalletData,
        displayedPageNumber,
        currentPage,
        handleNext,
        transactions,
        handlePrev,
        handleClickRow,
        loadingRecordInit,
        loadingApiData,
        setNoteModalState,
    ]);

    return (
        <>
            <div className="flex flex-row mx-4 mb-6 mt-10 items-center justify-space-between">
                <h2 className="mr-4 text-semibold">{c('Wallet transactions').t`Transactions`}</h2>

                <div className="flex flex-row">
                    <CoolDownButton
                        end={cooldownEndTime}
                        start={cooldownStartTime}
                        icon
                        size="medium"
                        shape="ghost"
                        color="weak"
                        className="ml-2"
                        buttonClassName="rounded-full bg-weak"
                        disabled={isSyncingWalletData}
                        onClick={() => handleClickSync()}
                    >
                        <Icon name="arrows-rotate" size={5} alt={c('Wallet transactions list').t`Sync`} />
                    </CoolDownButton>
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
                    void updateWalletTransaction(label, tx).then((transaction) => {
                        noteModalState.onClose?.();
                        if (drawer?.data.kind === 'transaction-data' && transaction) {
                            setDrawerData({ transaction });
                        }
                    });
                }}
                {...noteModalState}
            />
        </>
    );
};
