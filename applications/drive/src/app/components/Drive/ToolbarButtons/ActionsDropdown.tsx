import { useState } from 'react';
import { c } from 'ttag';

import {
    generateUID,
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    Icon,
    DropdownMenuButton,
    ToolbarButton,
} from '@proton/components';

import { useDriveContent } from '../DriveContentProvider';
import { useDriveActiveFolder } from '../DriveFolderProvider';
import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { LinkType } from '../../../interfaces/link';

interface Props {
    shareId: string;
}

const ActionsDropdown = ({ shareId }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { openDetails, openFilesDetails, openMoveToFolder, openMoveToTrash, openRename, openLinkSharing } =
        useToolbarActions();
    const { folder } = useDriveActiveFolder();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);
    const isMultiSelect = selectedItems.length > 1;
    const hasSharedLink = !!selectedItems[0]?.SharedUrl;

    const menuItems = [
        {
            hidden: isMultiSelect,
            name: c('Action').t`Rename`,
            icon: 'note-pen',
            testId: 'actions-dropdown-rename',
            action: () => openRename(shareId, selectedItems[0]),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'circle-info',
            testId: 'actions-dropdown-details',
            action: () => openDetails(shareId, selectedItems[0]),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: 'circle-info',
            testId: 'actions-dropdown-details',
            action: () => openFilesDetails(selectedItems),
        },
        {
            hidden: false,
            name: c('Action').t`Move to folder`,
            icon: 'arrows-up-down-left-right',
            testId: 'actions-dropdown-move',
            action: () => folder && openMoveToFolder(folder, selectedItems),
        },
        {
            hidden: isMultiSelect || hasFoldersSelected,
            name: hasSharedLink ? c('Action').t`Sharing options` : c('Action').t`Share via link`,
            icon: 'link',
            testId: 'actions-dropdown-share',
            action: () => openLinkSharing(shareId, selectedItems[0]),
        },
        {
            hidden: false,
            name: c('Action').t`Move to trash`,
            icon: 'trash',
            testId: 'actions-dropdown-trash',
            action: () => folder && openMoveToTrash(folder, selectedItems),
        },
    ];

    const dropdownMenuButtons = menuItems
        .filter((menuItem) => !menuItem.hidden)
        .map((item) => (
            <DropdownMenuButton
                key={item.name}
                hidden={item.hidden}
                onContextMenu={(e) => e.stopPropagation()}
                className="flex flex-nowrap text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                    close();
                }}
                data-testid={item.testId}
            >
                <Icon className="mt0-25 mr0-5" name={item.icon} />
                {item.name}
            </DropdownMenuButton>
        ));

    return (
        <>
            <ToolbarButton
                disabled={!selectedItems.length}
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={<Icon name="angle-down" rotate={isOpen ? 180 : 0} />}
                data-testid="actions-dropdown"
                title={c('Title').t`Show actions`}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default ActionsDropdown;
