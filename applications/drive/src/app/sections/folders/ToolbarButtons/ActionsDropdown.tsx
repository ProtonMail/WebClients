import { useState } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, ToolbarButton, usePopperAnchor } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';
import generateUID from '@proton/utils/generateUID';

import { useDetailsModal } from '../../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import { useMoveToFolderModal } from '../../../components/modals/MoveToFolderModal/MoveToFolderModal';
import { useRenameModal } from '../../../components/modals/RenameModal';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import { useActions } from '../../../store';

type Item = {
    isFile: boolean;
    name: string;
    mimeType: string;
    linkId: string;
    volumeId: string;
    rootShareId: string;
    parentLinkId: string;
};
interface Props {
    volumeId: string;
    shareId: string;
    selectedItems: Item[];
    role: MemberRole;
}

export const ActionsDropdown = ({ volumeId, shareId, selectedItems, role }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const isEditor = role === MemberRole.Editor;
    const isAdmin = role === MemberRole.Admin;
    const { renameLink, trashLinks } = useActions();
    const hasFoldersSelected = selectedItems.some((item) => !item.isFile);
    const isMultiSelect = selectedItems.length > 1;
    const selectedLinkIds = selectedItems.map(({ linkId }) => linkId);

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
            action: () => showLinkSharingModal({ volumeId, shareId, linkId: selectedLinkIds[0] }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to folder`,
            icon: 'arrows-cross',
            testId: 'actions-dropdown-move',
            action: () => showMoveToFolderModal({ shareId, selectedItems: selectedItems }),
        },
        {
            hidden: isMultiSelect || !isEditor,
            name: c('Action').t`Rename`,
            icon: 'pen-square',
            testId: 'actions-dropdown-rename',
            action: () =>
                showRenameModal({
                    isFile: selectedItems[0].isFile,
                    name: selectedItems[0].name,
                    isDoc: isProtonDocsDocument(selectedItems[0].mimeType),
                    volumeId: selectedItems[0].volumeId,
                    linkId: selectedItems[0].linkId,
                    onSubmit: (formattedName) =>
                        renameLink(
                            new AbortController().signal,
                            selectedItems[0].rootShareId,
                            selectedItems[0].linkId,
                            formattedName
                        ),
                }),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showDetailsModal({ shareId, linkId: selectedLinkIds[0], volumeId: '' }),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showFilesDetailsModal({ selectedItems: selectedItems }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to trash`,
            icon: 'trash',
            testId: 'actions-dropdown-trash',
            action: () => trashLinks(new AbortController().signal, selectedItems),
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
                disabled={!selectedItems.length}
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
