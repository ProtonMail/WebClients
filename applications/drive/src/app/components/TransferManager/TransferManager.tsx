import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useToggle, classnames, useElementRect, useActiveBreakpoint } from '@proton/components';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { buffer } from '@proton/shared/lib/helpers/function';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { c } from 'ttag';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { useUploadProvider } from '../uploads/UploadProvider';
import Header from './Header';
import Transfer from './Transfer';
import { TransferState, Download, Upload } from '../../interfaces/transfer';
import { isTransferFinished } from '../../utils/transfer';
import { TransfersStats, TransferType } from './interfaces';
import useConfirm from '../../hooks/util/useConfirm';
import useStatsHistory from '../../hooks/drive/useStatsHistory';

interface TransferListEntry<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

const ROW_HEIGHT_PX = 4.375 * rootFontSize; // 4.375 * 16 =  we want 70px by default

enum TRANSFER_GROUP {
    ACTIVE,
    DONE,
    QUEUED,
}
const STATE_TO_GROUP_MAP = {
    [TransferState.Progress]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Finalizing]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Paused]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Canceled]: TRANSFER_GROUP.ACTIVE,
    [TransferState.NetworkError]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Done]: TRANSFER_GROUP.DONE,
    [TransferState.Error]: TRANSFER_GROUP.DONE,
    [TransferState.Initializing]: TRANSFER_GROUP.QUEUED,
    [TransferState.Pending]: TRANSFER_GROUP.QUEUED,
};

const MAX_VISIBLE_TRANSFERS = 5;
const MAX_VISIBLE_TRANSFERS_MOBILE = 3;

type ListItemData = {
    sortedEntries: (TransferListEntry<TransferType.Download> | TransferListEntry<TransferType.Upload>)[];
    latestStats: TransfersStats;
    calculateAverageSpeed: (id: string) => number;
};

type ListItemRowProps = Omit<ListChildComponentProps, 'data'> & { data: ListItemData };

const ListItemRow = ({ style, index, data }: ListItemRowProps) => {
    const { calculateAverageSpeed, latestStats, sortedEntries } = data;
    const { transfer, type } = sortedEntries[index];

    return (
        <Transfer
            style={style}
            transfer={transfer}
            type={type}
            stats={{
                progress: latestStats.stats[transfer.id]?.progress ?? 0,
                speed: calculateAverageSpeed(transfer.id),
            }}
        />
    );
};

function TransferManager() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef, buffer);
    const { state: minimized, toggle: toggleMinimized } = useToggle();
    const { openConfirmModal } = useConfirm();
    const { downloads, getDownloadsProgresses, clearDownloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses, clearUploads } = useUploadProvider();
    const { isNarrow } = useActiveBreakpoint();

    const transfers = useMemo(() => [...downloads, ...uploads], [downloads, uploads]);
    const allTransfersFinished = useMemo(() => transfers.every(isTransferFinished), [transfers]);
    const getTransferProgresses = useCallback(() => {
        return { ...getUploadsProgresses(), ...getDownloadsProgresses() };
    }, [getUploadsProgresses, getDownloadsProgresses]);
    const statsHistory = useStatsHistory(transfers, getTransferProgresses);

    const clearAllTransfers = useCallback(() => {
        clearDownloads();
        clearUploads();
    }, [clearDownloads, clearUploads]);

    useEffect(() => {
        window.addEventListener('unload', clearAllTransfers);
        return () => {
            window.removeEventListener('unload', clearAllTransfers);
        };
    }, [clearAllTransfers]);

    const latestStats = statsHistory[0];

    const getListEntry =
        <T extends TransferType>(type: T) =>
        (transfer: T extends TransferType.Download ? Download : Upload): TransferListEntry<T> => ({
            transfer,
            type,
        });

    const getDownloadListEntry = getListEntry(TransferType.Download);
    const getUploadListEntry = getListEntry(TransferType.Upload);

    const downloadEntries = useMemo(() => downloads.map(getDownloadListEntry), [downloads]);
    const uploadEntries = useMemo(() => uploads.map(getUploadListEntry), [uploads]);

    const sortedEntries = useMemo(
        () =>
            [...downloadEntries, ...uploadEntries].sort(
                (a, b) =>
                    STATE_TO_GROUP_MAP[a.transfer.state] - STATE_TO_GROUP_MAP[b.transfer.state] ||
                    b.transfer.startDate.getTime() - a.transfer.startDate.getTime()
            ),
        [downloadEntries, uploadEntries]
    );

    if (!latestStats || downloads.length + uploads.length === 0) {
        return null;
    }

    const handleCloseClick = () => {
        if (allTransfersFinished) {
            clearAllTransfers();
        } else {
            openConfirmModal({
                title: c('Title').t`Cancel all active transfers`,
                confirm: c('Action').t`Confirm`,
                message: c('Info').t`Closing transfer manager will cancel all active transfers, are you sure?`,
                onConfirm: clearAllTransfers,
            });
        }
    };

    const calculateAverageSpeed = (id: string) => {
        let sum = 0;

        for (let i = 0; i < statsHistory.length; i++) {
            const stats = statsHistory[i].stats[id];

            if (!stats?.active || stats.speed < 0) {
                break; // Only take most recent progress (e.g. after pause or progress reset)
            }
            sum += stats.speed;
        }

        return sum / statsHistory.length;
    };

    const maxVisibleTransfers = isNarrow ? MAX_VISIBLE_TRANSFERS_MOBILE : MAX_VISIBLE_TRANSFERS;

    return (
        <div className={classnames(['transfers-manager', minimized && 'transfers-manager--minimized'])}>
            <Header
                downloads={downloads}
                uploads={uploads}
                latestStats={latestStats}
                minimized={minimized}
                onToggleMinimize={toggleMinimized}
                onClose={handleCloseClick}
            />

            <div className="transfers-manager-list" ref={containerRef}>
                {rect && (
                    <FixedSizeList
                        className="no-outline"
                        itemData={{
                            sortedEntries,
                            latestStats,
                            calculateAverageSpeed,
                        }}
                        itemCount={sortedEntries.length}
                        itemSize={ROW_HEIGHT_PX}
                        height={ROW_HEIGHT_PX * Math.min(maxVisibleTransfers, sortedEntries.length)}
                        width={rect.width}
                        itemKey={(index, { sortedEntries }: ListItemData) => sortedEntries[index].transfer?.id ?? index}
                    >
                        {ListItemRow}
                    </FixedSizeList>
                )}
            </div>
        </div>
    );
}

export default TransferManager;
