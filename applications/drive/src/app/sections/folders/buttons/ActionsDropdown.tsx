import { type ReactElement, useState } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, ToolbarButton, usePopperAnchor } from '@proton/components';
import { MemberRole, generateNodeUid, getDrive } from '@proton/drive/index';
import { useMoveItemsModal } from '@proton/drive/modals/moveItemsModal';
import { useSharingModal } from '@proton/drive/modals/sharingModal';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { useDetailsModal } from '../../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import { useRenameModal } from '../../../modals/RenameModal';
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
    canShareSelectedItem: boolean;
}

export const ActionsDropdown = ({ volumeId, selectedItems, role, canShareSelectedItem }: Props) => {
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
        icon: ReactElement;
        testId: string;
        action: () => void;
    }[] = [
        {
            hidden: !canShareSelectedItem,
            name: c('Action').t`Share`,
            icon: <IcUserPlus />,
            testId: 'actions-dropdown-share-link',
            action: () =>
                // This is only used for standard folder view and not photos so we can force getDrive
                showSharingModal({ nodeUid: generateNodeUid(volumeId, selectedLinkIds[0]), drive: getDrive() }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to folder`,
            icon: <IcArrowsCross />,
            testId: 'actions-dropdown-move',
            action: () => showMoveItemsModal({ nodeUids: toNodeUidsHelper(selectedItems) }),
        },
        {
            hidden: isMultiSelect || !isEditor,
            name: c('Action').t`Rename`,
            icon: <IcPenSquare />,
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
            icon: <IcInfoCircle />,
            testId: 'actions-dropdown-details',
            action: () =>
                showDetailsModal({
                    nodeUid: generateNodeUid(selectedItems[0].volumeId, selectedLinkIds[0]),
                }),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: <IcInfoCircle />,
            testId: 'actions-dropdown-details',
            action: () => showFilesDetailsModal({ nodeUids: toNodeUidsHelper(selectedItems) }),
        },
        {
            hidden: !isEditor,
            name: c('Action').t`Move to trash`,
            icon: <IcTrash />,
            testId: 'actions-dropdown-trash',
            action: () =>
                trashItems(
                    getDrive(),
                    selectedItems.map((item) => ({
                        uid: generateNodeUid(item.volumeId, item.linkId),
                        parentUid: generateNodeUid(item.volumeId, item.parentLinkId),
                        name: item.name,
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
                className="flex flex-nowrap gap-2 items-center text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                    close();
                }}
                data-testid={item.testId}
            >
                {item.icon}
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
