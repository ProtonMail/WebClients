import React from 'react';

import {
    TableRow,
    Checkbox,
    useActiveBreakpoint,
    classnames,
    DragMoveContainer,
    FileIcon,
    TableCell,
} from 'react-components';
import { isEquivalent, pick } from 'proton-shared/lib/helpers/object';
import { shallowEqual } from 'proton-shared/lib/helpers/array';
import { ItemProps } from '../interfaces';
import { LinkType } from '../../../interfaces/link';
import ItemContextMenu from '../ItemContextMenu';
import useFileBrowserItem from '../useFileBrowserItem';
import LocationCell from './Cells/LocationCell';
import DescriptiveTypeCell from './Cells/DescriptiveTypeCell';
import TimeCell from './Cells/TimeCell';
import SizeCell from './Cells/SizeCell';
import NameCell from './Cells/NameCell';
import SharedURLIcon from '../SharedURLIcon';

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
                    <NameCell name={item.Name} />
                    {item.SharedURLShareID && <SharedURLIcon expired={item.UrlsExpired} />}
                </TableCell>

                {showLocation && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])}>
                        <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} />
                    </TableCell>
                )}

                <TableCell className="m0 w20">
                    <DescriptiveTypeCell mimeType={item.MIMEType} linkType={item.Type} />
                </TableCell>

                {isDesktop && (
                    <TableCell className="m0 w25">
                        <TimeCell time={item.ModifyTime} />
                    </TableCell>
                )}

                <TableCell className={classnames(['m0', isDesktop ? 'w10' : 'w15'])}>
                    {isFolder ? '-' : <SizeCell size={item.Size} />}
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

    const cheapPropsToCheck: (keyof ItemProps)[] = [
        'shareId',
        'showLocation',
        'secondaryActionActive',
        'style',
        'onToggleSelect',
        'onShiftClick',
        'onClick',
    ];
    const cheapPropsEqual = isEquivalent(pick(a, cheapPropsToCheck), pick(b, cheapPropsToCheck));

    if (!cheapPropsEqual || !isEquivalent(a.item, b.item) || !shallowEqual(a.selectedItems, b.selectedItems)) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget;

    return dragControlsEqual;
});
