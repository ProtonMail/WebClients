import { useCallback, useEffect, useMemo, useState } from 'react';

import { add, isBefore } from 'date-fns';
import compact from 'lodash/compact';
import { c } from 'ttag';

import type { WasmApiWalletAccount, WasmApiWalletTransaction, WasmTransactionDetails } from '@proton/andromeda';
import { WasmSortOrder } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip, useModalStateWithData } from '@proton/components/components';
import { useUserKeys } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import arrowsExchange from '@proton/styles/assets/img/illustrations/arrows-exchange.svg';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton, SimplePaginator } from '../../atoms';
import { ITEMS_PER_PAGE } from '../../constants';
import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '../../constants/wallet';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { useWalletDrawerContext } from '../../contexts/WalletDrawerContext';
import { useLocalPagination } from '../../hooks/useLocalPagination';
import type { DecryptedTransactionData, TransactionData } from '../../hooks/useWalletTransactions';
import { useWalletTransactions } from '../../hooks/useWalletTransactions';
import { getAccountTransactions, getThemeForWallet, getWalletTransactions } from '../../utils';
import type { DataColumn } from '../DataList';
import { DataList } from '../DataList';
import { TransactionNoteModal } from '../TransactionNoteModal';
import { UnknownSenderModal } from '../UnknownSenderModal';
import {
    AmountDataListItem,
    ConfirmationTimeDataListItem,
    NoteDataListItem,
    SenderOrRecipientDataListItem,
} from './data-list-items';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    onClickReceive: () => void;
    onClickBuy: () => void;
}

export const TransactionList = ({ apiWalletData, apiAccount, onClickReceive, onClickBuy }: Props) => {
    const { walletsChainData, decryptedApiWalletsData, syncSingleWallet, syncSingleWalletAccount, getSyncingData } =
        useBitcoinBlockchainContext();
    const { openDrawer, drawer, setDrawerData } = useWalletDrawerContext();
    const [sortOrder, setSortOrder] = useState<WasmSortOrder>(WasmSortOrder.Desc);

    const { isNarrow } = useResponsiveContainerContext();

    const syncingData = getSyncingData(apiWalletData.Wallet.ID, apiAccount?.ID);
    const isSyncingWalletData = syncingData?.syncing;

    const [isCoolingDown, setIsCoolingDown] = useState(false);

    const [userKeys] = useUserKeys();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>([]);
    // transactions length can be ITEMS_PER_PAGE + 1 if there is another page after current one. We want to cut displayed transactions to ITEMS_PER_PAGE
    const slicedTransactions = useMemo(() => transactions.slice(0, ITEMS_PER_PAGE), [transactions]);

    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();
    const [unknownSenderModal, setUnknownSenderModal] = useModalStateWithData<{ transaction: TransactionData }>();

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
                onClickEditSender: () => setUnknownSenderModal({ transaction }),
            });
        },
        [openDrawer, decryptedApiWalletsData, apiWalletData.Wallet.ID, setNoteModalState, setUnknownSenderModal]
    );

    useEffect(() => {
        const cooldownStartTime = syncingData?.lastSyncing && new Date(syncingData?.lastSyncing);
        const cooldownEndTime = cooldownStartTime
            ? add(cooldownStartTime, { minutes: SYNCING_MINIMUM_COOLDOWN_MINUTES })
            : undefined;

        const timeout = setInterval(() => {
            const localIsCoolingDown = cooldownEndTime ? isBefore(new Date(), cooldownEndTime) : false;
            setIsCoolingDown(localIsCoolingDown);
        }, 1 * SECOND);

        return () => clearInterval(timeout);
    }, [syncingData?.lastSyncing]);

    useEffect(() => {
        handleGoFirst();
    }, [apiWalletData?.Wallet.ID, apiAccount?.ID, handleGoFirst]);

    useEffect(() => {
        // We take one more item than page size to check if we should allow user to go on next page
        const pagination = { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE + 1 };
        const abortController = new AbortController();

        const run = async () => {
            if (apiWalletData?.Wallet.ID) {
                const transactions = await (() => {
                    if (apiAccount?.ID) {
                        return getAccountTransactions(
                            walletsChainData,
                            apiWalletData.Wallet.ID,
                            apiAccount.ID,
                            pagination,
                            sortOrder
                        );
                    } else {
                        return getWalletTransactions(walletsChainData, apiWalletData.Wallet.ID, pagination, sortOrder);
                    }
                })();

                if (!abortController.signal.aborted) {
                    setTransactions(transactions);
                }
            } else {
                setTransactions([]);
            }
        };

        void run();
        return () => {
            abortController.abort();
        };
    }, [apiAccount?.ID, apiWalletData.Wallet.ID, currentPage, sortOrder, walletsChainData]);

    const { transactionDetails, loadingRecordInit, loadingApiData, handleUpdatedTransaction } = useWalletTransactions({
        transactions: slicedTransactions,
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

    const handleTxUpdate = useCallback(
        (tx: WasmApiWalletTransaction, oldTx: TransactionData) => {
            void handleUpdatedTransaction(tx, oldTx).then((transaction) => {
                noteModalState.onClose?.();
                unknownSenderModal.onClose?.();

                if (drawer?.data.kind === 'transaction-data' && transaction) {
                    setDrawerData({ transaction });
                }
            });
        },
        [drawer?.data.kind, handleUpdatedTransaction, noteModalState, setDrawerData, unknownSenderModal]
    );

    const transactionsTable = useMemo(() => {
        const canGoNext = (transactions?.length ?? 0) > ITEMS_PER_PAGE;
        // We display pagination if we aren't on the first page anymore OR if there are transaction
        const shouldDisplayPaginator = currentPage > 0 || canGoNext;

        if (transactionDetails?.length) {
            const columns: DataColumn<{
                key: string;
                networkData: WasmTransactionDetails;
                apiData: DecryptedTransactionData | null;
            }>[] = compact([
                {
                    id: 'confirmation',
                    colSpan: 'minmax(10rem, 2fr)',
                    data: (row) => <ConfirmationTimeDataListItem loading={loadingRecordInit} tx={row} />,
                },
                {
                    id: 'senderorrecipients',
                    colSpan: '3fr',
                    data: (row) => <SenderOrRecipientDataListItem loading={loadingApiData} tx={row} />,
                },
                !isNarrow
                    ? {
                          id: 'note',
                          colSpan: '1fr',
                          data: (row) => (
                              <NoteDataListItem
                                  loading={loadingApiData}
                                  tx={row}
                                  onClick={() => {
                                      setNoteModalState({ transaction: row });
                                  }}
                              />
                          ),
                      }
                    : null,
                {
                    id: 'amount',
                    colSpan: 'minmax(7rem, 1fr)',
                    data: (row) => (
                        <AmountDataListItem
                            loadingLabel={loadingApiData}
                            loading={loadingRecordInit}
                            tx={row}
                            exchangeRate={row.apiData?.ExchangeRate ?? undefined}
                        />
                    ),
                },
            ]);

            return (
                <>
                    <div className="flex flex-column grow flex-nowrap mb-2 grow overflow-auto">
                        <div
                            className={clsx(
                                'relative flex flex-column bg-weak rounded-2xl overflow-hidden',
                                !isNarrow && 'mx-4'
                            )}
                        >
                            <DataList
                                onClickRow={(tx) => handleClickRow(tx)}
                                canClickRow={(tx) => !!tx}
                                rows={transactionDetails.map((tx) => ({
                                    ...tx,
                                    key: `${tx.networkData.txid}-${tx.networkData.received}-${tx.networkData.sent}`,
                                }))}
                                columns={columns}
                            />
                        </div>
                    </div>

                    {shouldDisplayPaginator && (
                        <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                            <>
                                <span className="block mr-4">{c('Wallet Transaction List')
                                    .t`Page ${displayedPageNumber}`}</span>
                                <SimplePaginator
                                    canGoPrev={currentPage > 0}
                                    onNext={handleNext}
                                    canGoNext={canGoNext}
                                    onPrev={handlePrev}
                                    disabled={loadingApiData || (isSyncingWalletData ?? false)}
                                />
                            </>
                        </div>
                    )}
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
                <img className="block mb-3" src={arrowsExchange} alt="" />
                <div>
                    <p className="h2 text-semibold text-center">{c('Wallet transaction').t`Start your journey`}</p>
                    <p className="h2 text-semibold text-center">
                        {c('Wallet transaction').t`Add bitcoins to your wallet`}
                    </p>
                </div>
                <div className="flex flex-row justify-center mt-6 ui-standard bg-transparent gap-2">
                    <Button
                        onClick={() => onClickReceive()}
                        shape="ghost"
                        color="norm"
                        className="text-lg min-w-custom button-lighter border border-weak"
                        style={{ '--min-w-custom': '7.5rem' }}
                    >
                        {c('Wallet transaction').t`Receive`}
                    </Button>
                    <Button
                        onClick={() => onClickBuy()}
                        shape="solid"
                        className="button-darker text-lg min-w-custom"
                        style={{ '--min-w-custom': '7.5rem' }}
                    >
                        {c('Wallet transaction').t`Buy`}
                    </Button>
                </div>
            </div>
        );
    }, [
        transactionDetails,
        isSyncingWalletData,
        isNarrow,
        displayedPageNumber,
        currentPage,
        handleNext,
        transactions,
        handlePrev,
        loadingRecordInit,
        loadingApiData,
        setNoteModalState,
        handleClickRow,
        onClickReceive,
        onClickBuy,
    ]);

    return (
        <>
            <div className={clsx('flex flex-column grow', isNarrow && 'bg-weak rounded-xl mx-2')}>
                <div
                    className={clsx(
                        'flex flex-row px-4 items-center justify-space-between',
                        isNarrow ? 'mt-6 mb-3 color-weak' : 'mt-10 mb-6'
                    )}
                >
                    <h2 className={clsx('mr-4 text-semibold', isNarrow ? 'text-lg' : 'text-4xl')}>{c(
                        'Wallet transactions'
                    ).t`Transactions`}</h2>

                    <div className="flex flex-row">
                        <Tooltip
                            title={(() => {
                                if (isSyncingWalletData) {
                                    return c('Wallet transactions list').t`Syncing is already in progress`;
                                } else if (isCoolingDown) {
                                    return c('Wallet transactions list').t`You need to wait 1 minute between each sync`;
                                } else {
                                    return undefined;
                                }
                            })()}
                        >
                            <div>
                                <CoreButton
                                    icon
                                    size={isNarrow ? 'small' : 'medium'}
                                    shape="ghost"
                                    color="weak"
                                    className="ml-2 rounded-full bg-weak"
                                    disabled={isSyncingWalletData || isCoolingDown}
                                    onClick={() => handleClickSync()}
                                >
                                    <Icon
                                        name="arrows-rotate"
                                        size={isNarrow ? 4 : 5}
                                        alt={c('Wallet transactions list').t`Sync`}
                                    />
                                </CoreButton>
                            </div>
                        </Tooltip>
                        <CoreButton
                            icon
                            size={isNarrow ? 'small' : 'medium'}
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
                                    size={isNarrow ? 4 : 5}
                                />
                            ) : (
                                <Icon
                                    alt={c('Wallet transactions list').t`Ascending order`}
                                    name="list-arrow-up"
                                    size={isNarrow ? 4 : 5}
                                />
                            )}
                        </CoreButton>
                    </div>
                </div>

                <div className="flex flex-column w-full grow flex-nowrap grow">{transactionsTable}</div>
            </div>

            <TransactionNoteModal apiWalletData={apiWalletData} onUpdate={handleTxUpdate} {...noteModalState} />

            {unknownSenderModal.data && (
                <UnknownSenderModal
                    walletTransaction={unknownSenderModal.data.transaction}
                    onUpdate={handleTxUpdate}
                    {...unknownSenderModal}
                />
            )}
        </>
    );
};
