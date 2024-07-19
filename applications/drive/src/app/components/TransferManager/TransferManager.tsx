import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { FixedSizeList } from 'react-window';

import { c, msgid } from 'ttag';

import {
    Tabs,
    useActiveBreakpoint,
    useConfirmActionModal,
    useDrawerWidth,
    useElementRect,
    useRightToLeft,
    useToggle,
    useWindowSize,
} from '@proton/components';
import busy from '@proton/shared/lib/busy';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import { useTransfersView } from '../../store';
import { isTransferFailed } from '../../utils/transfer';
import Header from './Header';
import HeaderButtons from './HeaderButtons';
import Transfer from './TransferItem';
import type { Download, TransfersStats, Upload } from './transfer';
import { STATE_TO_GROUP_MAP, TransferGroup, TransferType } from './transfer';
import useTransferControls from './useTransferControls';

interface TransferListEntry<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

const MAX_VISIBLE_TRANSFERS_LARGE_SCREEN = 5;
const MAX_VISIBLE_TRANSFERS_SMALL_SCREEN = 3;

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
    numberOfFailedTransfer,
}: {
    downloads: Download[];
    uploads: Upload[];
    stats: TransfersStats;
    onClear: () => void;
    hasActiveTransfer: boolean;
    numberOfFailedTransfer: {
        total: number;
        downloads: number;
        uploads: number;
    };
}) => {
    const transferManagerControls = useTransferControls();

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
    const rect = useElementRect(containerRef);
    const rectHeader = useElementRect(headerRef);
    const { state: minimized, toggle: toggleMinimized } = useToggle();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { viewportWidth } = useActiveBreakpoint();
    const [isRTL] = useRightToLeft();

    const ROW_HEIGHT_PX = 4.375 * rootFontSize(); // 4.375 * 16 =  we want 70px by default

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
            void showConfirmModal({
                title: c('Title').t`Stop transfers?`,
                cancelText: c('Action').t`Continue transfers`,
                submitText: c('Action').t`Stop transfers`,
                message: c('Info')
                    .t`There are files that still need to be transferred. Closing the transfer manager will end all operations.`,
                onSubmit: async () => onClear(),
                canUndo: true,
            });
            return;
        }

        if (numberOfFailedTransfer.total) {
            let title = c('Title').ngettext(
                msgid`${numberOfFailedTransfer.total} failed transfer`,
                `${numberOfFailedTransfer.total} failed transfers`,
                numberOfFailedTransfer.total
            );
            let message = c('Info').t`Not all files were transferred. Try uploading or downloading the files again.`;
            if (numberOfFailedTransfer.uploads && !numberOfFailedTransfer.downloads) {
                title = c('Title').ngettext(
                    msgid`${numberOfFailedTransfer.total} failed upload`,
                    `${numberOfFailedTransfer.total} failed uploads`,
                    numberOfFailedTransfer.total
                );
                message = c('Info').t`Some files failed to upload. Try uploading the files again.`;
            } else if (!numberOfFailedTransfer.uploads && numberOfFailedTransfer.downloads) {
                title = c('Title').ngettext(
                    msgid`${numberOfFailedTransfer.total} failed download`,
                    `${numberOfFailedTransfer.total} failed downloads`,
                    numberOfFailedTransfer.total
                );
                message = c('Info').t`Some files failed to download. Try downloading the files again.`;
            }

            void showConfirmModal({
                title,
                message,
                cancelText: c('Action').t`Retry`,
                submitText: c('Action').t`Close`,
                onCancel: () => {
                    return transferManagerControls.restartTransfers(
                        entries.filter(({ transfer }) => {
                            return isTransferFailed(transfer);
                        })
                    );
                },
                onSubmit: async () => onClear(),
                canUndo: true,
            });
            return;
        }

        onClear();
    };

    const maxVisibleTransfers = viewportWidth['<=small']
        ? MAX_VISIBLE_TRANSFERS_SMALL_SCREEN
        : MAX_VISIBLE_TRANSFERS_LARGE_SCREEN;

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
                    className="transfers-manager-list-placeholder flex justify-center items-center"
                    style={{ height: calcultateItemsHeight(1) }}
                >
                    <span className="mb-4">{c('Info').t`No results found`} </span>
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

    const drawerWidth = useDrawerWidth();

    return (
        <>
            <div
                id="transfer-manager"
                className={clsx(['transfers-manager', minimized && 'transfers-manager--minimized'])}
                style={{ marginRight: `${drawerWidth}px` }}
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
                            {!viewportWidth['<=small'] && (
                                <HeaderButtons
                                    className="transfers-manager-header-buttons p-2 pr-4"
                                    entries={entries}
                                    showDownloadLog={activeTabIndex === TransferGroup.FAILURE}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
            {confirmModal}
        </>
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
    const { downloads, uploads, hasActiveTransfer, numberOfFailedTransfer, stats, clearAllTransfers } =
        useTransfersView();

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
            numberOfFailedTransfer={numberOfFailedTransfer}
        />
    );
};

export default TransferManagerContainer;
