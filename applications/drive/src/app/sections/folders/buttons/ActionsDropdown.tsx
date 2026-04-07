import { useState } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, ToolbarButton, usePopperAnchor } from '@proton/components';
import { MemberRole, generateNodeUid, getDrive } from '@proton/drive/index';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import { useMoveItemsModal } from '../../../modals/MoveItemsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import { useTrashActions } from '../../commonActions/useTrashActions';

export const toNodeUidsHelper = <T extends { volumeId: string; linkId: string }>(items: T[]): string[] =>
    items.map((item) => generateNodeUid(item.volumeId, item.linkId));

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
    selectedItems: Item[];
    role: MemberRole;
    canShareSingleItem: boolean;
}

export const ActionsDropdown = ({ volumeId, selectedItems, role, canShareSingleItem }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { filesDetailsModal, showFilesDetailsModal } = useFilesDetailsModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const isEditor = role === MemberRole.Editor;
    const { trashItems } = useTrashActions();
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
            hidden: !canShareSingleItem,
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
            action: () => showMoveItemsModal({ nodeUids: toNodeUidsHelper(selectedItems) }),
        },
        {
            hidden: isMultiSelect || !isEditor,
            name: c('Action').t`Rename`,
            icon: 'pen-square',
            testId: 'actions-dropdown-rename',
            action: () => {
                showRenameModal({
                    nodeUid: generateNodeUid(selectedItems[0].volumeId, selectedItems[0].linkId),
                });
            },
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () =>
                showDetailsModal({
                    nodeUid: generateNodeUid(selectedItems[0].volumeId, selectedLinkIds[0]),
                }),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => showFilesDetailsModal({ nodeUids: toNodeUidsHelper(selectedItems) }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to trash`,
            icon: 'trash',
            testId: 'actions-dropdown-trash',
            action: () =>
                trashItems(
                    getDrive(),
                    selectedItems.map((item) => ({
                        uid: generateNodeUid(item.volumeId, item.linkId),
                        parentUid: generateNodeUid(item.volumeId, item.parentLinkId),
                    }))
                ),
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
            {moveItemsModal}
            {renameModal}
            {sharingModal}
        </>
    );
};
