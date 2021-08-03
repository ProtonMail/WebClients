import { useState, useCallback } from 'react';
import { c } from 'ttag';

import {
    generateUID,
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    Icon,
    DropdownMenuButton,
    ToolbarButton,
    DropdownCaret,
} from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { DriveSortParams, useDriveContent } from '../DriveContentProvider';

const menuItems: {
    name: string;
    icon: string;
    sortParams: DriveSortParams;
}[] = [
    {
        name: c('Action').t`Name: A to Z`,
        icon: 'arrow-up',
        sortParams: {
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Name: Z to A`,
        icon: 'arrow-down',
        sortParams: {
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Modified date: new to old`,
        icon: 'sort-new-old',
        sortParams: {
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Modified date: old to new`,
        icon: 'sort-old-new',
        sortParams: {
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Type: A to Z`,
        icon: 'arrow-up',
        sortParams: {
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Type: Z to A`,
        icon: 'arrow-down',
        sortParams: {
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
    {
        name: c('Action').t`Size: small to large`,
        icon: 'sort-small-large',
        sortParams: {
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.ASC,
        },
    },
    {
        name: c('Action').t`Size: large to small`,
        icon: 'sort-large-small',
        sortParams: {
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.DESC,
        },
    },
];

const SortDropdown = () => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { sortParams, setSorting } = useDriveContent();

    const assertSorting = useCallback(
        (itemSortParams: DriveSortParams) =>
            sortParams.sortField === itemSortParams.sortField && sortParams.sortOrder === itemSortParams.sortOrder,
        [sortParams]
    );

    const toolbarButtonIcon = (
        <Icon name={menuItems.find((item) => assertSorting(item.sortParams))?.icon || 'sort-old-new'} />
    );
    const dropdownMenuButtons = menuItems.map((item) => (
        <DropdownMenuButton
            key={item.name}
            className="flex flex-nowrap text-left"
            onClick={() => setSorting(item.sortParams.sortField, item.sortParams.sortOrder)}
            aria-current={assertSorting(item.sortParams)}
        >
            <Icon className="mt0-25 mr0-5" name={item.icon} />
            {item.name}
        </DropdownMenuButton>
    ));

    return (
        <>
            <ToolbarButton
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                icon={toolbarButtonIcon}
                data-testid="toolbar-sort"
                title={c('Title').t`Sort files/folders`}
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" />
            </ToolbarButton>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom"
                className="dropdown--no-max-size"
            >
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SortDropdown;
