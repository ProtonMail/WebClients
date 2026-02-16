import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, ToolbarButton, usePopperAnchor } from '@proton/components';
import { generateNodeUid, getDrive } from '@proton/drive';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import type { IconName } from '@proton/icons/types';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useSharingModal } from '../../../../modals/SharingModal/SharingModal';
import type { DecryptedLink, useActions } from '../../../../store';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import { useMoveToFolderModal } from '../../../modals/MoveToFolderModal/MoveToFolderModal';
import { useRenameModalDeprecated } from '../../../modals/RenameModal';

interface Props {
    volumeId: string;
    shareId: string;
    selectedLinks: DecryptedLink[];
    permissions: SHARE_MEMBER_PERMISSIONS;
    trashLinks: ReturnType<typeof useActions>['trashLinks'];
    renameLink: ReturnType<typeof useActions>['renameLink'];
}

const ActionsDropdown = ({ volumeId, shareId, selectedLinks, permissions, trashLinks, renameLink }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [renameModal, showRenameModal] = useRenameModalDeprecated();
    const { sharingModal, showSharingModal } = useSharingModal();
    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

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
            action: () => showSharingModal({ nodeUid: generateNodeUid(volumeId, selectedLinkIds[0]) }),
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
            action: () =>
                showRenameModal({
                    isFile: selectedLinks[0].isFile,
                    name: selectedLinks[0].name,
                    isDoc: isProtonDocsDocument(selectedLinks[0].mimeType),
                    volumeId: selectedLinks[0].volumeId,
                    linkId: selectedLinks[0].linkId,
                    onSubmit: (formattedName) =>
                        renameLink(
                            new AbortController().signal,
                            selectedLinks[0].rootShareId,
                            selectedLinks[0].linkId,
                            formattedName
                        ),
                }),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showDetailsModal({ drive: getDrive(), volumeId, shareId, linkId: selectedLinkIds[0] }),
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
                icon={
                    <IcChevronDownFilled alt={c('Title').t`Show actions`} className={clsx(isOpen && 'rotateX-180')} />
                }
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
            {sharingModal}
        </>
    );
};

export default ActionsDropdown;
