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
import { AllSortKeys, SortParams } from '../../../interfaces/link';

export interface MenuItem<T extends AllSortKeys> {
    name: string;
    icon: string;
    sortParams: SortParams<T>;
}

function SortDropdown<T extends AllSortKeys>({
    menuItems,
    sortParams,
    setSorting,
}: {
    menuItems: MenuItem<T>[];
    sortParams: SortParams<T>;
    setSorting: (sortParams: SortParams<T>) => void;
}) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const assertSorting = useCallback(
        (itemSortParams: SortParams<T>) =>
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
            onClick={() => setSorting({ sortField: item.sortParams.sortField, sortOrder: item.sortParams.sortOrder })}
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
}

export default SortDropdown;
