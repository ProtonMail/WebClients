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
    Tabs,
} from '@proton/components';
import { buffer } from '@proton/shared/lib/helpers/function';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import busy from '@proton/shared/lib/busy';
import {
    Download,
    STATE_TO_GROUP_MAP,
    TransferGroup,
    TransferType,
    TransfersStats,
    Upload,
} from '@proton/shared/lib/interfaces/drive/transfer';

import useConfirm from '../../hooks/util/useConfirm';
import { useTransfersView } from '../../store';
import Header from './Header';
import Transfer from './Transfer';
import HeaderButtons from './HeaderButtons';

interface TransferListEntry<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

const ROW_HEIGHT_PX = 4.375 * rootFontSize; // 4.375 * 16 =  we want 70px by default
const MAX_VISIBLE_TRANSFERS = 5;
const MAX_VISIBLE_TRANSFERS_MOBILE = 3;

type ListItemData = {
    entries: (TransferListEntry<TransferType.Download> | TransferListEntry<TransferType.Upload>)[];
    stats: TransfersStats;
};

type ListItemRowProps = Omit<ListChildComponentProps, 'data'> & { data: ListItemData };

const ListItemRow = ({ style, index, data }: ListItemRowProps) => {
    const { stats, entries } = data;
    const { transfer, type } = entries[index];

    return (
        <Transfer
            style={style}
            transfer={transfer}
            type={type}
            stats={{
                progress: stats[transfer.id]?.progress ?? 0,
                speed: stats[transfer.id]?.averageSpeed ?? 0,
            }}
        />
    );
};

const tabIndexToTransferGroup = {
    0: undefined,
    1: TransferGroup.ACTIVE,
    2: TransferGroup.DONE,
    3: TransferGroup.FAILURE,
};

type TabIndices = keyof typeof tabIndexToTransferGroup;

const TransferManager = ({
    downloads,
    uploads,
    stats,
    onClear,
    hasActiveTransfer,
}: {
    downloads: Download[];
    uploads: Upload[];
    stats: TransfersStats;
    onClear: () => void;
    hasActiveTransfer: boolean;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const [activeTabIndex, setActiveTabIndex] = useState<TabIndices>(0);
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
                const transferGroupFilter = tabIndexToTransferGroup[activeTabIndex];
                if (transferGroupFilter === undefined) {
                    return true;
                }
                return STATE_TO_GROUP_MAP[entry.transfer.state] === transferGroupFilter;
            });
    }, [downloadEntries, uploadEntries, activeTabIndex]);

    const handleCloseClick = () => {
        if (hasActiveTransfer) {
            openConfirmModal({
                title: c('Title').t`Cancel all active transfers`,
                confirm: c('Action').t`Confirm`,
                message: c('Info').t`Closing transfer manager will cancel all active transfers, are you sure?`,
                onConfirm: async () => onClear(),
            });
        } else {
            onClear();
        }
    };

    const maxVisibleTransfers = isNarrow ? MAX_VISIBLE_TRANSFERS_MOBILE : MAX_VISIBLE_TRANSFERS;

    const calcultateItemsHeight = useCallback(
        (itemCount: number) => {
            return ROW_HEIGHT_PX * Math.min(maxVisibleTransfers, itemCount);
        },
        [entries, minimized]
    );

    const calculateListHeight = useCallback(
        (itemCount: number) => {
            const itemsHeight = calcultateItemsHeight(itemCount);

            if (itemsHeight + (rectHeader?.height || 0) > windowHeight) {
                return windowHeight - (rectHeader?.height || 0);
            }

            return itemsHeight;
        },
        [windowHeight, minimized]
    );

    const Content = (
        <>
            {entries.length === 0 && (
                <div
                    className="transfers-manager-list-placeholder flex flex-justify-center flex-align-items-center"
                    style={{ height: calcultateItemsHeight(1) }}
                >
                    <span className="mb1">{c('Info').t`No results found`} </span>
                </div>
            )}
            <div className="transfers-manager-list">
                {rect && (
                    <FixedSizeList
                        direction={isRTL ? 'rtl' : 'ltr'}
                        className="outline-none"
                        itemData={{
                            entries,
                            stats,
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
        </>
    );

    return (
        <div
            id="transfer-manager"
            className={classnames(['transfers-manager', minimized && 'transfers-manager--minimized'])}
        >
            <div ref={headerRef}>
                <Header
                    downloads={downloads}
                    uploads={uploads}
                    stats={stats}
                    minimized={minimized}
                    onToggleMinimize={toggleMinimized}
                    onClose={handleCloseClick}
                />
            </div>
            <div ref={containerRef} className="flex">
                {!minimized && (
                    <>
                        <Tabs
                            tabs={[
                                {
                                    title: c('Title').t`All`,
                                    content: Content,
                                },
                                {
                                    title: c('Title').t`Active`,
                                    content: Content,
                                },
                                {
                                    title: c('Title').t`Completed`,
                                    content: Content,
                                },
                                {
                                    title: c('Title').t`Failed`,
                                    content: Content,
                                },
                            ]}
                            value={activeTabIndex}
                            onChange={(groupValue) => {
                                setActiveTabIndex(groupValue as TabIndices);
                            }}
                        />
                        {!isNarrow && (
                            <HeaderButtons className="transfers-manager-header-buttons p0-5 pr1" entries={entries} />
                        )}
                    </>
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
    const { downloads, uploads, hasActiveTransfer, stats, clearAllTransfers } = useTransfersView();

    if (!downloads.length && !uploads.length) {
        return null;
    }

    return (
        <TransferManager
            downloads={downloads}
            uploads={uploads}
            stats={stats}
            onClear={clearAllTransfers}
            hasActiveTransfer={hasActiveTransfer}
        />
    );
};

export default TransferManagerContainer;
