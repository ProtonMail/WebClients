import React, { useEffect } from 'react';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';

import { ContextMenu, DropdownMenuButton, Icon, isPreviewAvailable } from 'react-components';

import { FileBrowserItem } from './interfaces';
import { LinkType } from '../../interfaces/link';
import { toLinkURLType } from '../Drive/helpers';
import { useDriveContent } from '../Drive/DriveContentProvider';
import useToolbarActions from '../../hooks/drive/useToolbarActions';

interface Props extends RouteComponentProps {
    item: FileBrowserItem;
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

const RowContextMenu = ({ item, anchorRef, isOpen, position, open, close, history }: Props) => {
    const { download, openDetails, openMoveToFolder, openMoveToTrash, openRename, preview } = useToolbarActions();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const allItems = [item, ...selectedItems.filter((selectedItem) => selectedItem.LinkID !== item.LinkID)];
    const isMultiSelect = allItems.length > 1;
    const hasFoldersSelected = allItems.some((item) => item.Type === LinkType.FOLDER);
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

    const menuButtons = [
        {
            hidden: isPreviewHidden,
            name: c('Action').t`Preview`,
            icon: 'read',
            action: () => preview(item, openLink),
        },
        {
            hidden: false,
            name: c('Action').t`Download`,
            icon: 'download',
            action: () => download(allItems),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Rename`,
            icon: 'file-edit',
            action: () => openRename(item),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info',
            action: () => openDetails(item),
        },
        {
            hidden: false,
            name: c('Action').t`Move to Folder`,
            icon: 'arrow-cross',
            action: () => openMoveToFolder(allItems),
        },
        {
            hidden: false,
            name: c('Action').t`Move to Trash`,
            icon: 'trash',
            action: () => openMoveToTrash(allItems),
        },
    ]
        .filter((button) => !button.hidden)
        .map((button) => (
            <DropdownMenuButton
                key={button.name}
                onContextMenu={(e) => e.stopPropagation()}
                className="flex flex-nowrap alignleft"
                onClick={button.action}
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
