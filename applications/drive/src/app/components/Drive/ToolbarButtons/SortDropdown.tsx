import React, { useState } from 'react';
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
} from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

import { useDriveContent } from '../DriveContentProvider';
import { SortKeys } from '../../../interfaces/link';

const SortDropdown = () => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { sortParams, setSorting } = useDriveContent();

    const menuItems: {
        name: string;
        icon: string;
        sortField: SortKeys;
        sortOrder: SORT_DIRECTION;
    }[] = [
        {
            name: c('Action').t`Name: A to Z`,
            icon: 'arrow-up',
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Name: Z to A`,
            icon: 'arrow-down',
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Modified date: new to old`,
            icon: 'sort-new-old',
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Modified date: old to new`,
            icon: 'sort-old-new',
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Type: A to Z`,
            icon: 'arrow-up',
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Type: Z to A`,
            icon: 'arrow-down',
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Size: small to large`,
            icon: 'sort-small-large',
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Size: large to small`,
            icon: 'sort-large-small',
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.DESC,
        },
    ];

    const toolbarButtonIcon = (
        <Icon
            name={
                menuItems.find(
                    (item) => item.sortField === sortParams.sortField && item.sortOrder === sortParams.sortOrder
                )?.icon || 'sort-old-new'
            }
        />
    );
    const dropdownMenuButtons = menuItems.map((item) => (
        <DropdownMenuButton
            key={item.name}
            className="flex flex-nowrap text-left"
            onClick={() => setSorting(item.sortField, item.sortOrder)}
            aria-current={item.sortField === sortParams.sortField && item.sortOrder === sortParams.sortOrder}
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
