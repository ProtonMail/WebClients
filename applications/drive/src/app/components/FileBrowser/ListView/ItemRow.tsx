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
    TableCell,
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
    style,
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

    return (
        <>
            {draggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                style={style}
                draggable={draggable}
                tabIndex={0}
                role="button"
                ref={contextMenu.anchorRef}
                aria-disabled={item.Disabled}
                className={classnames([
                    'pd-fb-list-item no-outline flex',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) && 'bg-global-highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                {...itemHandlers}
            >
                <TableCell className="m0 flex">
                    <div role="presentation" className="flex flex-items-center" {...checkboxWrapperHandlers}>
                        <Checkbox
                            disabled={item.Disabled}
                            className="increase-surface-click"
                            checked={isSelected}
                            {...checkboxHandlers}
                        />
                    </div>
                </TableCell>

                <TableCell className="m0 flex flex-items-center flex-nowrap flex-item-fluid">
                    <FileIcon mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType} alt={iconText} />
                    <span title={item.Name} className="ellipsis">
                        <span className="pre">{item.Name}</span>
                    </span>
                </TableCell>

                {showLocation && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])}>
                        <LocationCell shareId={shareId} item={item} />
                    </TableCell>
                )}

                <TableCell className="m0 w20">
                    <div title={itemType} className="ellipsis">
                        {itemType}
                    </div>
                </TableCell>

                {isDesktop && (
                    <TableCell className="m0 w25">
                        <div
                            className="ellipsis"
                            title={readableTime(item.Trashed ?? item.ModifyTime, 'PPp', { locale: dateLocale })}
                        >
                            <Time key="dateModified" format="PPp">
                                {item.Trashed ?? item.ModifyTime}
                            </Time>
                        </div>
                    </TableCell>
                )}

                <TableCell className={classnames(['m0', isDesktop ? 'w10' : 'w15'])}>
                    {isFolder ? (
                        '-'
                    ) : (
                        <div className="ellipsis" title={humanSize(item.Size)}>
                            {humanSize(item.Size)}
                        </div>
                    )}
                </TableCell>
            </TableRow>
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
        pick(a, ['shareId', 'showLocation', 'secondaryActionActive', 'style']),
        pick(b, ['shareId', 'showLocation', 'secondaryActionActive', 'style'])
    );

    if (!cheapPropsEqual || !isEquivalent(a.item, b.item) || !shallowEqual(a.selectedItems, b.selectedItems)) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget;

    return dragControlsEqual;
});
