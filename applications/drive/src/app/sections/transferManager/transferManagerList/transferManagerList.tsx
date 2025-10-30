import { memo, useRef } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { FixedSizeList } from 'react-window';

import { useActiveBreakpoint, useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { TransferItem } from '../transferItem/transferItem';
import type { TransferManagerEntry } from '../useTransferManagerState';

const TRANSFER_MANAGER_WIDTH_PX = 500;
const TRANSFER_MANAGER_ROW_HEIGHT_REM = 3.3;
const TRANSFER_MANAGER_MAX_VISIBLE_ROWS_LARGE = 5;
const TRANSFER_MANAGER_MAX_VISIBLE_ROWS_SMALL = 3;

type RowData = {
    items: TransferManagerEntry[];
};

const TransferListRow = memo(({ index, style, data }: ListChildComponentProps<RowData>) => {
    const { items } = data;
    const reversedIndex = items.length - 1 - index;
    const entry = items[reversedIndex];
    // TODO: add conditional styling depending on some special cases like malaware detection

    return (
        <div style={style}>
            <TransferItem entry={entry} />
        </div>
    );
});

TransferListRow.displayName = 'TransferListRow';

type TransferManagerListProps = {
    items: TransferManagerEntry[];
};

export const TransferManagerList = ({ items }: TransferManagerListProps) => {
    const listContainerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(listContainerRef);
    const { viewportWidth } = useActiveBreakpoint();

    const rootSize = rootFontSize();
    const rowHeightPx = TRANSFER_MANAGER_ROW_HEIGHT_REM * rootSize;
    const itemSize = rowHeightPx;
    const maxVisibleRows = viewportWidth['<=small']
        ? TRANSFER_MANAGER_MAX_VISIBLE_ROWS_SMALL
        : TRANSFER_MANAGER_MAX_VISIBLE_ROWS_LARGE;
    const visibleRowCount = Math.min(items.length || 1, maxVisibleRows);
    const listHeight = Math.max(rowHeightPx, rowHeightPx * visibleRowCount);
    const listWidth = rect?.width ?? TRANSFER_MANAGER_WIDTH_PX;

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
                        itemData={{ items }}
                        itemSize={itemSize}
                        width={listWidth}
                        itemKey={(index, { items }) => items[items.length - 1 - index]?.id ?? index}
                    >
                        {TransferListRow}
                    </FixedSizeList>
                )}
            </div>
        </div>
    );
};
