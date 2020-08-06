import React, { useEffect } from 'react';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';

import { ContextMenu, DropdownMenuButton, Icon, isPreviewAvailable } from 'react-components';

import { FileBrowserItem } from './interfaces';
import { LinkType } from '../../interfaces/link';
import { toLinkURLType } from '../Drive/helpers';
import useToolbarActions from '../../hooks/drive/useToolbarActions';

interface Props extends RouteComponentProps {
    item: FileBrowserItem;
    selectedItems: FileBrowserItem[];
    shareId: string;
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position:
        | {
              top: number;
              left: number;
          }
        | undefined;
    open: () => void;
    close: () => void;
}

const RowContextMenu = ({ item, selectedItems, shareId, anchorRef, isOpen, position, open, close, history }: Props) => {
    const {
        download,
        openDeletePermanently,
        openDetails,
        openMoveToFolder,
        openMoveToTrash,
        openRename,
        preview,
        restoreFromTrash,
    } = useToolbarActions();

    const isMultiSelect = selectedItems.length > 1;
    const hasFoldersSelected = selectedItems.some((item) => item.Type === LinkType.FOLDER);
    const isPreviewHidden = isMultiSelect || hasFoldersSelected || !item.MIMEType || !isPreviewAvailable(item.MIMEType);

    // TODO: refactor after router version upgrade.
    const openLink = (shareId: string, linkId: string, type: LinkType) => {
        history.push(`/drive/${shareId}/${toLinkURLType(type)}/${linkId}`);
    };

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    const driveMenuItems = [
        {
            hidden: isPreviewHidden,
            name: c('Action').t`Preview`,
            icon: 'read',
            testId: 'context-menu-preview',
            action: () => preview(item, openLink),
        },
        {
            hidden: false,
            name: c('Action').t`Download`,
            icon: 'download',
            testId: 'context-menu-download',
            action: () => download(selectedItems),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Rename`,
            icon: 'file-edit',
            testId: 'context-menu-rename',
            action: () => openRename(item),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info',
            testId: 'context-menu-details',
            action: () => openDetails(item),
        },
        {
            hidden: false,
            name: c('Action').t`Move to Folder`,
            icon: 'arrow-cross',
            testId: 'context-menu-move',
            action: () => openMoveToFolder(selectedItems),
        },
        {
            hidden: false,
            name: c('Action').t`Move to Trash`,
            icon: 'trash',
            testId: 'context-menu-trash',
            action: () => openMoveToTrash(selectedItems),
        },
    ];

    const trashMenuItems = [
        {
            hidden: false,
            name: c('Action').t`Restore from Trash`,
            icon: 'repeat',
            testId: 'context-menu-restore',
            action: () => restoreFromTrash(shareId, selectedItems),
        },
        {
            hidden: false,
            name: c('Action').t`Delete permanently`,
            icon: 'delete',
            testId: 'context-menu-delete',
            action: () => openDeletePermanently(shareId, selectedItems),
        },
    ];

    const menuButtons = (item.Trashed ? trashMenuItems : driveMenuItems)
        .filter((menuItem) => !menuItem.hidden)
        .map((button) => (
            <DropdownMenuButton
                key={button.name}
                onContextMenu={(e) => e.stopPropagation()}
                className="flex flex-nowrap alignleft"
                onClick={(e) => {
                    e.stopPropagation();
                    button.action();
                    close();
                }}
                data-testid={button.testId}
            >
                <Icon className="mt0-25 mr0-5" name={button.icon} />
                {button.name}
            </DropdownMenuButton>
        ));
    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
            {menuButtons}
        </ContextMenu>
    );
};

export default withRouter(RowContextMenu);
