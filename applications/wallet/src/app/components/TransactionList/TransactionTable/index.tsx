import compact from 'lodash/compact';
import { c } from 'ttag';

import type { WasmSortOrder, WasmTransactionDetails } from '@proton/andromeda';
import arrowsExchange from '@proton/styles/assets/img/illustrations/arrows-exchange.svg';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, SimplePaginator } from '../../../atoms';
import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
import type { DecryptedTransactionData } from '../../../hooks/useWalletTransactions';
import { type DataColumn, DataList } from '../../DataList';
import { TransactionNoteModal } from '../../TransactionNoteModal';
import { UnknownSenderModal } from '../../UnknownSenderModal';
import {
    AmountDataListItem,
    ConfirmationTimeDataListItem,
    NoteDataListItem,
    SenderOrRecipientDataListItem,
} from '../data-list-items';
import { useTransactionTable } from './useTransactionTable';

interface Props {
    wallet: IWasmApiWalletData;
    walletAccountId?: string;
    sortOrder: WasmSortOrder;

    onClickReceive: () => void;
    onClickBuy: () => void;
}

export const TransactionTable = ({ wallet, walletAccountId, sortOrder, onClickReceive, onClickBuy }: Props) => {
    const { isNarrow } = useResponsiveContainerContext();

    const {
        isSyncingWalletData,

        pageNumber,
        canGoPrev,
        canGoNext,
        shouldDisplayPaginator,
        handleNext,
        handlePrev,

        loadingRecordInit,
        loadingApiData,
        transactionDetails,

        noteModalState,
        unknownSenderModal,
        openNoteModal,
        handleTxUpdate,
        handleClickRow,
    } = useTransactionTable({
        wallet,
        walletAccountId,
        sortOrder,
    });

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
                                  openNoteModal(row);
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
                            <span className="block mr-4">{c('Wallet Transaction List').t`Page ${pageNumber}`}</span>
                            <SimplePaginator
                                canGoPrev={canGoPrev}
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
        const dummyLoadingColumns: DataColumn<null>[] = compact([
            {
                id: 'confirmation',
                colSpan: 'minmax(10rem, 2fr)',
                data: () => <ConfirmationTimeDataListItem loading loadingLabel />,
            },
            {
                id: 'senderorrecipients',
                colSpan: '3fr',
                data: () => <SenderOrRecipientDataListItem loading />,
            },
            !isNarrow
                ? {
                      id: 'note',
                      colSpan: '1fr',
                      data: () => <NoteDataListItem loadingLabel loading />,
                  }
                : null,
            {
                id: 'amount',
                colSpan: 'minmax(7rem, 1fr)',
                data: () => <AmountDataListItem loadingLabel loading />,
            },
        ]);

        return (
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
                        rows={new Array(4).fill({})}
                        columns={dummyLoadingColumns}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-column mx-auto justify-center grow mb-10">
                <img className="block mb-3" src={arrowsExchange} alt="" />
                <div>
                    <p className="h2 text-semibold text-center">{c('Wallet transaction').t`Start your journey`}</p>
                    <p className="h2 text-semibold text-center">{c('Wallet transaction')
                        .t`Add bitcoins to your wallet`}</p>
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

            <TransactionNoteModal apiWalletData={wallet} onUpdate={handleTxUpdate} {...noteModalState} />

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
