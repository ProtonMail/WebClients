import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, FileNameDisplay, Icon, classnames } from '@proton/components';

import { stopPropagation } from '../../../utils/stopPropagation';
import { useCheckbox, useItemContextMenu, useSelection } from '../../FileBrowser';
import { SelectionState } from '../../FileBrowser/hooks/useSelectionControls';
import { DeviceItem } from '../Devices/Devices';
import { DriveItem } from '../Drive/Drive';
import { SharedLinkItem } from '../SharedLinks/SharedLinks';
import { TrashItem } from '../Trash/Trash';

const GridViewItemBase = ({
    IconComponent,
    SignatureIconComponent,
    item,
    disableSelection = false,
}: {
    IconComponent: React.ReactNode;
    SignatureIconComponent?: React.ReactNode;
    item: DriveItem | TrashItem | SharedLinkItem | DeviceItem;
    disableSelection?: boolean;
}) => {
    const selectionControls = useSelection()!;
    const contextMenuControls = useItemContextMenu();
    const { handleCheckboxChange, handleCheckboxClick, handleCheckboxWrapperClick } = useCheckbox(item.id);

    const isContextMenuButtonActive = contextMenuControls.isOpen && selectionControls.selectedItemIds.includes(item.id);
    return (
        <>
            <div className="flex flex-item-fluid flex-justify-center flex-align-items-center file-browser-grid-item--container">
                {IconComponent}
            </div>
            <div
                className={classnames([
                    'flex file-browser-grid-item--select',
                    selectionControls?.selectionState !== SelectionState.NONE ? null : 'opacity-on-hover-only-desktop',
                ])}
                onTouchStart={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={handleCheckboxWrapperClick}
            >
                {!disableSelection ? (
                    <Checkbox
                        disabled={item.isLocked}
                        className="increase-click-surface file-browser-grid-item-checkbox"
                        checked={selectionControls.isSelected(item.id)}
                        onChange={handleCheckboxChange}
                        onClick={handleCheckboxClick}
                    />
                ) : null}
            </div>
            <div className="file-browser-grid-item--file-name flex border-top">
                {SignatureIconComponent ? SignatureIconComponent : null}
                <FileNameDisplay text={item.name} className="mxauto" />
                <Button
                    shape="ghost"
                    size="small"
                    icon
                    className={classnames([
                        'file-browser-grid-view--options',
                        isContextMenuButtonActive ? 'file-browser--options-focus' : 'opacity-on-hover-only-desktop',
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
