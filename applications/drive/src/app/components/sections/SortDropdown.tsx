import { useState } from 'react';
import { c } from 'ttag';

import {
    generateUID,
    usePopperAnchor,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Button,
    DropdownCaret,
} from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SortField, SortParams } from '@proton/shared/lib/interfaces/drive/fileBrowser';

export interface MenuItem<T extends SortField> {
    name: string;
    icon: string;
    sortField: T;
}

export default function SortDropdown<T extends SortField>({
    sortFields,
    sortParams,
    setSorting,
}: {
    sortFields: T[];
    sortParams: SortParams<T>;
    setSorting: (sortParams: SortParams<T>) => void;
}) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const dropdownMenuButtons = sortFields.map((sortField) => (
        <DropdownMenuButton
            key={sortField}
            className="flex flex-nowrap text-left"
            onClick={() => setSorting({ sortField, sortOrder: SORT_DIRECTION.ASC })}
            aria-current={sortParams.sortField === sortField}
        >
            {translateSortField(sortField)}
        </DropdownMenuButton>
    ));

    return (
        <>
            <Button
                aria-describedby={uid}
                ref={anchorRef}
                aria-expanded={isOpen}
                onClick={toggle}
                data-testid="toolbar-sort"
                title={c('Title').t`Sort files/folders`}
                shape="ghost"
                size="small"
                icon
            >
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon mtauto mbauto" size={16} />
            </Button>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-left"
                className="dropdown--no-max-size"
            >
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
}

export function translateSortField(sortField: SortField): string {
    const translations: Record<SortField, string> = {
        name: c('Label').t`Name`,
        size: c('Label').t`Size`,
        // Type is not used (in UI) at this moment, but users might have set
        // it, so we keep the code, so it continue to work until user changes
        // the sorting. Also, we might get it back at some point.
        mimeType: c('Label').t`Type`,
        fileModifyTime: c('Label').t`Modified`,
        metaDataModifyTime: c('Label').t`Modified`,
        linkCreateTime: c('Label').t`Created`,
        linkExpireTime: c('Label').t`Expires`,
        numAccesses: c('Label').t`# of accesses`,
        trashed: c('Label').t`Deleted`,
    };
    return translations[sortField];
}
