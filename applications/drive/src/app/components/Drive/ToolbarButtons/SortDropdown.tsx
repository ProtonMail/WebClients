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
            icon: 'arrow-down',
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Name: Z to A`,
            icon: 'arrow-up',
            sortField: 'Name',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Modified Date: New to Old`,
            icon: 'sort-new-old',
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Modified Date: Old to New`,
            icon: 'sort-old-new',
            sortField: 'ModifyTime',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Type: A to Z`,
            icon: 'arrow-down',
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Type: Z to A`,
            icon: 'arrow-up',
            sortField: 'MIMEType',
            sortOrder: SORT_DIRECTION.DESC,
        },
        {
            name: c('Action').t`Size: Small to Large`,
            icon: 'sort-small-large',
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.ASC,
        },
        {
            name: c('Action').t`Size: Large to Small`,
            icon: 'sort-large-small',
            sortField: 'Size',
            sortOrder: SORT_DIRECTION.DESC,
        },
    ];

    const toolbarButtonIcon =
        menuItems.find((item) => item.sortField === sortParams.sortField && item.sortOrder === sortParams.sortOrder)
            ?.icon || 'sort-old-new';
    const dropdownMenuButtons = menuItems.map((item) => (
        <DropdownMenuButton
            key={item.name}
            className="flex flex-nowrap alignleft"
            onClick={() => setSorting(item.sortField, item.sortOrder)}
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
                title={c('Title').t`Sort Files/Folders`}
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" />
            </ToolbarButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SortDropdown;
