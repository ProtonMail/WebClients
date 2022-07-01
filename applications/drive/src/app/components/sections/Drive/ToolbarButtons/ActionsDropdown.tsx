import { useState } from 'react';
import { c } from 'ttag';

import {
    generateUID,
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    Icon,
    IconName,
    DropdownMenuButton,
    ToolbarButton,
} from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';
import useToolbarActions from '../../../useOpenModal';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const ActionsDropdown = ({ shareId, selectedLinks }: Props) => {
    const [uid] = useState(generateUID('actions-dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { openDetails, openFilesDetails, openMoveToFolder, openRename, openLinkSharing } = useToolbarActions();
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
            hidden: isMultiSelect || hasFoldersSelected,
            name: hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`,
            icon: 'link',
            testId: 'actions-dropdown-share-link',
            action: () => openLinkSharing(shareId, selectedLinkIds[0]),
        },
        {
            hidden: false,
            name: c('Action').t`Move to folder`,
            icon: 'arrows-cross',
            testId: 'actions-dropdown-move',
            action: () => openMoveToFolder(shareId, selectedLinks),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Rename`,
            icon: 'pen-square',
            testId: 'actions-dropdown-rename',
            action: () => openRename(shareId, selectedLinks[0]),
        },
        {
            hidden: isMultiSelect,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => openDetails(shareId, selectedLinkIds[0]),
        },
        {
            hidden: !isMultiSelect || hasFoldersSelected,
            name: c('Action').t`Details`,
            icon: 'info-circle',
            testId: 'actions-dropdown-details',
            action: () => openFilesDetails(shareId, selectedLinkIds),
        },
        {
            hidden: false,
            name: c('Action').t`Move to trash`,
            icon: 'trash',
            testId: 'actions-dropdown-trash',
            action: () => trashLinks(new AbortController().signal, shareId, selectedLinks),
        },
        {
            hidden: isMultiSelect,
            name: hasSharedLink ? c('Action').t`Sharing options` : c('Action').t`Share via link`,
            icon: 'link',
            testId: 'actions-dropdown-share-link',
            action: () => openLinkSharing(shareId, selectedLinkIds[0]),
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
                disabled={!selectedLinks.length}
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={<Icon name="chevron-down-filled" rotate={isOpen ? 180 : 0} />}
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
