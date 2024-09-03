import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import { Dropdown, DropdownCaret, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortParams } from '../FileBrowser/interface';

export default function SortDropdown<T extends string>({
    sortFields,
    sortField,
    onSort,
    className,
}: {
    sortFields?: T[];
    sortField: SortParams<T>['sortField'];
    onSort?: (sortParams: SortParams<T>) => void;
    className?: string;
}) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const dropdownMenuButtons = sortFields?.map((sortFieldToCheck) => (
        <DropdownMenuButton
            key={sortFieldToCheck}
            className="flex flex-nowrap text-left"
            onClick={() => onSort?.({ sortField: sortFieldToCheck, sortOrder: SORT_DIRECTION.ASC })}
            aria-current={sortField === sortFieldToCheck}
        >
            {translateSortField(sortFieldToCheck)}
        </DropdownMenuButton>
    ));

    return (
        <>
            <Button
                className={className}
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
                <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon my-auto" size={4} />
            </Button>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                originalPlacement="bottom-start"
                className="dropdown--no-max-size"
            >
                <DropdownMenu>{dropdownMenuButtons}</DropdownMenu>
            </Dropdown>
        </>
    );
}

export function translateSortField(sortField: string): string {
    const translations: Record<string, string> = {
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
        numAccesses: c('Label').t`# of downloads`,
        sharedOn: c('Label').t`Shared by`,
        sharedBy: c('Label').t`Shared on`,
        trashed: c('Label').t`Deleted`,
    };
    return translations[sortField];
}
