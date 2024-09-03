import { useMemo, useState } from 'react';

import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import type { IconName } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, ToolbarButton, usePopperAnchor } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';

import type { DecryptedLink } from '../../../../store';
import { useActions } from '../../../../store';
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
    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    const menuItems: {
        hidden: boolean;
        name: string;
        icon: IconName;
        testId: string;
        action: () => void;
    }[] = [
        {
            hidden: isMultiSelect || !isAdmin,
            name: c('Action').t`Share`,
            icon: 'user-plus',
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
    ];

    const dropdownMenuButtons = menuItems
        .filter((menuItem) => !menuItem.hidden)
        .map((item) => (
            <DropdownMenuButton
                key={item.name}
                hidden={item.hidden}
                onContextMenu={(e) => e.stopPropagation()}
                className="flex flex-nowrap items-center text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                    close();
                }}
                data-testid={item.testId}
            >
                <Icon className="mr-2" name={item.icon} />
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
