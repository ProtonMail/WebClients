import React from 'react';
import { c } from 'ttag';

import {
    TableRow,
    Checkbox,
    Time,
    useActiveBreakpoint,
    classnames,
    DragMoveContainer,
    FileIcon,
} from 'react-components';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { isEquivalent, pick } from 'proton-shared/lib/helpers/object';
import { shallowEqual } from 'proton-shared/lib/helpers/array';
import { ItemProps } from '../interfaces';
import { LinkType } from '../../../interfaces/link';
import LocationCell from './LocationCell';
import { getMimeTypeDescription } from '../../Drive/helpers';
import ItemContextMenu from '../ItemContextMenu';
import useFileBrowserItem from '../useFileBrowserItem';

const ItemRow = ({
    item,
    shareId,
    selectedItems,
    onToggleSelect,
    onClick,
    onShiftClick,
    showLocation,
    selectItem,
    secondaryActionActive,
    dragMoveControls,
    isPreview,
}: ItemProps) => {
    const {
        isFolder,
        dragMove: { DragMoveContent, dragging },
        dragMoveItems,
        moveText,
        iconText,
        isSelected,
        contextMenu,
        contextMenuPosition,
        draggable,
        itemHandlers,
        checkboxHandlers,
        checkboxWrapperHandlers,
    } = useFileBrowserItem<HTMLTableRowElement>({
        item,
        onToggleSelect,
        selectItem,
        selectedItems,
        dragMoveControls,
        onClick,
        onShiftClick,
    });

    const { isDesktop } = useActiveBreakpoint();
    const itemType = isFolder ? c('Label').t`Folder` : getMimeTypeDescription(item.MIMEType);

    const cells = [
        <div role="presentation" key="select" className="flex" {...checkboxWrapperHandlers}>
            <Checkbox
                disabled={item.Disabled}
                className="increase-surface-click"
                checked={isSelected}
                {...checkboxHandlers}
            />
        </div>,
        <div key="filename" className="flex flex-items-center flex-nowrap">
            <FileIcon mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType} alt={iconText} />
            <span title={item.Name} className="ellipsis">
                <span className="pre">{item.Name}</span>
            </span>
        </div>,
        showLocation && <LocationCell shareId={shareId} item={item} />,
        <div title={itemType} className="ellipsis">
            {itemType}
        </div>,
        isDesktop && (
            <div
                className="ellipsis"
                title={readableTime(item.Trashed ?? item.ModifyTime, 'PPp', { locale: dateLocale })}
            >
                <Time key="dateModified" format="PPp">
                    {item.Trashed ?? item.ModifyTime}
                </Time>
            </div>
        ),
        isFolder ? (
            '-'
        ) : (
            <div key="size" className="ellipsis" title={humanSize(item.Size)}>
                {humanSize(item.Size)}
            </div>
        ),
    ].filter(Boolean);

    return (
        <>
            {draggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                cells={cells}
                draggable={draggable}
                tabIndex={0}
                role="button"
                ref={contextMenu.anchorRef}
                aria-disabled={item.Disabled}
                className={classnames([
                    'no-outline',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) && 'bg-global-highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                {...itemHandlers}
            />
            {!isPreview && !item.Disabled && (
                <ItemContextMenu
                    item={item}
                    selectedItems={selectedItems}
                    shareId={shareId}
                    position={contextMenuPosition}
                    {...contextMenu}
                />
            )}
        </>
    );
};

export default React.memo(ItemRow, (a, b) => {
    if (isEquivalent(a, b)) {
        return true;
    }

    const cheapPropsEqual = isEquivalent(
        pick(a, ['shareId', 'showLocation', 'secondaryActionActive']),
        pick(b, ['shareId', 'showLocation', 'secondaryActionActive'])
    );

    if (!cheapPropsEqual || !isEquivalent(a.item, b.item) || !shallowEqual(a.selectedItems, b.selectedItems)) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget;

    return dragControlsEqual;
});
