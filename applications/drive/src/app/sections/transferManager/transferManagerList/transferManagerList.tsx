import { memo, useRef } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { FixedSizeList } from 'react-window';

import { useActiveBreakpoint, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import type { AbuseReportPrefill } from '../../../modals/ReportAbuseModal';
import { TransferItem } from '../transferItem/transferItem';
import { useTransferManagerActions } from '../useTransferManagerActions';
import type { TransferManagerEntry } from '../useTransferManagerState';

const TRANSFER_MANAGER_WIDTH_PX = 500;
const TRANSFER_MANAGER_ROW_HEIGHT_REM = 3.3;
const TRANSFER_MANAGER_MAX_VISIBLE_ROWS_LARGE = 5;
const TRANSFER_MANAGER_MAX_VISIBLE_ROWS_SMALL = 3;

type RowData = {
    items: TransferManagerEntry[];
    share: (entry: TransferManagerEntry, deprecatedRootShareId: string) => void;
    deprecatedRootShareId: string | undefined;
    onReportAbuse?: (nodeUid: string, prefill?: AbuseReportPrefill) => void;
};

const TransferListRow = memo(({ index, style, data }: ListChildComponentProps<RowData>) => {
    const { items, share, deprecatedRootShareId, onReportAbuse } = data;
    const entry = items[index];
    // TODO: add conditional styling depending on some special cases like malaware detection

    return (
        <div style={style}>
            <TransferItem
                entry={entry}
                onShare={deprecatedRootShareId ? () => share(entry, deprecatedRootShareId) : undefined}
                onReportAbuse={onReportAbuse}
            />
        </div>
    );
});

TransferListRow.displayName = 'TransferListRow';

type TransferManagerListProps = {
    items: TransferManagerEntry[];
    deprecatedRootShareId: string | undefined;
    onReportAbuse?: (nodeUid: string, prefill?: AbuseReportPrefill) => void;
};

export const TransferManagerList = ({ items, deprecatedRootShareId, onReportAbuse }: TransferManagerListProps) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(listContainerRef);
    const { viewportWidth } = useActiveBreakpoint();
    const { share, sharingModal } = useTransferManagerActions();
    const rootSize = rootFontSize();
    const rowHeightPx = TRANSFER_MANAGER_ROW_HEIGHT_REM * rootSize;
    const itemSize = rowHeightPx;
    const maxVisibleRows = viewportWidth['<=small']
        ? TRANSFER_MANAGER_MAX_VISIBLE_ROWS_SMALL
        : TRANSFER_MANAGER_MAX_VISIBLE_ROWS_LARGE;
    const visibleRowCount = Math.min(items.length || 1, maxVisibleRows);
    const listHeight = Math.max(rowHeightPx, rowHeightPx * visibleRowCount);
    const listWidth = rect?.width ?? TRANSFER_MANAGER_WIDTH_PX;
    const hasOverflow = items.length > visibleRowCount;

    if (!items.length) {
        return null;
    }

    return (
        <div className="pb-4">
            <div ref={listContainerRef}>
                {listWidth && (
                    <FixedSizeList
                        height={listHeight}
                        itemCount={items.length}
                        itemData={{ items, share, deprecatedRootShareId, onReportAbuse }}
                        itemSize={itemSize}
                        width={listWidth}
                        itemKey={(index, { items }) => items[index].id}
                        className={hasOverflow ? 'scrollbar-always-visible' : undefined}
                    >
                        {TransferListRow}
                    </FixedSizeList>
                )}
            </div>
            {sharingModal}
        </div>
    );
};
