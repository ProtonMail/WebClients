import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Badge, Checkbox, FileNameDisplay, Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { stopPropagation } from '../../../utils/stopPropagation';
import { useCheckbox, useItemContextMenu, useSelection } from '../../FileBrowser';
import { SelectionState } from '../../FileBrowser/hooks/useSelectionControls';
import type { DeviceItem } from '../Devices/Devices';
import type { DriveItem } from '../Drive/Drive';
import type { SharedLinkItem } from '../SharedLinks/SharedLinks';
import type { SharedWithMeItem } from '../SharedWithMe/SharedWithMe';
import type { TrashItem } from '../Trash/Trash';

const GridViewItemBase = ({
    IconComponent,
    SignatureIconComponent,
    item,
    disableSelection = false,
}: {
    IconComponent: React.ReactNode;
    SignatureIconComponent?: React.ReactNode;
    item: DriveItem | TrashItem | SharedLinkItem | DeviceItem | SharedWithMeItem;
    disableSelection?: boolean;
}) => {
    const selectionControls = useSelection()!;
    const contextMenuControls = useItemContextMenu();
    const { handleCheckboxChange, handleCheckboxClick, handleCheckboxWrapperClick } = useCheckbox(item.id);

    const isContextMenuButtonActive = contextMenuControls.isOpen && selectionControls.selectedItemIds.includes(item.id);
    return (
        <>
            <button
                className={clsx(
                    'flex flex-1 justify-center items-center file-browser-grid-item--container',
                    item.isInvitation && 'file-browser-grid-item--invitation'
                )}
                onClick={(e) => {
                    // Show Accept/Decline context menu if you click on the box
                    if (item.isInvitation) {
                        selectionControls?.selectItem(item.id);
                        contextMenuControls.handleContextMenu(e);
                    }
                }}
                onTouchEnd={(e) => {
                    if (item.isInvitation) {
                        selectionControls?.selectItem(item.id);
                        contextMenuControls.handleContextMenuTouch?.(e);
                    }
                }}
            >
                <>
                    {item.isInvitation && (
                        <Badge className="absolute top-0 right-0 mt-1 mr-1" type="primary">{c('Badge')
                            .t`Invited`}</Badge>
                    )}
                    {IconComponent}
                </>
            </button>
            <div
                className={clsx([
                    'flex file-browser-grid-item--select',
                    selectionControls?.selectionState !== SelectionState.NONE ? null : 'mouse:group-hover:opacity-100',
                ])}
                onTouchStart={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={handleCheckboxWrapperClick}
            >
                {!disableSelection ? (
                    <Checkbox
                        disabled={item.isLocked}
                        className="expand-click-area file-browser-grid-item-checkbox"
                        checked={selectionControls.isSelected(item.id)}
                        onChange={handleCheckboxChange}
                        onClick={handleCheckboxClick}
                    />
                ) : null}
            </div>
            <div
                className={clsx(
                    'file-browser-grid-item--file-name flex border-top',
                    item.isInvitation && 'file-browser-grid-item--invitation'
                )}
            >
                {SignatureIconComponent ? SignatureIconComponent : null}
                <FileNameDisplay text={item.name} className="mx-auto" data-testid="grid-item-name" />
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    className={clsx([
                        'file-browser-grid-view--options',
                        isContextMenuButtonActive ? 'file-browser--options-focus' : 'mouse:group-hover:opacity-100',
                    ])}
                    onClick={(e) => {
                        selectionControls?.selectItem(item.id);
                        contextMenuControls.handleContextMenu(e);
                    }}
                    onTouchEnd={(e) => {
                        selectionControls?.selectItem(item.id);
                        contextMenuControls.handleContextMenuTouch?.(e);
                    }}
                >
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                </Button>
            </div>
        </>
    );
};

export default GridViewItemBase;
