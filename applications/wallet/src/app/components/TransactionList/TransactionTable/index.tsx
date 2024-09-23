import compact from 'lodash/compact';
import isEmpty from 'lodash/isEmpty';
import { c } from 'ttag';

import type { WasmSortOrder, WasmTransactionDetails } from '@proton/andromeda';
import arrowsExchange from '@proton/styles/assets/img/illustrations/arrows-exchange.svg';
import clsx from '@proton/utils/clsx';
import type { DecryptedTransactionData, IWasmApiWalletData } from '@proton/wallet';

import { Button, SimplePaginator } from '../../../atoms';
import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
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

        apiWalletTransactionData,
        networkTransactionByHashedTxId,
        loadingApiWalletTransactionData,

        noteModalState,
        unknownSenderModal,
        openNoteModal,
        handleClickRow,
    } = useTransactionTable({
        wallet,
        walletAccountId,
        sortOrder,
    });

    if (!isEmpty(networkTransactionByHashedTxId)) {
        const columns: DataColumn<{
            key: string;
            networkData: WasmTransactionDetails;
            apiData: DecryptedTransactionData | null;
        }>[] = compact([
            {
                id: 'confirmation',
                colSpan: 'minmax(10rem, 2fr)',
                data: (row) => <ConfirmationTimeDataListItem loading={loadingApiWalletTransactionData} tx={row} />,
            },
            {
                id: 'senderorrecipients',
                colSpan: '3fr',
                data: (row) => <SenderOrRecipientDataListItem loading={loadingApiWalletTransactionData} tx={row} />,
            },
            !isNarrow
                ? {
                      id: 'note',
                      colSpan: '1fr',
                      data: (row) => (
                          <NoteDataListItem
                              loading={loadingApiWalletTransactionData}
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
                        loadingLabel={loadingApiWalletTransactionData}
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
                            rows={Object.keys(networkTransactionByHashedTxId).map((hashedTxId) => ({
                                networkData: networkTransactionByHashedTxId[hashedTxId] as WasmTransactionDetails,
                                apiData: apiWalletTransactionData?.[hashedTxId] ?? null,
                                key: hashedTxId,
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
                                disabled={loadingApiWalletTransactionData || (isSyncingWalletData ?? false)}
                            />
                        </>
                    </div>
                )}

                {noteModalState.data && (
                    <TransactionNoteModal
                        hashedTxId={noteModalState.data.hashedTxId}
                        apiWalletData={wallet}
                        {...noteModalState}
                    />
                )}

                {unknownSenderModal.data && (
                    <UnknownSenderModal hashedTxId={unknownSenderModal.data.hashedTxId} {...unknownSenderModal} />
                )}
            </>
        );
    }

    if (isSyncingWalletData || !apiWalletTransactionData) {
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
        <div className="flex flex-column mx-auto justify-center grow mb-10">
            <img className="block mb-3" src={arrowsExchange} alt="" />
            <div>
                <p className="h2 text-semibold text-center">{c('Wallet transaction').t`Start your journey`}</p>
                <p className="h2 text-semibold text-center">{c('Wallet transaction').t`Add bitcoins to your wallet`}</p>
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
};
