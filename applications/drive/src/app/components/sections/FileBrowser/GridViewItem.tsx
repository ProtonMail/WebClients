import { c } from 'ttag';

import { Button, Checkbox, FileIcon, FileNameDisplay, Icon, classnames } from '@proton/components';

import { stopPropagation } from '../../../utils/stopPropagation';
import { useCheckbox, useItemContextMenu, useSelection } from '../../FileBrowser';
import SignatureIcon from '../../SignatureIcon';
import { DriveItem } from '../Drive/Drive';
import { SharedLinkItem } from '../SharedLinks/SharedLinks';
import { TrashItem } from '../Trash/Trash';
import { getLinkIconText } from './utils';

export function GridViewItem({ item }: { item: DriveItem | TrashItem | SharedLinkItem }) {
    const selectionControls = useSelection()!;
    const contextMenuControls = useItemContextMenu();
    const { handleCheckboxChange, handleCheckboxClick, handleCheckboxWrapperClick } = useCheckbox(item.id);

    const iconText = getLinkIconText({
        isFile: item.isFile,
        mimeType: item.mimeType,
        linkName: item.name,
    });

    const isContextMenuButtonActive = contextMenuControls.isOpen && selectionControls.selectedItemIds.includes(item.id);

    return (
        <>
            <div className="flex flex-item-fluid flex-justify-center flex-align-items-center file-browser-grid-item--container">
                {item.cachedThumbnailUrl ? (
                    <img src={item.cachedThumbnailUrl} className="file-browser-grid-item--thumbnail" alt={iconText} />
                ) : (
                    <FileIcon size={48} mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} />
                )}
            </div>
            <div
                className={classnames([
                    'flex file-browser-grid-item--select',
                    selectionControls?.selectedItemIds.length ? null : 'opacity-on-hover-only-desktop',
                ])}
                onTouchStart={stopPropagation}
                onKeyDown={stopPropagation}
                onClick={handleCheckboxWrapperClick}
            >
                <Checkbox
                    disabled={item.isLocked}
                    className="increase-click-surface file-browser-grid-item-checkbox"
                    checked={selectionControls.isSelected(item.id)}
                    onChange={handleCheckboxChange}
                    onClick={handleCheckboxClick}
                />
            </div>
            <div className="file-browser-grid-item--file-name flex border-top">
                <SignatureIcon
                    isFile={item.isFile}
                    signatureIssues={item.signatureIssues}
                    className="file-browser-grid-view--signature-icon"
                />
                <FileNameDisplay text={item.name} className="center" />
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
}
