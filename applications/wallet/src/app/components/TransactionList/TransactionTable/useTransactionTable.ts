import { useCallback, useEffect, useMemo, useState } from 'react';

import type { WasmApiWalletTransaction, WasmSortOrder, WasmTransactionDetails } from '@proton/andromeda';
import { useModalStateWithData } from '@proton/components/components';
import { useUserKeys } from '@proton/components/hooks';
import { type IWasmApiWalletData } from '@proton/wallet';

import { ITEMS_PER_PAGE } from '../../../constants';
import { useBitcoinBlockchainContext } from '../../../contexts';
import { useWalletDrawerContext } from '../../../contexts/WalletDrawerContext';
import { useLocalPagination } from '../../../hooks/useLocalPagination';
import { type TransactionData, useWalletTransactions } from '../../../hooks/useWalletTransactions';
import { getAccountTransactions, getThemeForWallet, getWalletTransactions } from '../../../utils';

export const useTransactionTable = ({
    wallet,
    walletAccountId,
    sortOrder,
}: {
    wallet: IWasmApiWalletData;
    walletAccountId?: string;
    sortOrder: WasmSortOrder;
}) => {
    const walletId = wallet.Wallet.ID;
    const { walletsChainData, getSyncingData, apiWalletsData } = useBitcoinBlockchainContext();
    const { openDrawer, drawer, setDrawerData } = useWalletDrawerContext();

    const syncingData = getSyncingData(walletId, walletAccountId);
    const isSyncingWalletData = Boolean(syncingData?.syncing || syncingData?.error);

    const { currentPage, handleNext, handlePrev, handleGoFirst } = useLocalPagination();

    const [transactions, setTransactions] = useState<WasmTransactionDetails[]>([]);
    // transactions length can be ITEMS_PER_PAGE + 1 if there is another page after current one. We want to cut displayed transactions to ITEMS_PER_PAGE
    const slicedTransactions = useMemo(() => transactions.slice(0, ITEMS_PER_PAGE), [transactions]);

    const [userKeys] = useUserKeys();

    useEffect(() => {
        handleGoFirst();
    }, [walletId, walletAccountId, handleGoFirst]);

    useEffect(() => {
        // We take one more item than page size to check if we should allow user to go on next page
        const pagination = { skip: currentPage * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE + 1 };
        const abortController = new AbortController();

        const run = async () => {
            if (walletId) {
                const transactions = await (() => {
                    if (walletAccountId) {
                        return getAccountTransactions(
                            walletsChainData,
                            walletId,
                            walletAccountId,
                            pagination,
                            sortOrder
                        );
                    } else {
                        return getWalletTransactions(walletsChainData, walletId, pagination, sortOrder);
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
    }, [currentPage, sortOrder, walletAccountId, walletId, walletsChainData]);

    const canGoNext = (transactions?.length ?? 0) > ITEMS_PER_PAGE;
    // We display pagination if we aren't on the first page anymore OR if there are transaction
    const shouldDisplayPaginator = currentPage > 0 || canGoNext;

    const { transactionDetails, loadingRecordInit, loadingApiData, handleUpdatedTransaction } = useWalletTransactions({
        transactions: slicedTransactions,
        userKeys,
        wallet,
    });

    const [noteModalState, setNoteModalState] = useModalStateWithData<{ transaction: TransactionData }>();
    const [unknownSenderModal, setUnknownSenderModal] = useModalStateWithData<{ transaction: TransactionData }>();

    const openNoteModal = useCallback(
        (transaction: TransactionData) => {
            setNoteModalState({ transaction });
        },
        [setNoteModalState]
    );

    const handleClickRow = useCallback(
        async (transaction: TransactionData) => {
            openDrawer({
                theme: getThemeForWallet(apiWalletsData ?? [], wallet.Wallet.ID),
                transaction,
                kind: 'transaction-data',
                onClickEditNote: () => setNoteModalState({ transaction }),
                onClickEditSender: () => setUnknownSenderModal({ transaction }),
            });
        },
        [apiWalletsData, openDrawer, setNoteModalState, setUnknownSenderModal, wallet.Wallet.ID]
    );

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

    return {
        isSyncingWalletData,

        // page 0 should be displayed as 'Page 1'
        pageNumber: currentPage + 1,
        canGoPrev: currentPage > 0,
        canGoNext,
        shouldDisplayPaginator,
        handleNext,
        handlePrev,

        loadingRecordInit,
        loadingApiData,
        transactionDetails,
        handleUpdatedTransaction,

        noteModalState,
        unknownSenderModal,
        openNoteModal,
        handleTxUpdate,
        handleClickRow,
    };
};
