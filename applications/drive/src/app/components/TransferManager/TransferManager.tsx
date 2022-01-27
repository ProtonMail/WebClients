import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { c } from 'ttag';
import {
    useToggle,
    classnames,
    useElementRect,
    useActiveBreakpoint,
    useWindowSize,
    useRightToLeft,
} from '@proton/components';
import { buffer } from '@proton/shared/lib/helpers/function';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import busy from '@proton/shared/lib/busy';
import {
    Download,
    STATE_TO_GROUP_MAP,
    TransferGroup,
    TransfersStats,
    TransferType,
    Upload,
} from '@proton/shared/lib/interfaces/drive/transfer';

import { useDownloadProvider } from '../downloads/DownloadProvider';
import { useUploadProvider } from '../uploads/UploadProvider';
import Header from './Header';
import Transfer from './Transfer';
import { isTransferFinished } from '../../utils/transfer';
import useConfirm from '../../hooks/util/useConfirm';
import useStatsHistory from '../../hooks/drive/useStatsHistory';
import Toolbar from './Toolbar';

interface TransferListEntry<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

const ROW_HEIGHT_PX = 4.375 * rootFontSize; // 4.375 * 16 =  we want 70px by default
const MAX_VISIBLE_TRANSFERS = 5;
const MAX_VISIBLE_TRANSFERS_MOBILE = 3;

type ListItemData = {
    entries: (TransferListEntry<TransferType.Download> | TransferListEntry<TransferType.Upload>)[];
    latestStats: TransfersStats;
    calculateAverageSpeed: (id: string) => number;
};

type ListItemRowProps = Omit<ListChildComponentProps, 'data'> & { data: ListItemData };

const ListItemRow = ({ style, index, data }: ListItemRowProps) => {
    const { calculateAverageSpeed, latestStats, entries } = data;
    const { transfer, type } = entries[index];

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

const TransferManager = ({
    downloads,
    uploads,
    statsHistory,
    onClear,
    allTransfersFinished,
}: {
    downloads: Download[];
    uploads: Upload[];
    statsHistory: TransfersStats[];
    onClear: () => void;
    allTransfersFinished: boolean;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const [transferGroupFilter, setTransferGroupFilter] = useState<TransferGroup | undefined>(undefined);
    const windowHeight = useWindowSize()[1];
    /*
        FixedSizedList (used for virtual scrolling) requires `width` prop to work
        correcty. This is why we use 'useElementRect' hook here.
        `useElementRect` utilizes `getBoundingClientRect` method to get dimensions
        of a given element reference.

        *WARNING:* don't introduce conditional rendering to this component –
        this will lead to a race condition in which an element could be removed
        from DOM while React still keeping its reference. In this case
        `getBoundingClientRect` returns zero for each target's dimension, which in certain
        cases (here due to useElementRect specifics) cause rendering bugs.

        For more details see TransferManagerContainer component
    */
    const rect = useElementRect(containerRef, buffer);
    const rectHeader = useElementRect(headerRef, buffer);
    const { state: minimized, toggle: toggleMinimized } = useToggle();
    const { state: isToolbarExpanded, toggle: setToolbarExpanded } = useToggle();
    const { openConfirmModal } = useConfirm();
    const { isNarrow } = useActiveBreakpoint();
    const [isRTL] = useRightToLeft();

    useEffect(() => {
        window.addEventListener('unload', onClear);
        const unregister = busy.register();
        return () => {
            window.removeEventListener('unload', onClear);
            unregister();
        };
    }, [onClear]);

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

    const entries = useMemo(() => {
        return [...downloadEntries, ...uploadEntries]
            .sort((a, b) => b.transfer.startDate.getTime() - a.transfer.startDate.getTime())
            .filter((entry) => {
                if (transferGroupFilter === undefined) {
                    return true;
                }
                return STATE_TO_GROUP_MAP[entry.transfer.state] === transferGroupFilter;
            });
    }, [downloadEntries, uploadEntries, transferGroupFilter]);

    const handleCloseClick = () => {
        if (allTransfersFinished) {
            onClear();
        } else {
            openConfirmModal({
                title: c('Title').t`Cancel all active transfers`,
                confirm: c('Action').t`Confirm`,
                message: c('Info').t`Closing transfer manager will cancel all active transfers, are you sure?`,
                onConfirm: onClear,
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

    const calcultateItemsHeight = useCallback(
        (itemCount: number) => {
            return ROW_HEIGHT_PX * Math.min(maxVisibleTransfers, itemCount);
        },
        [entries]
    );

    const calculateListHeight = useCallback(
        (itemCount: number) => {
            const itemsHeight = calcultateItemsHeight(itemCount);

            if (itemsHeight + (rectHeader?.height || 0) > windowHeight) {
                return windowHeight - (rectHeader?.height || 0);
            }

            return itemsHeight;
        },
        [windowHeight, isToolbarExpanded]
    );

    const shouldDisplayToolbar = !isNarrow && !minimized;

    return (
        <div
            id="transfer-manager"
            className={classnames(['transfers-manager', minimized && 'transfers-manager--minimized'])}
        >
            <div ref={headerRef}>
                <Header
                    downloads={downloads}
                    uploads={uploads}
                    latestStats={latestStats}
                    minimized={minimized}
                    onToggleMinimize={toggleMinimized}
                    onClose={handleCloseClick}
                />
                {shouldDisplayToolbar && (
                    <Toolbar
                        onTransferGroupFilterChange={setTransferGroupFilter}
                        currentTransferGroup={transferGroupFilter}
                        entries={entries}
                        isExpanded={isToolbarExpanded}
                        onExpand={setToolbarExpanded}
                    />
                )}
            </div>
            {entries.length === 0 && (
                <div
                    className="transfers-manager-list-placeholder flex flex-justify-center flex-align-items-center"
                    style={{ height: calcultateItemsHeight(1) }}
                >
                    <span>{c('Info').t`No results found`} </span>
                </div>
            )}
            <div className="transfers-manager-list" ref={containerRef}>
                {rect && (
                    <FixedSizeList
                        direction={isRTL ? 'rtl' : 'ltr'}
                        className="outline-none"
                        itemData={{
                            entries,
                            latestStats,
                            calculateAverageSpeed,
                        }}
                        itemCount={entries.length}
                        itemSize={ROW_HEIGHT_PX}
                        height={calculateListHeight(entries.length)}
                        width={rect.width}
                        itemKey={(index, { entries }: ListItemData) => entries[index].transfer?.id ?? index}
                    >
                        {ListItemRow}
                    </FixedSizeList>
                )}
            </div>
        </div>
    );
};

/**
 * This component is introduced specifically to address the race condition of
 * `return null` code branch caused by `clearAllTransfers` call and width
 * calculation inside `TransferManager`.
 *
 * Separating this chunk of code into its component guaranties that
 * list element will be *always* present in DOM for correct transfer manager list
 * width calculation.
 */
const TransferManagerContainer = () => {
    const { downloads, getDownloadsProgresses, clearDownloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses, clearUploads } = useUploadProvider();

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

    const latestStats = statsHistory[0];

    if (!latestStats || downloads.length + uploads.length === 0) {
        return null;
    }

    return (
        <TransferManager
            downloads={downloads}
            uploads={uploads}
            statsHistory={statsHistory}
            onClear={clearAllTransfers}
            allTransfersFinished={allTransfersFinished}
        />
    );
};

export default TransferManagerContainer;
