import { useMemo, useState } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    IconName,
    ToolbarButton,
    generateUID,
    usePopperAnchor,
} from '@proton/components';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';

import { DecryptedLink, useActions } from '../../../../store';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import { useMoveToFolderModal } from '../../../modals/MoveToFolderModal/MoveToFolderModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    permissions: SHARE_MEMBER_PERMISSIONS;
}

const ActionsDropdown = ({ shareId, selectedLinks, permissions }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const { trashLinks } = useActions();

    const hasFoldersSelected = selectedLinks.some((item) => !item.isFile);
    const isMultiSelect = selectedLinks.length > 1;
    const hasSharedLink = !!selectedLinks[0]?.shareUrl;
    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    const menuItems: {
        hidden: boolean;
        name: string;
        icon: IconName;
        testId: string;
        action: () => void;
    }[] = [
        {
            hidden: isMultiSelect || hasFoldersSelected || !isAdmin,
            name: hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`,
            icon: 'link',
            testId: 'actions-dropdown-share-link',
            action: () => showLinkSharingModal({ shareId: shareId, linkId: selectedLinkIds[0] }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to folder`,
            icon: 'arrows-cross',
            testId: 'actions-dropdown-move',
            action: () => showMoveToFolderModal({ shareId, selectedItems: selectedLinks }),
        },
        {
            hidden: isMultiSelect || !isEditor,
            name: c('Action').t`Rename`,
            icon: 'pen-square',
            testId: 'actions-dropdown-rename',
            action: () => showRenameModal({ item: selectedLinks[0] }),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showDetailsModal({ shareId, linkId: selectedLinkIds[0] }),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showFilesDetailsModal({ selectedItems: selectedLinks }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to trash`,
            icon: 'trash',
            testId: 'actions-dropdown-trash',
            action: () => trashLinks(new AbortController().signal, selectedLinks),
        },
        {
            hidden: isMultiSelect || !isEditor,
            name: hasSharedLink ? c('Action').t`Sharing options` : c('Action').t`Share via link`,
            icon: 'link',
            testId: 'actions-dropdown-share-link',
            action: () => showLinkSharingModal({ shareId: shareId, linkId: selectedLinks[0].linkId }),
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
                <Icon className="mt-1 mr-2" name={item.icon} />
                {item.name}
            </DropdownMenuButton>
        ));

    return (
        <>
            <ToolbarButton
                disabled={!selectedLinks.length}
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={<Icon name="chevron-down-filled" alt={c('Title').t`Show actions`} rotate={isOpen ? 180 : 0} />}
                data-testid="actions-dropdown"
                title={c('Title').t`Show actions`}
            />
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
            {filesDetailsModal}
            {detailsModal}
            {moveToFolderModal}
            {renameModal}
            {linkSharingModal}
        </>
    );
};

export default ActionsDropdown;
